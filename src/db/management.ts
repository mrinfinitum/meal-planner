import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "./index";
import { ensureHouseholdForUser } from "./households";
import {
  externalConnections,
  householdInvitations,
  householdMembers,
  households,
  ingredients,
  recipeIngredients,
  recipes,
} from "./schema";

type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

const providerCredentials: Record<string, string[]> = {
  walmart: ["WALMART_CLIENT_ID", "WALMART_CLIENT_SECRET"],
  amazon: ["AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET"],
  target: ["TARGET_CLIENT_ID", "TARGET_CLIENT_SECRET"],
};

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

async function requireHouseholdAdmin(user: AuthUser) {
  const household = await ensureHouseholdForUser(user);
  if (household.role !== "admin") throw new Error("HOUSEHOLD_ADMIN_REQUIRED");
  return household;
}

async function requireAppAdmin(user: AuthUser) {
  const household = await ensureHouseholdForUser(user);
  if (household.appRole !== "admin") throw new Error("APP_ADMIN_REQUIRED");
  return household;
}

export async function getSettingsState(user: AuthUser) {
  const household = await ensureHouseholdForUser(user);
  const members = await db.select({
    id: householdMembers.id,
    userId: householdMembers.userId,
    email: householdMembers.email,
    displayName: householdMembers.displayName,
    role: householdMembers.role,
    appRole: householdMembers.appRole,
  }).from(householdMembers)
    .where(eq(householdMembers.householdId, household.id))
    .orderBy(asc(householdMembers.createdAt));
  const invitations = await db.select({
    id: householdInvitations.id,
    email: householdInvitations.email,
    role: householdInvitations.role,
    createdAt: householdInvitations.createdAt,
  }).from(householdInvitations)
    .where(eq(householdInvitations.householdId, household.id))
    .orderBy(asc(householdInvitations.createdAt));

  return { household, members, invitations };
}

export async function updateSettings(user: AuthUser, values: { householdName?: string; displayName?: string }) {
  const household = await ensureHouseholdForUser(user);
  const displayName = values.displayName?.trim();
  if (displayName) {
    await db.update(householdMembers)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(householdMembers.userId, user.id));
  }
  const householdName = values.householdName?.trim();
  if (householdName) {
    if (household.role !== "admin") throw new Error("HOUSEHOLD_ADMIN_REQUIRED");
    await db.update(households)
      .set({ name: householdName, updatedAt: new Date() })
      .where(eq(households.id, household.id));
  }
  return getSettingsState(user);
}

export async function inviteFamilyMember(user: AuthUser, emailValue: string) {
  const household = await requireHouseholdAdmin(user);
  const email = cleanEmail(emailValue);
  if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");
  const [member] = await db.select({ id: householdMembers.id }).from(householdMembers)
    .where(and(eq(householdMembers.householdId, household.id), eq(householdMembers.email, email)))
    .limit(1);
  if (member) throw new Error("ALREADY_A_MEMBER");

  await db.insert(householdInvitations).values({
    householdId: household.id,
    email,
    invitedBy: user.id,
  }).onConflictDoUpdate({
    target: [householdInvitations.householdId, householdInvitations.email],
    set: { invitedBy: user.id, updatedAt: new Date() },
  });
  return getSettingsState(user);
}

export async function removeFamilyAccess(user: AuthUser, input: { memberId?: string; invitationId?: string }) {
  const household = await requireHouseholdAdmin(user);
  if (input.memberId) {
    const [target] = await db.select({ userId: householdMembers.userId }).from(householdMembers)
      .where(and(eq(householdMembers.id, input.memberId), eq(householdMembers.householdId, household.id)))
      .limit(1);
    if (!target) throw new Error("MEMBER_NOT_FOUND");
    if (target.userId === user.id) throw new Error("CANNOT_REMOVE_SELF");
    await db.delete(householdMembers)
      .where(and(eq(householdMembers.id, input.memberId), eq(householdMembers.householdId, household.id)));
  } else if (input.invitationId) {
    await db.delete(householdInvitations)
      .where(and(eq(householdInvitations.id, input.invitationId), eq(householdInvitations.householdId, household.id)));
  } else {
    throw new Error("INVALID_REQUEST");
  }
  return getSettingsState(user);
}

export async function getAdminState(user: AuthUser) {
  const household = await requireAppAdmin(user);
  const recipeRows = await db.select({
    id: recipes.id,
    name: recipes.name,
    category: recipes.category,
    prepMinutes: recipes.prepMinutes,
    tag: recipes.tag,
    sourceUrl: recipes.sourceUrl,
  }).from(recipes).where(eq(recipes.householdId, household.id)).orderBy(asc(recipes.name));
  const ingredientRows = await db.select({
    id: ingredients.id,
    name: ingredients.name,
    aisle: ingredients.aisle,
  }).from(ingredients).where(eq(ingredients.householdId, household.id)).orderBy(asc(ingredients.name));
  const usages = await db.select({ ingredientId: recipeIngredients.ingredientId }).from(recipeIngredients)
    .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
    .where(eq(recipes.householdId, household.id));
  const useCounts = usages.reduce<Record<string, number>>((counts, item) => {
    counts[item.ingredientId] = (counts[item.ingredientId] ?? 0) + 1;
    return counts;
  }, {});
  const connectionRows = await db.select().from(externalConnections)
    .where(eq(externalConnections.householdId, household.id));
  const connectionMap = new Map(connectionRows.map((item) => [item.provider, item]));
  const connections = Object.keys(providerCredentials).map((provider) => ({
    id: connectionMap.get(provider)?.id,
    provider,
    status: connectionMap.get(provider)?.status ?? "disabled",
    accountLabel: connectionMap.get(provider)?.accountLabel ?? "",
    credentialsConfigured: providerCredentials[provider].every((key) => Boolean(process.env[key])),
  }));

  return {
    recipes: recipeRows,
    ingredients: ingredientRows.map((item) => ({ ...item, recipeCount: useCounts[item.id] ?? 0 })),
    connections,
  };
}

export async function updateAdminRecipe(user: AuthUser, input: { id: string; name: string; category: string; prepMinutes: number; tag: string }) {
  const household = await requireAppAdmin(user);
  const [recipe] = await db.update(recipes).set({
    name: input.name.trim(),
    category: input.category.trim() || "Dinner",
    prepMinutes: Math.max(1, Math.min(1440, Math.round(input.prepMinutes))),
    tag: input.tag.trim() || "My recipe",
    updatedAt: new Date(),
  }).where(and(eq(recipes.id, input.id), eq(recipes.householdId, household.id)))
    .returning({ id: recipes.id });
  if (!recipe) throw new Error("RECIPE_NOT_FOUND");
  return getAdminState(user);
}

export async function deleteAdminRecipe(user: AuthUser, id: string) {
  const household = await requireAppAdmin(user);
  await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.householdId, household.id)));
  return getAdminState(user);
}

export async function updateAdminIngredient(user: AuthUser, input: { id: string; name: string; aisle: string }) {
  const household = await requireAppAdmin(user);
  const name = input.name.trim();
  const [ingredient] = await db.update(ingredients).set({
    name,
    normalizedName: name.toLowerCase(),
    aisle: input.aisle.trim() || "Other",
    updatedAt: new Date(),
  }).where(and(eq(ingredients.id, input.id), eq(ingredients.householdId, household.id)))
    .returning({ id: ingredients.id });
  if (!ingredient) throw new Error("INGREDIENT_NOT_FOUND");
  return getAdminState(user);
}

export async function saveExternalConnection(user: AuthUser, input: { provider: string; enabled: boolean; accountLabel?: string }) {
  const household = await requireAppAdmin(user);
  if (!Object.hasOwn(providerCredentials, input.provider)) throw new Error("INVALID_PROVIDER");
  await db.insert(externalConnections).values({
    householdId: household.id,
    provider: input.provider,
    status: input.enabled ? "enabled" : "disabled",
    accountLabel: input.accountLabel?.trim() || null,
  }).onConflictDoUpdate({
    target: [externalConnections.householdId, externalConnections.provider],
    set: {
      status: input.enabled ? "enabled" : "disabled",
      accountLabel: input.accountLabel?.trim() || null,
      updatedAt: new Date(),
    },
  });
  return getAdminState(user);
}
