import {
  getSettingsState,
  inviteFamilyMember,
  removeFamilyAccess,
  updateSettings,
} from "@/db/management";
import { auth } from "@/lib/auth/server";

function messageFor(error: unknown) {
  if (!(error instanceof Error)) return "Something went wrong.";
  const messages: Record<string, string> = {
    HOUSEHOLD_ADMIN_REQUIRED: "Only a family admin can make that change.",
    INVALID_EMAIL: "Enter a valid email address.",
    ALREADY_A_MEMBER: "That person is already in this family.",
    MEMBER_NOT_FOUND: "That family member could not be found.",
    CANNOT_REMOVE_SELF: "You cannot remove your own family access.",
    INVALID_REQUEST: "The requested family change was not recognized.",
  };
  return messages[error.message] ?? "The settings change could not be saved.";
}

async function signedInUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function GET() {
  const user = await signedInUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getSettingsState(user));
}

export async function PATCH(request: Request) {
  const user = await signedInUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { householdName?: string; displayName?: string };
    return Response.json(await updateSettings(user, body));
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await signedInUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { email?: string };
    return Response.json(await inviteFamilyMember(user, body.email ?? ""), { status: 201 });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await signedInUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { memberId?: string; invitationId?: string };
    return Response.json(await removeFamilyAccess(user, body));
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 400 });
  }
}
