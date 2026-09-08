import { saveRecipeAndAddToShoppingList, type RecipeInput } from "@/db/households";
import { auth } from "@/lib/auth/server";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<RecipeInput>;
  if (!body.id || !body.name || !Array.isArray(body.ingredients)) {
    return Response.json({ error: "Recipe name and ingredients are required." }, { status: 400 });
  }

  const recipe: RecipeInput = {
    id: body.id,
    name: body.name,
    emoji: body.emoji ?? "🍽️",
    tone: body.tone ?? "custom",
    time: Number(body.time) || 30,
    category: body.category ?? "Dinner",
    tag: body.tag ?? "My recipe",
    sourceUrl: body.sourceUrl,
    ingredients: body.ingredients
      .filter((item) => item && typeof item.name === "string" && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        amount: typeof item.amount === "string" && item.amount.trim() ? item.amount.trim() : "1",
        aisle: typeof item.aisle === "string" && item.aisle.trim() ? item.aisle.trim() : "Other",
      })),
  };

  const savedRecipe = await saveRecipeAndAddToShoppingList(session.user, recipe);
  return Response.json({ recipe: savedRecipe }, { status: 201 });
}
