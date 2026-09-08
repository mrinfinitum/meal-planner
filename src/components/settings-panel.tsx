"use client";

import { Check, Crown, LoaderCircle, MailPlus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/client";

type SettingsState = {
  household: { id: string; name: string; role: string; appRole: string };
  members: Array<{ id: string; userId: string; email: string | null; displayName: string | null; role: string; appRole: string }>;
  invitations: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

type Props = {
  currentUserId?: string;
  email?: string | null;
  initialName?: string | null;
  initialHouseholdName: string;
  onHouseholdNameChange: (name: string) => void;
  onOpenAdmin: () => void;
};

async function readJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The change could not be saved.");
  return result as SettingsState;
}

export function SettingsPanel({ currentUserId, email, initialName, initialHouseholdName, onHouseholdNameChange, onOpenAdmin }: Props) {
  const [state, setState] = useState<SettingsState | null>(null);
  const [displayName, setDisplayName] = useState(initialName ?? "");
  const [householdName, setHouseholdName] = useState(initialHouseholdName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(readJson)
      .then((result) => {
        setState(result);
        setHouseholdName(result.household.name);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Settings could not be loaded."));
  }, []);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const profile = await authClient.updateUser({ name: displayName.trim() });
      if (profile.error) throw new Error(profile.error.message || "Your profile could not be updated.");
      const result = await readJson(await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), householdName: householdName.trim() }),
      }));
      setState(result);
      setHouseholdName(result.household.name);
      onHouseholdNameChange(result.household.name);
      setSuccess("Profile and family settings saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Settings could not be saved.");
    } finally { setSaving(false); }
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true); setError(""); setSuccess("");
    try {
      const result = await readJson(await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      }));
      setState(result); setInviteEmail("");
      setSuccess("Invitation saved. They will join this family when they sign in with that email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The invitation could not be saved.");
    } finally { setInviting(false); }
  }

  async function removeAccess(input: { memberId?: string; invitationId?: string }, label: string) {
    if (!window.confirm(`Remove ${label} from this family?`)) return;
    setError(""); setSuccess("");
    try {
      const result = await readJson(await fetch("/api/settings", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }));
      setState(result); setSuccess("Family access updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Family access could not be updated.");
    }
  }

  const isFamilyAdmin = state?.household.role === "admin";
  const isAppAdmin = state?.household.appRole === "admin";

  return <>
    <section className="welcome-row page-title"><div><p className="eyebrow"><UserRound size={14}/>Account & family</p><h1>Settings</h1><p className="subtitle">Manage your profile and the people who share this kitchen.</p></div></section>
    {isAppAdmin && <button className="admin-callout" onClick={onOpenAdmin}><span><Crown size={19}/></span><div><strong>App administration</strong><small>Manage recipes, ingredients, and retailer connections.</small></div><span>Open admin tools</span></button>}
    <div className="settings-grid">
      <form className="settings-card" onSubmit={saveSettings}>
        <div className="settings-card-heading"><span><UserRound size={19}/></span><div><h2>Your profile</h2><p>Shown to everyone in your family.</p></div></div>
        <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" required /></label>
        <label>Email<input value={email ?? ""} readOnly aria-readonly="true" /></label>
        <div className="settings-divider" />
        <div className="settings-card-heading compact"><span><Users size={19}/></span><div><h2>Family workspace</h2><p>Your shared meal-planning home.</p></div></div>
        <label>Household name<input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} disabled={!isFamilyAdmin} required /></label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        {success && <p className="form-message success"><Check size={15}/>{success}</p>}
        <button className="primary-button settings-save" disabled={saving}>{saving ? <><LoaderCircle className="is-spinning" size={16}/>Saving…</> : "Save changes"}</button>
      </form>

      <section className="settings-card family-card">
        <div className="settings-card-heading"><span><Users size={19}/></span><div><h2>Family members</h2><p>{(state?.members.length ?? 0) + (state?.invitations.length ?? 0)} people and invitations.</p></div></div>
        {isFamilyAdmin && <form className="invite-row" onSubmit={inviteMember}><MailPlus size={17}/><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="family@example.com" aria-label="Family member email"/><button disabled={inviting}>{inviting ? "Adding…" : "Invite"}</button></form>}
        {!state ? <div className="settings-loading"><LoaderCircle className="is-spinning" size={18}/>Loading family…</div> : <div className="member-list">
          {state.members.map((member) => <div className="member-row" key={member.id}><div className="member-avatar">{(member.displayName ?? member.email ?? "F").slice(0,1).toUpperCase()}</div><div><strong>{member.displayName || member.email || "Family member"}</strong><small>{member.email}</small></div><span className="role-pill">{member.appRole === "admin" ? "App admin" : member.role === "admin" ? "Family admin" : "Member"}</span>{isFamilyAdmin && member.userId !== currentUserId && <button className="row-delete" aria-label={`Remove ${member.email}`} onClick={() => removeAccess({ memberId: member.id }, member.email ?? "this member")}><Trash2 size={16}/></button>}</div>)}
          {state.invitations.map((invitation) => <div className="member-row pending" key={invitation.id}><div className="member-avatar"><MailPlus size={15}/></div><div><strong>{invitation.email}</strong><small>Joins automatically after sign-in</small></div><span className="role-pill pending">Pending</span>{isFamilyAdmin && <button className="row-delete" aria-label={`Cancel invitation for ${invitation.email}`} onClick={() => removeAccess({ invitationId: invitation.id }, invitation.email)}><Trash2 size={16}/></button>}</div>)}
        </div>}
        <div className="privacy-note"><ShieldCheck size={17}/><span><strong>Private family workspace</strong><small>Only signed-in members listed here can access this household.</small></span></div>
      </section>
    </div>
  </>;
}
