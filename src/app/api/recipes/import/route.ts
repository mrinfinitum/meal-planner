import { importRecipeFromUrl } from "../../../../../worker/recipe-import.js";
import { createHash } from "node:crypto";

import { saveRecipeAndAddToShoppingList } from "@/db/households";
import { auth } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return Response.json({ error: "Sign in to import a recipe." }, { status: 401 });
    }

    const body = await request.json();
    const recipe = await importRecipeFromUrl(typeof body?.url === "string" ? body.url : "");
    const clientKey = `imported-${createHash("sha256").update(recipe.sourceUrl ?? recipe.name).digest("hex").slice(0, 20)}`;
    const savedRecipe = await saveRecipeAndAddToShoppingList(session.user, { ...recipe, id: clientKey });
    return Response.json({ recipe: savedRecipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The recipe could not be imported.";
    return Response.json({ error: message }, { status: /complete|public|address/.test(message) ? 400 : 422 });
  }
}
