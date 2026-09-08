import { saveMealPlanForUser } from "@/db/households";
import { auth } from "@/lib/auth/server";

export async function PUT(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { plan?: unknown };
  if (!Array.isArray(body.plan) || body.plan.length !== 7 || body.plan.some((item) => item !== null && typeof item !== "string")) {
    return Response.json({ error: "A seven-day meal plan is required." }, { status: 400 });
  }

  await saveMealPlanForUser(session.user, body.plan);
  return Response.json({ ok: true });
}
