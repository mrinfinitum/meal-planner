import { getHouseholdAppState } from "@/db/households";
import { auth } from "@/lib/auth/server";

export async function POST() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getHouseholdAppState(session.user);
  return Response.json(state);
}
