import { saveShoppingListForUser } from "@/db/households";
import { auth } from "@/lib/auth/server";

type ShoppingItem = { name: string; amount: string; aisle: string; checked: boolean };

export async function PUT(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { items?: unknown };
  if (!Array.isArray(body.items) || body.items.length > 500) {
    return Response.json({ error: "A valid shopping list is required." }, { status: 400 });
  }

  const items = body.items.filter((item): item is ShoppingItem => {
    if (!item || typeof item !== "object") return false;
    const value = item as Partial<ShoppingItem>;
    return typeof value.name === "string" && typeof value.amount === "string" && typeof value.aisle === "string" && typeof value.checked === "boolean";
  }).map((item) => ({ ...item, name: item.name.trim(), amount: item.amount.trim() || "1", aisle: item.aisle.trim() || "Other" }))
    .filter((item) => item.name);

  await saveShoppingListForUser(session.user, items);
  return Response.json({ ok: true });
}
