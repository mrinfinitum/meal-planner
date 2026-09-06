import { importRecipeFromUrl } from "../../../../../worker/recipe-import.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recipe = await importRecipeFromUrl(typeof body?.url === "string" ? body.url : "");
    return Response.json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The recipe could not be imported.";
    return Response.json({ error: message }, { status: /complete|public|address/.test(message) ? 400 : 422 });
  }
}
