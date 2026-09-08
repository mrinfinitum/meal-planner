"use client";

import { Check, CircleSlash2, CookingPot, Link2, LoaderCircle, PackageSearch, PlugZap, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type RecipeRecord = { id: string; name: string; category: string; prepMinutes: number; tag: string; sourceUrl: string | null };
type IngredientRecord = { id: string; name: string; aisle: string; recipeCount: number };
type ConnectionRecord = { id?: string; provider: string; status: string; accountLabel: string; credentialsConfigured: boolean };
type AdminState = { recipes: RecipeRecord[]; ingredients: IngredientRecord[]; connections: ConnectionRecord[] };

async function readJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The admin change could not be saved.");
  return result as AdminState;
}

export function AdminPanel({ onLibraryChanged }: { onLibraryChanged: () => void }) {
  const [tab, setTab] = useState<"recipes" | "ingredients" | "connections">("recipes");
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin", { cache: "no-store" }).then(readJson).then(setState)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Admin tools could not be loaded."));
  }, []);

  async function change(method: "PATCH" | "DELETE", body: Record<string, unknown>, message: string, refreshLibrary = false) {
    setError(""); setSuccess("");
    try {
      const result = await readJson(await fetch("/api/admin", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
      setState(result); setSuccess(message);
      if (refreshLibrary) onLibraryChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The admin change could not be saved.");
    }
  }

  return <>
    <section className="welcome-row page-title"><div><p className="eyebrow"><ShieldCheck size={14}/>App administration</p><h1>Library control center</h1><p className="subtitle">Keep your family’s recipe data clean and prepare retailer integrations.</p></div></section>
    <div className="admin-tabs" role="tablist" aria-label="Administration sections">
      <button className={tab === "recipes" ? "active" : ""} onClick={() => setTab("recipes")}><CookingPot size={17}/>Recipes <span>{state?.recipes.length ?? 0}</span></button>
      <button className={tab === "ingredients" ? "active" : ""} onClick={() => setTab("ingredients")}><PackageSearch size={17}/>Ingredients <span>{state?.ingredients.length ?? 0}</span></button>
      <button className={tab === "connections" ? "active" : ""} onClick={() => setTab("connections")}><PlugZap size={17}/>Connections <span>{state?.connections.filter((item) => item.status === "enabled").length ?? 0}</span></button>
    </div>
    {error && <p className="form-message error admin-message" role="alert">{error}</p>}
    {success && <p className="form-message success admin-message"><Check size={15}/>{success}</p>}
    {!state ? <div className="admin-loading"><LoaderCircle className="is-spinning" size={22}/>Loading admin tools…</div> : <>
      {tab === "recipes" && <section className="admin-surface"><div className="admin-surface-heading"><div><h2>Recipe database</h2><p>Edit the core details used throughout the planner.</p></div></div><div className="admin-table recipe-admin-table"><div className="admin-table-head"><span>Recipe</span><span>Category</span><span>Time</span><span>Tag</span><span>Actions</span></div>{state.recipes.map((recipe) => <RecipeRow key={recipe.id} recipe={recipe} onSave={(value) => change("PATCH", { action: "update-recipe", ...value }, "Recipe updated.", true)} onDelete={() => change("DELETE", { recipeId: recipe.id }, "Recipe removed.", true)}/>)}</div></section>}
      {tab === "ingredients" && <section className="admin-surface"><div className="admin-surface-heading"><div><h2>Ingredient catalog</h2><p>Standardize names and aisles so shopping lists stay organized.</p></div></div><div className="admin-table ingredient-admin-table"><div className="admin-table-head"><span>Ingredient</span><span>Aisle</span><span>Used by</span><span>Action</span></div>{state.ingredients.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient} onSave={(value) => change("PATCH", { action: "update-ingredient", ...value }, "Ingredient updated.", true)}/>)}</div></section>}
      {tab === "connections" && <section className="admin-surface"><div className="admin-surface-heading"><div><h2>Retailer connections</h2><p>Enable the retailers your family plans to use for cart exports.</p></div></div><div className="connection-grid">{state.connections.map((connection) => <ConnectionCard key={connection.provider} connection={connection} onSave={(value) => change("PATCH", { action: "save-connection", ...value }, `${connection.provider[0].toUpperCase() + connection.provider.slice(1)} connection settings saved.`)}/>)}</div><div className="connection-security"><ShieldCheck size={18}/><div><strong>Credentials stay outside the database</strong><p>Connection status and account labels are saved here. Retailer API credentials must be added as protected hosting variables before live cart sync can run.</p></div></div></section>}
    </>}
  </>;
}

function RecipeRow({ recipe, onSave, onDelete }: { recipe: RecipeRecord; onSave: (recipe: RecipeRecord) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(recipe);
  return <div className="admin-table-row"><label><span className="mobile-field-label">Recipe</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/>{recipe.sourceUrl && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={12}/>Source</a>}</label><label><span className="mobile-field-label">Category</span><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}/></label><label><span className="mobile-field-label">Minutes</span><input type="number" min="1" value={draft.prepMinutes} onChange={(event) => setDraft({ ...draft, prepMinutes: Number(event.target.value) })}/></label><label><span className="mobile-field-label">Tag</span><input value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })}/></label><div className="admin-row-actions"><button className="save-icon" aria-label={`Save ${recipe.name}`} onClick={() => onSave(draft)}><Save size={16}/></button><button className="delete-icon" aria-label={`Delete ${recipe.name}`} onClick={() => { if (window.confirm(`Delete ${recipe.name}?`)) onDelete(); }}><Trash2 size={16}/></button></div></div>;
}

function IngredientRow({ ingredient, onSave }: { ingredient: IngredientRecord; onSave: (ingredient: IngredientRecord) => void }) {
  const [draft, setDraft] = useState(ingredient);
  return <div className="admin-table-row"><label><span className="mobile-field-label">Ingredient</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label><label><span className="mobile-field-label">Aisle</span><input value={draft.aisle} onChange={(event) => setDraft({ ...draft, aisle: event.target.value })}/></label><span className="usage-count">{ingredient.recipeCount} {ingredient.recipeCount === 1 ? "recipe" : "recipes"}</span><div className="admin-row-actions"><button className="save-icon" aria-label={`Save ${ingredient.name}`} onClick={() => onSave(draft)}><Save size={16}/></button></div></div>;
}

function ConnectionCard({ connection, onSave }: { connection: ConnectionRecord; onSave: (value: { provider: string; enabled: boolean; accountLabel: string }) => void }) {
  const [label, setLabel] = useState(connection.accountLabel);
  const enabled = connection.status === "enabled";
  const names: Record<string, string> = { walmart: "Walmart", amazon: "Amazon", target: "Target" };
  const marks: Record<string, string> = { walmart: "✦", amazon: "a", target: "◎" };
  return <article className="connection-card"><div className={`connection-mark ${connection.provider}`}>{marks[connection.provider]}</div><div className="connection-title"><div><h3>{names[connection.provider]}</h3><span className={`connection-status ${connection.credentialsConfigured ? "ready" : "needs-setup"}`}>{connection.credentialsConfigured ? "Credentials ready" : "Needs API credentials"}</span></div><button className={`connection-toggle ${enabled ? "on" : ""}`} role="switch" aria-checked={enabled} aria-label={`${enabled ? "Disable" : "Enable"} ${names[connection.provider]}`} onClick={() => onSave({ provider: connection.provider, enabled: !enabled, accountLabel: label })}><span/></button></div><label>Account label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Family grocery account"/></label><button className="connection-save" onClick={() => onSave({ provider: connection.provider, enabled, accountLabel: label })}>{enabled ? <><Save size={15}/>Save connection</> : <><CircleSlash2 size={15}/>Save as disabled</>}</button></article>;
}
