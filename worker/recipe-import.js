const MAX_RECIPE_BYTES = 2_000_000;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function assertSafeRecipeUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a complete recipe URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Enter a public http or https recipe URL.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blocked = host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host === "0.0.0.0" || host === "::1" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host);
  if (blocked || (url.port && !["80", "443"].includes(url.port))) throw new Error("That address is not a public recipe page.");
  return url;
}

async function readLimited(response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_RECIPE_BYTES) throw new Error("That recipe page is too large to import.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RECIPE_BYTES) { await reader.cancel(); throw new Error("That recipe page is too large to import."); }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

function findRecipe(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findRecipe(item); if (found) return found; }
    return null;
  }
  const type = value["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return value;
  if (value["@graph"]) return findRecipe(value["@graph"]);
  return null;
}

function decodeText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function minutesFromDuration(value) {
  const match = String(value ?? "").match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return 30;
  return Number(match[1] || 0) * 1440 + Number(match[2] || 0) * 60 + Number(match[3] || 0) || 30;
}

function aisleFor(name) {
  const value = name.toLowerCase();
  if (/chicken|beef|pork|turkey|salmon|shrimp|fish|sausage|bacon/.test(value)) return "Meat & seafood";
  if (/milk|cream|cheese|butter|yogurt|egg/.test(value)) return "Dairy & eggs";
  if (/bread|bun|tortilla|dough|bagel|roll/.test(value)) return "Bakery";
  if (/frozen|ice cream/.test(value)) return "Frozen";
  if (/apple|avocado|basil|bean sprout|broccoli|carrot|celery|cilantro|cucumber|garlic|herb|lemon|lettuce|lime|mushroom|onion|parsley|pepper|potato|spinach|tomato|zucchini/.test(value)) return "Produce";
  return "Pantry";
}

function parseIngredient(value) {
  const text = decodeText(value);
  const match = text.match(/^((?:(?:\d+\s+)?[\d¼½¾⅓⅔⅛⅜⅝⅞./-]+)\s*(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|grams?|g|kilograms?|kg|cloves?|cans?|packages?|bunch(?:es)?|slices?)?)\s+(.+)$/i);
  const name = decodeText(match?.[2] || text).replace(/^\(\s*\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|lbs)\s*\)\s*/i, "");
  return { name, amount: decodeText(match?.[1] || "1"), aisle: aisleFor(name) };
}

function categoryFor(value, name) {
  const category = `${Array.isArray(value) ? value.join(" ") : String(value ?? "")} ${String(name ?? "")}`.toLowerCase();
  if (/breakfast|brunch/.test(category)) return "Breakfast";
  if (/lunch|sandwich|salad/.test(category)) return "Lunch";
  if (/dessert|cake|cookie|sweet|baking/.test(category)) return "Dessert";
  if (/snack|appetizer/.test(category)) return "Snack";
  return "Dinner";
}

function recipeFromHtml(html, sourceUrl) {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const structured = JSON.parse(match[1].trim());
      const recipe = findRecipe(structured);
      if (!recipe) continue;
      const ingredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient.map(parseIngredient).filter((item) => item.name) : [];
      if (!ingredients.length) continue;
      return {
        name: decodeText(recipe.name) || "Imported recipe",
        time: minutesFromDuration(recipe.totalTime || recipe.cookTime || recipe.prepTime),
        category: categoryFor(recipe.recipeCategory, recipe.name),
        tag: "Imported recipe",
        emoji: "🔗",
        tone: "custom",
        ingredients,
        sourceUrl,
      };
    } catch { /* Try the next structured-data block. */ }
  }
  throw new Error("We couldn’t find a structured ingredient list on that page. Try another recipe link or add it manually.");
}

export async function importRecipeFromUrl(value) {
  const url = assertSafeRecipeUrl(value);
  let response;
  try {
    response = await fetch(url, { redirect: "follow", headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Plenty Recipe Importer/1.0" }, signal: AbortSignal.timeout(12_000) });
  } catch { throw new Error("We couldn’t reach that recipe page. Check the link and try again."); }
  if (!response.ok) throw new Error(`That recipe page returned an error (${response.status}).`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("That link does not appear to be a recipe page.");
  const html = await readLimited(response);
  return recipeFromHtml(html, url.toString());
}

export async function handleRecipeImport(request) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, { status: 405 });
  try {
    const body = await request.json();
    const recipe = await importRecipeFromUrl(typeof body?.url === "string" ? body.url : "");
    return json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The recipe could not be imported.";
    return json({ error: message }, { status: /complete|public|address/.test(message) ? 400 : 422 });
  }
}
