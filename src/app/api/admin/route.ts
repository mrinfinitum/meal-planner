import {
  deleteAdminRecipe,
  getAdminState,
  saveExternalConnection,
  updateAdminIngredient,
  updateAdminRecipe,
} from "@/db/management";
import { auth } from "@/lib/auth/server";

function messageFor(error: unknown) {
  if (!(error instanceof Error)) return "Something went wrong.";
  const messages: Record<string, string> = {
    APP_ADMIN_REQUIRED: "App administrator access is required.",
    RECIPE_NOT_FOUND: "That recipe could not be found.",
    INGREDIENT_NOT_FOUND: "That ingredient could not be found.",
    INVALID_PROVIDER: "That retailer is not supported.",
  };
  return messages[error.message] ?? "The admin change could not be saved.";
}

async function appAdmin() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function GET() {
  const user = await appAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await getAdminState(user));
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  const user = await appAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "update-recipe") {
      return Response.json(await updateAdminRecipe(user, {
        id: String(body.id ?? ""),
        name: String(body.name ?? ""),
        category: String(body.category ?? "Dinner"),
        prepMinutes: Number(body.prepMinutes) || 30,
        tag: String(body.tag ?? "My recipe"),
      }));
    }
    if (body.action === "update-ingredient") {
      return Response.json(await updateAdminIngredient(user, {
        id: String(body.id ?? ""),
        name: String(body.name ?? ""),
        aisle: String(body.aisle ?? "Other"),
      }));
    }
    if (body.action === "save-connection") {
      return Response.json(await saveExternalConnection(user, {
        provider: String(body.provider ?? ""),
        enabled: Boolean(body.enabled),
        accountLabel: typeof body.accountLabel === "string" ? body.accountLabel : undefined,
      }));
    }
    return Response.json({ error: "The requested admin change was not recognized." }, { status: 400 });
  } catch (error) {
    const status = error instanceof Error && error.message === "APP_ADMIN_REQUIRED" ? 403 : 400;
    return Response.json({ error: messageFor(error) }, { status });
  }
}

export async function DELETE(request: Request) {
  const user = await appAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { recipeId?: string };
    if (!body.recipeId) return Response.json({ error: "Choose a recipe to delete." }, { status: 400 });
    return Response.json(await deleteAdminRecipe(user, body.recipeId));
  } catch (error) {
    const status = error instanceof Error && error.message === "APP_ADMIN_REQUIRED" ? 403 : 400;
    return Response.json({ error: messageFor(error) }, { status });
  }
}
