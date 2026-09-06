import { handleRecipeImport } from "./recipe-import.js";

const worker = {
  async fetch(request, env, context) {
    void context;
    const url = new URL(request.url);
    if (url.pathname === "/api/recipes/import") return handleRecipeImport(request);
    return env.ASSETS.fetch(request);
  },
};

export default worker;
