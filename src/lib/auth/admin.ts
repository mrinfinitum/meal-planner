import "server-only";

const DEFAULT_ADMIN_EMAIL = "geofftracy@protonmail.com";

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL) || DEFAULT_ADMIN_EMAIL;
}

export function isAppAdmin(email: string | null | undefined) {
  return normalizeEmail(email) === getAdminEmail();
}
