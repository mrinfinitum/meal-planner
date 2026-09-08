import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "./index";
import {
  householdMembers,
  households,
  ingredients,
  mealPlanEntries,
  mealPlans,
  pantryItems,
  recipeIngredients,
  recipes,
  shoppingListItems,
  shoppingLists,
} from "./schema";

type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type RecipeInput = {
  id: string;
  name: string;
  emoji: string;
  tone: string;
  time: number;
  category: string;
  tag: string;
  sourceUrl?: string;
  ingredients: Array<{ name: string; amount: string; aisle: string }>;
};

const starterRecipes: RecipeInput[] = [
  { id: "lemon-chicken", name: "Lemon herb chicken", emoji: "🍋", tone: "lemon", time: 35, category: "Dinner", tag: "Family favorite", ingredients: [{ name: "Chicken breasts", amount: "2 lb", aisle: "Meat & seafood" }, { name: "Lemons", amount: "3", aisle: "Produce" }, { name: "Baby potatoes", amount: "1.5 lb", aisle: "Produce" }, { name: "Fresh rosemary", amount: "1 bunch", aisle: "Produce" }] },
  { id: "tomato-orzo", name: "Creamy tomato orzo", emoji: "🍅", tone: "tomato", time: 25, category: "Dinner", tag: "One pot", ingredients: [{ name: "Orzo", amount: "12 oz", aisle: "Pantry" }, { name: "Cherry tomatoes", amount: "2 pints", aisle: "Produce" }, { name: "Heavy cream", amount: "1 cup", aisle: "Dairy & eggs" }, { name: "Parmesan", amount: "4 oz", aisle: "Dairy & eggs" }, { name: "Baby spinach", amount: "5 oz", aisle: "Produce" }] },
  { id: "salmon-bowls", name: "Salmon rice bowls", emoji: "🐟", tone: "salmon", time: 30, category: "Dinner", tag: "High protein", ingredients: [{ name: "Salmon fillets", amount: "4", aisle: "Meat & seafood" }, { name: "Jasmine rice", amount: "2 cups", aisle: "Pantry" }, { name: "Avocados", amount: "2", aisle: "Produce" }, { name: "Cucumbers", amount: "2", aisle: "Produce" }, { name: "Soy sauce", amount: "1 bottle", aisle: "Pantry" }] },
  { id: "taco-night", name: "Taco night", emoji: "🌮", tone: "taco", time: 20, category: "Dinner", tag: "Kid friendly", ingredients: [{ name: "Ground turkey", amount: "1.5 lb", aisle: "Meat & seafood" }, { name: "Corn tortillas", amount: "16", aisle: "Bakery" }, { name: "Shredded cheese", amount: "8 oz", aisle: "Dairy & eggs" }, { name: "Limes", amount: "3", aisle: "Produce" }, { name: "Romaine lettuce", amount: "1 head", aisle: "Produce" }] },
  { id: "pesto-pasta", name: "Garden pesto pasta", emoji: "🌿", tone: "herb", time: 22, category: "Dinner", tag: "Vegetarian", ingredients: [{ name: "Penne pasta", amount: "1 lb", aisle: "Pantry" }, { name: "Basil pesto", amount: "8 oz", aisle: "Pantry" }, { name: "Zucchini", amount: "2", aisle: "Produce" }, { name: "Parmesan", amount: "4 oz", aisle: "Dairy & eggs" }] },
  { id: "pancakes", name: "Sunday berry pancakes", emoji: "🥞", tone: "berry", time: 25, category: "Breakfast", tag: "Weekend", ingredients: [{ name: "Pancake mix", amount: "1 box", aisle: "Pantry" }, { name: "Blueberries", amount: "1 pint", aisle: "Produce" }, { name: "Eggs", amount: "6", aisle: "Dairy & eggs" }, { name: "Maple syrup", amount: "1 bottle", aisle: "Pantry" }] },
  { id: "soup", name: "Cozy vegetable soup", emoji: "🥕", tone: "carrot", time: 45, category: "Lunch", tag: "Freezer friendly", ingredients: [{ name: "Carrots", amount: "6", aisle: "Produce" }, { name: "Celery", amount: "1 bunch", aisle: "Produce" }, { name: "Vegetable stock", amount: "2 cartons", aisle: "Pantry" }, { name: "Cannellini beans", amount: "2 cans", aisle: "Pantry" }] },
  { id: "pizza", name: "Homemade pizza night", emoji: "🍕", tone: "pizza", time: 40, category: "Dinner", tag: "Hands-on", ingredients: [{ name: "Pizza dough", amount: "2 balls", aisle: "Bakery" }, { name: "Mozzarella", amount: "12 oz", aisle: "Dairy & eggs" }, { name: "Pizza sauce", amount: "1 jar", aisle: "Pantry" }, { name: "Bell peppers", amount: "2", aisle: "Produce" }] },
];

function normalizedName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function mondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - day + 1);
  return now.toISOString().slice(0, 10);
}

function datePlusDays(isoDate: string, days: number) {
  const value = new Date(`${isoDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function seedHousehold(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  householdId: string,
  userId: string,
) {
  const recipeIds = new Map<string, string>();

  for (const recipe of starterRecipes) {
    const [savedRecipe] = await transaction.insert(recipes).values({
      householdId,
      clientKey: recipe.id,
      name: recipe.name,
      emoji: recipe.emoji,
      tone: recipe.tone,
      prepMinutes: recipe.time,
      category: recipe.category,
      tag: recipe.tag,
      createdBy: userId,
    }).returning({ id: recipes.id });

    recipeIds.set(recipe.id, savedRecipe.id);

    for (const [position, item] of recipe.ingredients.entries()) {
      const [savedIngredient] = await transaction.insert(ingredients).values({
        householdId,
        name: item.name,
        normalizedName: normalizedName(item.name),
        aisle: item.aisle,
      }).onConflictDoUpdate({
        target: [ingredients.householdId, ingredients.normalizedName],
        set: { name: item.name, aisle: item.aisle, updatedAt: new Date() },
      }).returning({ id: ingredients.id });

      await transaction.insert(recipeIngredients).values({
        recipeId: savedRecipe.id,
        ingredientId: savedIngredient.id,
        amount: item.amount,
        position,
      });
    }
  }

  const weekStart = mondayOfCurrentWeek();
  const [mealPlan] = await transaction.insert(mealPlans).values({ householdId, weekStart }).returning({ id: mealPlans.id });
  const initialPlan = ["lemon-chicken", "tomato-orzo", "salmon-bowls", "taco-night", "pesto-pasta", null, "pancakes"];

  for (const [dayIndex, clientKey] of initialPlan.entries()) {
    if (!clientKey) continue;
    await transaction.insert(mealPlanEntries).values({
      mealPlanId: mealPlan.id,
      recipeId: recipeIds.get(clientKey),
      plannedFor: datePlusDays(weekStart, dayIndex),
    });
  }

  await transaction.insert(shoppingLists).values({ householdId, weekStart });
  await transaction.insert(pantryItems).values([
    { householdId, name: "Baby spinach", normalizedName: "baby spinach", quantity: "0.28", unit: "bag", location: "fridge", status: "use_soon" },
    { householdId, name: "Greek yogurt", normalizedName: "greek yogurt", quantity: "1", unit: "cup", location: "fridge", status: "low" },
    { householdId, name: "Avocados", normalizedName: "avocados", quantity: "2", unit: "each", location: "fridge", status: "ready" },
  ]);
}

export async function ensureHouseholdForUser(user: AuthUser) {
  const [existing] = await db.select({
    id: households.id,
    name: households.name,
    role: householdMembers.role,
  }).from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, user.id))
    .limit(1);

  if (existing) return existing;

  return db.transaction(async (transaction) => {
    const firstName = user.name?.trim().split(/\s+/)[0];
    const [household] = await transaction.insert(households).values({
      name: firstName ? `${firstName}'s household` : "My household",
    }).returning({ id: households.id, name: households.name });

    await transaction.insert(householdMembers).values({
      householdId: household.id,
      userId: user.id,
      email: user.email,
      displayName: user.name,
      role: "admin",
    });

    await seedHousehold(transaction, household.id, user.id);
    return { ...household, role: "admin" };
  });
}

export async function saveRecipeAndAddToShoppingList(user: AuthUser, recipe: RecipeInput) {
  const household = await ensureHouseholdForUser(user);
  const weekStart = mondayOfCurrentWeek();

  return db.transaction(async (transaction) => {
    const [savedRecipe] = await transaction.insert(recipes).values({
      householdId: household.id,
      clientKey: recipe.id,
      name: recipe.name,
      sourceUrl: recipe.sourceUrl,
      emoji: recipe.emoji,
      tone: recipe.tone,
      prepMinutes: recipe.time,
      category: recipe.category,
      tag: recipe.tag,
      createdBy: user.id,
    }).onConflictDoUpdate({
      target: [recipes.householdId, recipes.clientKey],
      set: {
        name: recipe.name,
        sourceUrl: recipe.sourceUrl,
        emoji: recipe.emoji,
        tone: recipe.tone,
        prepMinutes: recipe.time,
        category: recipe.category,
        tag: recipe.tag,
        updatedAt: new Date(),
      },
    }).returning({ id: recipes.id });

    await transaction.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, savedRecipe.id));

    const [shoppingList] = await transaction.insert(shoppingLists).values({
      householdId: household.id,
      weekStart,
    }).onConflictDoUpdate({
      target: [shoppingLists.householdId, shoppingLists.weekStart],
      set: { updatedAt: new Date() },
    }).returning({ id: shoppingLists.id });

    const existingShoppingItems = await transaction.select({ name: shoppingListItems.name })
      .from(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, shoppingList.id));
    const namesOnList = new Set(existingShoppingItems.map((item) => normalizedName(item.name)));

    for (const [position, item] of recipe.ingredients.entries()) {
      const normalized = normalizedName(item.name);
      const [savedIngredient] = await transaction.insert(ingredients).values({
        householdId: household.id,
        name: item.name,
        normalizedName: normalized,
        aisle: item.aisle,
      }).onConflictDoUpdate({
        target: [ingredients.householdId, ingredients.normalizedName],
        set: { name: item.name, aisle: item.aisle, updatedAt: new Date() },
      }).returning({ id: ingredients.id });

      await transaction.insert(recipeIngredients).values({
        recipeId: savedRecipe.id,
        ingredientId: savedIngredient.id,
        amount: item.amount,
        position,
      });

      if (!namesOnList.has(normalized)) {
        await transaction.insert(shoppingListItems).values({
          shoppingListId: shoppingList.id,
          ingredientId: savedIngredient.id,
          name: item.name,
          amount: item.amount,
          aisle: item.aisle,
          source: "recipe_import",
          position,
        });
        namesOnList.add(normalized);
      }
    }

    return { ...recipe, databaseId: savedRecipe.id };
  });
}

export async function getHouseholdAppState(user: AuthUser) {
  const household = await ensureHouseholdForUser(user);
  const weekStart = mondayOfCurrentWeek();
  const weekEnd = datePlusDays(weekStart, 6);

  const recipeRows = await db.select({
    id: recipes.clientKey,
    name: recipes.name,
    emoji: recipes.emoji,
    tone: recipes.tone,
    time: recipes.prepMinutes,
    category: recipes.category,
    tag: recipes.tag,
    sourceUrl: recipes.sourceUrl,
    ingredientName: ingredients.name,
    ingredientAmount: recipeIngredients.amount,
    ingredientAisle: ingredients.aisle,
    ingredientPosition: recipeIngredients.position,
  }).from(recipes)
    .leftJoin(recipeIngredients, eq(recipeIngredients.recipeId, recipes.id))
    .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipes.householdId, household.id))
    .orderBy(asc(recipes.createdAt), asc(recipeIngredients.position));

  const recipeMap = new Map<string, RecipeInput>();
  for (const row of recipeRows) {
    const recipe = recipeMap.get(row.id) ?? {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      tone: row.tone,
      time: row.time,
      category: row.category,
      tag: row.tag,
      sourceUrl: row.sourceUrl ?? undefined,
      ingredients: [],
    };
    if (row.ingredientName) {
      recipe.ingredients.push({
        name: row.ingredientName,
        amount: row.ingredientAmount ?? "1",
        aisle: row.ingredientAisle ?? "Other",
      });
    }
    recipeMap.set(row.id, recipe);
  }

  const planRows = await db.select({
    plannedFor: mealPlanEntries.plannedFor,
    recipeClientKey: recipes.clientKey,
  }).from(mealPlanEntries)
    .innerJoin(mealPlans, eq(mealPlanEntries.mealPlanId, mealPlans.id))
    .innerJoin(recipes, eq(mealPlanEntries.recipeId, recipes.id))
    .where(and(eq(mealPlans.householdId, household.id), eq(mealPlans.weekStart, weekStart)));

  const plan: Array<string | null> = Array.from({ length: 7 }, () => null);
  for (const row of planRows) {
    const dayIndex = Math.round((Date.parse(`${row.plannedFor}T00:00:00.000Z`) - Date.parse(`${weekStart}T00:00:00.000Z`)) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < 7) plan[dayIndex] = row.recipeClientKey;
  }

  const groceryRows = await db.select({
    id: shoppingListItems.id,
    name: shoppingListItems.name,
    amount: shoppingListItems.amount,
    aisle: shoppingListItems.aisle,
    checked: shoppingListItems.checked,
  }).from(shoppingListItems)
    .innerJoin(shoppingLists, eq(shoppingListItems.shoppingListId, shoppingLists.id))
    .where(and(eq(shoppingLists.householdId, household.id), eq(shoppingLists.weekStart, weekStart)))
    .orderBy(asc(shoppingListItems.position), asc(shoppingListItems.createdAt));

  const pantry = await db.select().from(pantryItems)
    .where(eq(pantryItems.householdId, household.id))
    .orderBy(asc(pantryItems.expiresOn), asc(pantryItems.name));

  return {
    household,
    weekStart,
    weekEnd,
    recipes: Array.from(recipeMap.values()),
    plan,
    groceries: groceryRows,
    pantry,
  };
}

export async function saveMealPlanForUser(user: AuthUser, recipeClientKeys: Array<string | null>) {
  const household = await ensureHouseholdForUser(user);
  const weekStart = mondayOfCurrentWeek();

  await db.transaction(async (transaction) => {
    const [mealPlan] = await transaction.insert(mealPlans).values({ householdId: household.id, weekStart })
      .onConflictDoUpdate({
        target: [mealPlans.householdId, mealPlans.weekStart],
        set: { updatedAt: new Date() },
      })
      .returning({ id: mealPlans.id });

    await transaction.delete(mealPlanEntries).where(eq(mealPlanEntries.mealPlanId, mealPlan.id));
    const savedRecipes = await transaction.select({ id: recipes.id, clientKey: recipes.clientKey })
      .from(recipes)
      .where(eq(recipes.householdId, household.id));
    const recipeIds = new Map(savedRecipes.map((recipe) => [recipe.clientKey, recipe.id]));

    const entries = recipeClientKeys.flatMap((clientKey, dayIndex) => {
      const recipeId = clientKey ? recipeIds.get(clientKey) : undefined;
      return recipeId ? [{
        mealPlanId: mealPlan.id,
        recipeId,
        plannedFor: datePlusDays(weekStart, dayIndex),
      }] : [];
    });

    if (entries.length > 0) await transaction.insert(mealPlanEntries).values(entries);
  });
}

export async function saveShoppingListForUser(
  user: AuthUser,
  items: Array<{ name: string; amount: string; aisle: string; checked: boolean }>,
) {
  const household = await ensureHouseholdForUser(user);
  const weekStart = mondayOfCurrentWeek();

  await db.transaction(async (transaction) => {
    const [shoppingList] = await transaction.insert(shoppingLists).values({ householdId: household.id, weekStart })
      .onConflictDoUpdate({
        target: [shoppingLists.householdId, shoppingLists.weekStart],
        set: { updatedAt: new Date() },
      })
      .returning({ id: shoppingLists.id });

    await transaction.delete(shoppingListItems).where(eq(shoppingListItems.shoppingListId, shoppingList.id));
    if (items.length === 0) return;

    await transaction.insert(shoppingListItems).values(items.map((item, position) => ({
      shoppingListId: shoppingList.id,
      name: item.name,
      amount: item.amount,
      aisle: item.aisle,
      checked: item.checked,
      source: "planner",
      position,
    })));
  });
}
