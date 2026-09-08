import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
});

export const householdMembers = pgTable("household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").notNull().default("admin"),
  appRole: text("app_role").notNull().default("user"),
  ...timestamps,
}, (table) => [
  uniqueIndex("household_members_user_id_unique").on(table.userId),
  index("household_members_household_id_idx").on(table.householdId),
]);

export const householdInvitations = pgTable("household_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  invitedBy: text("invited_by").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("household_invitations_household_email_unique").on(table.householdId, table.email),
  index("household_invitations_email_idx").on(table.email),
]);

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  clientKey: text("client_key").notNull(),
  name: text("name").notNull(),
  sourceUrl: text("source_url"),
  emoji: text("emoji").notNull().default("🍽️"),
  tone: text("tone").notNull().default("custom"),
  category: text("category").notNull().default("Dinner"),
  tag: text("tag").notNull().default("My recipe"),
  prepMinutes: integer("prep_minutes").notNull().default(30),
  servings: integer("servings").notNull().default(4),
  instructions: text("instructions"),
  imageUrl: text("image_url"),
  createdBy: text("created_by").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("recipes_household_client_key_unique").on(table.householdId, table.clientKey),
  index("recipes_household_name_idx").on(table.householdId, table.name),
]);

export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  aisle: text("aisle").notNull().default("Other"),
  defaultUnit: text("default_unit"),
  ...timestamps,
}, (table) => [
  uniqueIndex("ingredients_household_name_unique").on(table.householdId, table.normalizedName),
]);

export const recipeIngredients = pgTable("recipe_ingredients", {
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "restrict" }),
  amount: text("amount").notNull().default("1"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }),
  unit: text("unit"),
  position: integer("position").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.recipeId, table.ingredientId] }),
  index("recipe_ingredients_ingredient_id_idx").on(table.ingredientId),
]);

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  defaultServings: integer("default_servings").notNull().default(4),
  ...timestamps,
}, (table) => [
  uniqueIndex("meal_plans_household_week_unique").on(table.householdId, table.weekStart),
]);

export const mealPlanEntries = pgTable("meal_plan_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  mealPlanId: uuid("meal_plan_id").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
  recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  plannedFor: date("planned_for").notNull(),
  mealType: text("meal_type").notNull().default("dinner"),
  servings: integer("servings").notNull().default(4),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps,
}, (table) => [
  uniqueIndex("meal_plan_entries_slot_unique").on(table.mealPlanId, table.plannedFor, table.mealType),
  index("meal_plan_entries_recipe_id_idx").on(table.recipeId),
]);

export const pantryItems = pgTable("pantry_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("0"),
  unit: text("unit"),
  minimumQuantity: numeric("minimum_quantity", { precision: 12, scale: 3 }).notNull().default("0"),
  expiresOn: date("expires_on"),
  location: text("location").notNull().default("fridge"),
  status: text("status").notNull().default("available"),
  ...timestamps,
}, (table) => [
  uniqueIndex("pantry_items_household_name_unique").on(table.householdId, table.normalizedName),
  index("pantry_items_expiry_idx").on(table.householdId, table.expiresOn),
]);

export const shoppingLists = pgTable("shopping_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  status: text("status").notNull().default("active"),
  ...timestamps,
}, (table) => [
  uniqueIndex("shopping_lists_household_week_unique").on(table.householdId, table.weekStart),
]);

export const shoppingListItems = pgTable("shopping_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  shoppingListId: uuid("shopping_list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  amount: text("amount").notNull().default("1"),
  aisle: text("aisle").notNull().default("Other"),
  checked: boolean("checked").notNull().default(false),
  pantrySkipped: boolean("pantry_skipped").notNull().default(false),
  source: text("source").notNull().default("meal_plan"),
  position: integer("position").notNull().default(0),
  ...timestamps,
}, (table) => [
  index("shopping_list_items_list_checked_idx").on(table.shoppingListId, table.checked),
]);

export const retailerCartExports = pgTable("retailer_cart_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  shoppingListId: uuid("shopping_list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  retailer: text("retailer").notNull(),
  status: text("status").notNull().default("pending"),
  externalCartId: text("external_cart_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("retailer_cart_exports_list_idx").on(table.shoppingListId),
]);

export const externalConnections = pgTable("external_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("disabled"),
  accountLabel: text("account_label"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("external_connections_household_provider_unique").on(table.householdId, table.provider),
]);
