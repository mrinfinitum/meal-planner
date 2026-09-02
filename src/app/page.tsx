"use client";

import {
  ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, CookingPot, CreditCard, Heart, House, Leaf, ListChecks,
  MoreHorizontal, PackageOpen, Plus, RefreshCw, Search, Settings, ShoppingBasket,
  ShoppingCart, Sparkles, Trash2, Users, WandSparkles, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Ingredient = { name: string; amount: string; aisle: string };
type Recipe = { id: string; name: string; emoji: string; tone: string; time: number; category: string; tag: string; ingredients: Ingredient[] };
type Grocery = Ingredient & { id: string; checked: boolean };

const nav = [
  { label: "Overview", icon: House }, { label: "Meal plan", icon: CalendarDays },
  { label: "Recipes", icon: CookingPot }, { label: "Groceries", icon: ShoppingBasket },
  { label: "Kitchen", icon: PackageOpen },
];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dates = [18, 19, 20, 21, 22, 23, 24];

const seedRecipes: Recipe[] = [
  { id: "lemon-chicken", name: "Lemon herb chicken", emoji: "🍋", tone: "lemon", time: 35, category: "Dinner", tag: "Family favorite", ingredients: [{name:"Chicken breasts",amount:"2 lb",aisle:"Meat & seafood"},{name:"Lemons",amount:"3",aisle:"Produce"},{name:"Baby potatoes",amount:"1.5 lb",aisle:"Produce"},{name:"Fresh rosemary",amount:"1 bunch",aisle:"Produce"}] },
  { id: "tomato-orzo", name: "Creamy tomato orzo", emoji: "🍅", tone: "tomato", time: 25, category: "Dinner", tag: "One pot", ingredients: [{name:"Orzo",amount:"12 oz",aisle:"Pantry"},{name:"Cherry tomatoes",amount:"2 pints",aisle:"Produce"},{name:"Heavy cream",amount:"1 cup",aisle:"Dairy & eggs"},{name:"Parmesan",amount:"4 oz",aisle:"Dairy & eggs"},{name:"Baby spinach",amount:"5 oz",aisle:"Produce"}] },
  { id: "salmon-bowls", name: "Salmon rice bowls", emoji: "🐟", tone: "salmon", time: 30, category: "Dinner", tag: "High protein", ingredients: [{name:"Salmon fillets",amount:"4",aisle:"Meat & seafood"},{name:"Jasmine rice",amount:"2 cups",aisle:"Pantry"},{name:"Avocados",amount:"2",aisle:"Produce"},{name:"Cucumbers",amount:"2",aisle:"Produce"},{name:"Soy sauce",amount:"1 bottle",aisle:"Pantry"}] },
  { id: "taco-night", name: "Taco night", emoji: "🌮", tone: "taco", time: 20, category: "Dinner", tag: "Kid friendly", ingredients: [{name:"Ground turkey",amount:"1.5 lb",aisle:"Meat & seafood"},{name:"Corn tortillas",amount:"16",aisle:"Bakery"},{name:"Shredded cheese",amount:"8 oz",aisle:"Dairy & eggs"},{name:"Limes",amount:"3",aisle:"Produce"},{name:"Romaine lettuce",amount:"1 head",aisle:"Produce"}] },
  { id: "pesto-pasta", name: "Garden pesto pasta", emoji: "🌿", tone: "herb", time: 22, category: "Dinner", tag: "Vegetarian", ingredients: [{name:"Penne pasta",amount:"1 lb",aisle:"Pantry"},{name:"Basil pesto",amount:"8 oz",aisle:"Pantry"},{name:"Zucchini",amount:"2",aisle:"Produce"},{name:"Parmesan",amount:"4 oz",aisle:"Dairy & eggs"}] },
  { id: "pancakes", name: "Sunday berry pancakes", emoji: "🥞", tone: "berry", time: 25, category: "Breakfast", tag: "Weekend", ingredients: [{name:"Pancake mix",amount:"1 box",aisle:"Pantry"},{name:"Blueberries",amount:"1 pint",aisle:"Produce"},{name:"Eggs",amount:"6",aisle:"Dairy & eggs"},{name:"Maple syrup",amount:"1 bottle",aisle:"Pantry"}] },
  { id: "soup", name: "Cozy vegetable soup", emoji: "🥕", tone: "carrot", time: 45, category: "Lunch", tag: "Freezer friendly", ingredients: [{name:"Carrots",amount:"6",aisle:"Produce"},{name:"Celery",amount:"1 bunch",aisle:"Produce"},{name:"Vegetable stock",amount:"2 cartons",aisle:"Pantry"},{name:"Cannellini beans",amount:"2 cans",aisle:"Pantry"}] },
  { id: "pizza", name: "Homemade pizza night", emoji: "🍕", tone: "pizza", time: 40, category: "Dinner", tag: "Hands-on", ingredients: [{name:"Pizza dough",amount:"2 balls",aisle:"Bakery"},{name:"Mozzarella",amount:"12 oz",aisle:"Dairy & eggs"},{name:"Pizza sauce",amount:"1 jar",aisle:"Pantry"},{name:"Bell peppers",amount:"2",aisle:"Produce"}] },
];

const inventory = [
  { name: "Baby spinach", detail: "Use within 2 days", percent: 28, icon: "🥬", status: "Soon" },
  { name: "Greek yogurt", detail: "About 1 cup left", percent: 42, icon: "🥣", status: "Low" },
  { name: "Avocados", detail: "2 ripe now", percent: 65, icon: "🥑", status: "Ready" },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [week, setWeek] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>(seedRecipes);
  const [plan, setPlan] = useState<(string | null)[]>(["lemon-chicken", "tomato-orzo", "salmon-bowls", "taco-night", "pesto-pasta", null, "pancakes"]);
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [recipeForm, setRecipeForm] = useState({ name: "", time: "30", category: "Dinner", ingredients: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedRecipes = localStorage.getItem("plenty-recipes");
        const savedPlan = localStorage.getItem("plenty-plan");
        const savedGroceries = localStorage.getItem("plenty-groceries");
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
        if (savedPlan) setPlan(JSON.parse(savedPlan));
        if (savedGroceries) setGroceries(JSON.parse(savedGroceries));
      } catch { /* Keep the polished starter data if local storage is unavailable. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("plenty-recipes", JSON.stringify(recipes)); }, [recipes, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("plenty-plan", JSON.stringify(plan)); }, [plan, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("plenty-groceries", JSON.stringify(groceries)); }, [groceries, hydrated]);

  const weekLabel = week === 0 ? "August 18–24" : week < 0 ? "August 11–17" : "August 25–31";
  const plannedRecipes = plan.map((id) => recipes.find((recipe) => recipe.id === id));
  const filteredRecipes = recipes.filter((recipe) => (category === "All" || recipe.category === category) && recipe.name.toLowerCase().includes(query.toLowerCase()));
  const groceryGroups = useMemo(() => Object.entries(groceries.reduce<Record<string, Grocery[]>>((groups, item) => { (groups[item.aisle] ??= []).push(item); return groups; }, {})), [groceries]);
  const checkedCount = groceries.filter((item) => item.checked).length;

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2400); }
  function selectMeal(recipeId: string) { if (pickerDay === null) return; setPlan((current) => current.map((value, index) => index === pickerDay ? recipeId : value)); setPickerDay(null); notify(`${weekdays[pickerDay]}'s meal updated`); }
  function generateGroceries() {
    const map = new Map<string, Grocery>();
    plannedRecipes.filter(Boolean).forEach((recipe) => recipe!.ingredients.forEach((ingredient) => {
      const key = ingredient.name.toLowerCase(); const current = map.get(key);
      map.set(key, current ? { ...current, amount: `${current.amount} + ${ingredient.amount}` } : { ...ingredient, id: key.replaceAll(" ", "-"), checked: false });
    }));
    setGroceries(Array.from(map.values())); setActive("Groceries"); notify("Weekly shopping list generated");
  }
  function addCustomItem() { if (!newItem.trim()) return; setGroceries((current) => [...current, { id: `custom-${Date.now()}`, name: newItem.trim(), amount: "1", aisle: "Other", checked: false }]); setNewItem(""); }
  function quickPlan(recipeId: string) { const openDay = plan.findIndex((item) => item === null); const day = openDay >= 0 ? openDay : 0; setPlan((current) => current.map((item, index) => index === day ? recipeId : item)); const recipe = recipes.find((item) => item.id === recipeId); notify(`${recipe?.name ?? "Recipe"} added to ${weekdays[day]}`); }
  function addRecipe() {
    if (!recipeForm.name.trim()) return;
    const custom: Recipe = { id: `recipe-${Date.now()}`, name: recipeForm.name.trim(), emoji: "🍽️", tone: "custom", time: Number(recipeForm.time) || 30, category: recipeForm.category, tag: "My recipe", ingredients: recipeForm.ingredients.split(",").map((name) => ({ name: name.trim(), amount: "1", aisle: "Other" })).filter((item) => item.name) };
    setRecipes((current) => [...current, custom]); setRecipeForm({ name: "", time: "30", category: "Dinner", ingredients: "" }); setModalOpen(false); setActive("Recipes"); notify("Recipe saved to your collection");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Leaf size={19} strokeWidth={2.6} /></div><span>plenty.</span></div>
        <nav className="side-nav" aria-label="Primary navigation"><p className="nav-label">Workspace</p>{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => setActive(label)}><Icon size={18} /><span>{label}</span>{label === "Groceries" && groceries.length > 0 && <span className="nav-count">{groceries.length}</span>}</button>)}</nav>
        <div className="household-card"><div className="household-icon"><Users size={18} /></div><div><strong>The Parkers</strong><span>4 family members</span></div><ChevronDown size={16} /></div>
        <div className="sidebar-bottom"><button className="nav-item"><CircleHelp size={18} /><span>Help & support</span></button><button className="nav-item"><Settings size={18} /><span>Settings</span></button><div className="profile"><div className="avatar">GP</div><div><strong>Geoff Parker</strong><span>Family admin</span></div><MoreHorizontal size={18} /></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Leaf size={17} /></div><span>plenty.</span></div>
          <div className="search-wrap"><Search size={18} /><input aria-label="Search recipes" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => active !== "Recipes" && setActive("Recipes")} placeholder="Search recipes, ingredients..." /><kbd>⌘ K</kbd></div>
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
          <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> <span>Add recipe</span></button>
        </header>

        <div className="page-content">
          {active === "Overview" && <Overview plannedRecipes={plannedRecipes} checkedCount={checkedCount} groceryCount={groceries.length} setActive={setActive} setPickerDay={setPickerDay} generateGroceries={generateGroceries} notify={notify} />}
          {active === "Meal plan" && <MealPlanner recipes={recipes} plan={plan} plannedRecipes={plannedRecipes} weekLabel={weekLabel} setWeek={setWeek} setPickerDay={setPickerDay} generateGroceries={generateGroceries} setPlan={setPlan} />}
          {active === "Recipes" && <RecipeLibrary recipes={filteredRecipes} total={recipes.length} query={query} setQuery={setQuery} category={category} setCategory={setCategory} setModalOpen={setModalOpen} quickPlan={quickPlan} />}
          {active === "Groceries" && <GroceryList groceries={groceries} groups={groceryGroups} checkedCount={checkedCount} generateGroceries={generateGroceries} setGroceries={setGroceries} newItem={newItem} setNewItem={setNewItem} addCustomItem={addCustomItem} notify={notify} />}
          {active === "Kitchen" && <KitchenView notify={notify} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={20} /><span>{label === "Meal plan" ? "Plan" : label === "Groceries" ? "List" : label}</span></button>)}</nav>

      {pickerDay !== null && <div className="modal-backdrop" onMouseDown={() => setPickerDay(null)}><div className="modal picker-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setPickerDay(null)}><X size={19} /></button><p className="eyebrow"><CalendarDays size={14} /> {weekdays[pickerDay]}</p><h2>Choose a meal</h2><p>Pick from your recipe collection for dinner.</p><div className="picker-list">{recipes.filter((recipe) => recipe.category === "Dinner").map((recipe) => <button key={recipe.id} onClick={() => selectMeal(recipe.id)}><span className={`picker-emoji ${recipe.tone}`}>{recipe.emoji}</span><span><strong>{recipe.name}</strong><small>{recipe.time} min · {recipe.tag}</small></span><ChevronRight size={17} /></button>)}</div></div></div>}
      {modalOpen && <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="recipe-modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}><X size={19} /></button><div className="modal-icon"><CookingPot size={24} /></div><p className="eyebrow">Recipe collection</p><h2 id="recipe-modal-title">Add something delicious</h2><p>Create a recipe for your family collection. You can add quantities later.</p><div className="recipe-form"><label>Recipe name<input autoFocus value={recipeForm.name} onChange={(event) => setRecipeForm({...recipeForm,name:event.target.value})} placeholder="e.g. Grandma’s lasagna" /></label><div><label>Time<input type="number" value={recipeForm.time} onChange={(event) => setRecipeForm({...recipeForm,time:event.target.value})} /></label><label>Category<select value={recipeForm.category} onChange={(event) => setRecipeForm({...recipeForm,category:event.target.value})}><option>Dinner</option><option>Lunch</option><option>Breakfast</option></select></label></div><label>Ingredients<input value={recipeForm.ingredients} onChange={(event) => setRecipeForm({...recipeForm,ingredients:event.target.value})} placeholder="Tomatoes, pasta, basil..." /></label></div><div className="modal-actions"><button className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" onClick={addRecipe}>Save recipe</button></div></div></div>}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function PageHeader({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children?: React.ReactNode }) { return <section className="welcome-row page-title"><div><p className="eyebrow"><Sparkles size={14} />{eyebrow}</p><h1>{title}</h1><p className="subtitle">{copy}</p></div>{children}</section>; }

function Overview({ plannedRecipes, checkedCount, groceryCount, setActive, setPickerDay, generateGroceries, notify }: { plannedRecipes: (Recipe|undefined)[]; checkedCount:number; groceryCount:number; setActive:(value:string)=>void; setPickerDay:(value:number)=>void; generateGroceries:()=>void; notify:(value:string)=>void }) {
  return <><PageHeader eyebrow="Tuesday, August 18" title="Good evening, Geoff" copy="Dinner is handled. Here’s what’s happening in your kitchen." />
    <section className="metrics"><div className="metric"><span className="metric-icon purple"><CalendarDays size={19}/></span><div><small>Meals planned</small><strong>{plannedRecipes.filter(Boolean).length} <em>/ 7 days</em></strong></div><span className="trend">On track</span></div><div className="metric"><span className="metric-icon green"><PackageOpen size={19}/></span><div><small>Kitchen inventory</small><strong>42 <em>items</em></strong></div><span className="status-dot">Healthy</span></div><div className="metric"><span className="metric-icon amber"><ShoppingBasket size={19}/></span><div><small>Shopping list</small><strong>{groceryCount} <em>items</em></strong></div><button className="metric-link" onClick={() => setActive("Groceries")}>{checkedCount ? `${checkedCount} checked` : "View list"}<ArrowRight size={14}/></button></div></section>
    <section className="section-block"><div className="section-heading"><div><h2>This week’s dinners</h2><p>Tap any meal to make a change.</p></div><button className="text-button" onClick={() => setActive("Meal plan")}>Full meal plan <ArrowRight size={15}/></button></div><div className="meal-grid">{plannedRecipes.slice(0,4).map((recipe,index) => recipe ? <article className={`meal-card ${recipe.tone}`} key={weekdays[index]} onClick={() => setPickerDay(index)}><div className="meal-visual"><span>{recipe.emoji}</span><div className="meal-date"><b>{weekdays[index].slice(0,3)}</b><strong>{dates[index]}</strong></div><button aria-label="Change meal"><MoreHorizontal size={18}/></button></div><div className="meal-info"><h3>{recipe.name}</h3><p><Clock3 size={14}/>{recipe.time} min · {recipe.tag}</p><span className="prep-toggle done"><span><Check size={12}/></span>Added to meal plan</span></div></article> : null)}</div></section>
    <div className="lower-grid"><section className="panel kitchen-panel"><div className="panel-heading"><div><h2>Kitchen watch</h2><p>Items that need your attention</p></div><button onClick={() => setActive("Kitchen")}>View all</button></div><div className="inventory-list">{inventory.map((item)=><div className="inventory-row" key={item.name}><span className="food-icon">{item.icon}</span><div className="inventory-copy"><div><strong>{item.name}</strong><em>{item.status}</em></div><span>{item.detail}</span><div className="stock-bar"><i style={{width:`${item.percent}%`}}/></div></div><button onClick={()=>notify(`${item.name} added to your list`)}><Plus size={17}/></button></div>)}</div><div className="smart-note"><Sparkles size={18}/><p><strong>Smart inventory is on</strong><span>We’ll deduct ingredients as you cook.</span></p><ChevronRight size={18}/></div></section><section className="panel shopping-panel"><div className="panel-heading"><div><h2>Plan to cart</h2><p>Build a list from this week’s menu</p></div><span className="list-badge"><ListChecks size={16}/>Smart list</span></div><div className="generator-hero"><WandSparkles size={27}/><h3>Everything you need, nothing you don’t.</h3><p>We’ll combine ingredients and skip staples already in your kitchen.</p></div><button className="generate-button" onClick={generateGroceries}>Generate weekly list <ArrowRight size={16}/></button></section></div></>;
}

function MealPlanner({ plan, plannedRecipes, weekLabel, setWeek, setPickerDay, generateGroceries, setPlan }: { recipes:Recipe[]; plan:(string|null)[]; plannedRecipes:(Recipe|undefined)[]; weekLabel:string; setWeek:React.Dispatch<React.SetStateAction<number>>; setPickerDay:(value:number)=>void; generateGroceries:()=>void; setPlan:React.Dispatch<React.SetStateAction<(string|null)[]>> }) {
  return <><PageHeader eyebrow="Weekly menu" title="Plan the week together" copy="Choose dinners, balance the week, then turn it into one tidy shopping list."><div className="week-controls"><button onClick={()=>setWeek(v=>v-1)}><ChevronLeft size={18}/></button><span>{weekLabel}</span><button onClick={()=>setWeek(v=>v+1)}><ChevronRight size={18}/></button></div></PageHeader>
    <div className="planner-toolbar"><div><Users size={17}/><span>4 servings per meal</span></div><button className="secondary-action" onClick={()=>setPlan([null,null,null,null,null,null,null])}><RefreshCw size={15}/>Clear week</button><button className="primary-button" onClick={generateGroceries}><WandSparkles size={16}/>Generate shopping list</button></div>
    <section className="week-grid">{weekdays.map((day,index)=>{const recipe=plannedRecipes[index];return <article className={`day-column ${recipe?"filled":""}`} key={day}><div className="day-heading"><span>{day.slice(0,3)}</span><strong>{dates[index]}</strong></div>{recipe?<button className={`planned-meal ${recipe.tone}`} onClick={()=>setPickerDay(index)}><span className="planned-emoji">{recipe.emoji}</span><span className="meal-kind">Dinner</span><strong>{recipe.name}</strong><small><Clock3 size={13}/>{recipe.time} min</small><em>Swap meal</em></button>:<button className="empty-meal" onClick={()=>setPickerDay(index)}><Plus size={20}/><strong>Add dinner</strong><span>Choose a recipe</span></button>}</article>})}</section>
    <section className="planner-insight"><div className="insight-icon"><Sparkles size={21}/></div><div><strong>Your week looks nicely balanced</strong><p>Five quick dinners, one vegetarian meal, and a relaxed Sunday breakfast.</p></div><span>{plan.filter(Boolean).length}/7 planned</span></section></>;
}

function RecipeLibrary({ recipes, total, query, setQuery, category, setCategory, setModalOpen, quickPlan }: { recipes:Recipe[]; total:number; query:string; setQuery:(v:string)=>void; category:string; setCategory:(v:string)=>void; setModalOpen:(v:boolean)=>void; quickPlan:(id:string)=>void }) {
  return <><PageHeader eyebrow="Recipe database" title="Your family cookbook" copy={`${total} recipes saved and ready to plan.`}><button className="primary-button desktop-add" onClick={()=>setModalOpen(true)}><Plus size={17}/>Add new recipe</button></PageHeader><div className="library-toolbar"><div className="library-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your recipes..."/></div><div className="filter-pills">{["All","Dinner","Lunch","Breakfast"].map(item=><button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div></div><div className="recipe-grid">{recipes.map(recipe=><article className="recipe-card" key={recipe.id}><div className={`recipe-cover ${recipe.tone}`}><span>{recipe.emoji}</span><button aria-label="Favorite recipe"><Heart size={17}/></button><em>{recipe.category}</em></div><div className="recipe-card-copy"><h3>{recipe.name}</h3><p><Clock3 size={14}/>{recipe.time} min <span>•</span> {recipe.ingredients.length} ingredients</p><div><span>{recipe.tag}</span><button onClick={()=>quickPlan(recipe.id)}><Plus size={14}/>Plan</button></div></div></article>)}</div>{recipes.length===0&&<div className="empty-state"><Search size={28}/><h3>No recipes found</h3><p>Try another search or add a new family favorite.</p></div>}</>;
}

function GroceryList({ groceries, groups, checkedCount, generateGroceries, setGroceries, newItem, setNewItem, addCustomItem, notify }: { groceries:Grocery[]; groups:[string,Grocery[]][]; checkedCount:number; generateGroceries:()=>void; setGroceries:React.Dispatch<React.SetStateAction<Grocery[]>>; newItem:string; setNewItem:(v:string)=>void; addCustomItem:()=>void; notify:(v:string)=>void }) {
  const progress=groceries.length?Math.round((checkedCount/groceries.length)*100):0;
  return <><PageHeader eyebrow="Weekly shopping" title="Your shopping list" copy={groceries.length?`${groceries.length-checkedCount} items left for this week.`:"Generate a list from your planned meals."}><button className="primary-button" onClick={generateGroceries}><WandSparkles size={16}/>Regenerate</button></PageHeader>{groceries.length>0?<><section className="shopping-progress"><div><span><ShoppingCart size={18}/>Weekly shop</span><strong>{progress}% complete</strong></div><div><i style={{width:`${progress}%`}}/></div></section><div className="grocery-layout"><section className="grocery-sheet"><form className="quick-add" onSubmit={e=>{e.preventDefault();addCustomItem()}}><Plus size={17}/><input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Add another item..."/><button>Add</button></form>{groups.map(([aisle,items])=><div className="aisle-group" key={aisle}><div className="aisle-title"><h3>{aisle}</h3><span>{items.length} items</span></div>{items.map(item=><label className={`grocery-row ${item.checked?"checked":""}`} key={item.id}><input type="checkbox" checked={item.checked} onChange={()=>setGroceries(current=>current.map(g=>g.id===item.id?{...g,checked:!g.checked}:g))}/><span className="custom-check">{item.checked&&<Check size={12}/>}</span><strong>{item.name}</strong><small>{item.amount}</small><button type="button" onClick={()=>setGroceries(current=>current.filter(g=>g.id!==item.id))}><Trash2 size={15}/></button></label>)}</div>)}</section><aside className="cart-panel"><p className="eyebrow">Smart checkout</p><h2>Send it to your cart</h2><p>Compare your list across nearby retailers.</p><div className="store-stack"><button onClick={()=>notify("Walmart cart connection started")}><span className="store-logo walmart">✦</span><span><strong>Walmart</strong><small>Best match · est. $52.40</small></span><ArrowRight size={16}/></button><button onClick={()=>notify("Target cart connection started")}><span className="store-logo target">◎</span><span><strong>Target</strong><small>{Math.max(groceries.length-2,0)} items available</small></span><ArrowRight size={16}/></button></div><button className="compare-button" onClick={()=>notify("Comparing nearby stores...")}><CreditCard size={17}/>Compare all stores</button><div className="pantry-savings"><Leaf size={17}/><span><strong>5 pantry staples skipped</strong><small>Estimated savings: $12.30</small></span></div></aside></div></>:<div className="empty-state big"><div className="empty-illustration"><ShoppingBasket size={36}/></div><h3>Your list is ready when your menu is</h3><p>We’ll gather every ingredient from this week’s recipes and group them by aisle.</p><button className="primary-button" onClick={generateGroceries}><WandSparkles size={16}/>Generate weekly list</button></div>}</>;
}

function KitchenView({ notify }: { notify:(v:string)=>void }) { return <><PageHeader eyebrow="Kitchen inventory" title="Know what you have" copy="Keep an eye on freshness, quantities, and what to use next."/><div className="kitchen-full-grid">{inventory.map(item=><article className="kitchen-stock-card" key={item.name}><span>{item.icon}</span><div><small>{item.status}</small><h3>{item.name}</h3><p>{item.detail}</p><div className="stock-bar"><i style={{width:`${item.percent}%`}}/></div></div><button onClick={()=>notify(`${item.name} added to your list`)}><Plus size={17}/>Add to list</button></article>)}</div></> }
