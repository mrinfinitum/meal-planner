"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CookingPot,
  CreditCard,
  House,
  Leaf,
  ListChecks,
  MoreHorizontal,
  PackageOpen,
  Plus,
  Search,
  Settings,
  ShoppingBasket,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { label: "Overview", icon: House },
  { label: "Meal plan", icon: CalendarDays },
  { label: "Recipes", icon: CookingPot },
  { label: "Groceries", icon: ShoppingBasket, count: 12 },
  { label: "Kitchen", icon: PackageOpen },
];

const days = [
  { day: "Mon", date: "18", meal: "Lemon herb chicken", meta: "35 min · Family favorite", tone: "lemon", emoji: "🍋", complete: true },
  { day: "Tue", date: "19", meal: "Creamy tomato orzo", meta: "25 min · One pot", tone: "tomato", emoji: "🍅" },
  { day: "Wed", date: "20", meal: "Salmon rice bowls", meta: "30 min · High protein", tone: "salmon", emoji: "🐟" },
  { day: "Thu", date: "21", meal: "Taco night", meta: "20 min · Kid friendly", tone: "taco", emoji: "🌮" },
];

const inventory = [
  { name: "Baby spinach", detail: "Use within 2 days", percent: 28, icon: "🥬", status: "Soon" },
  { name: "Greek yogurt", detail: "About 1 cup left", percent: 42, icon: "🥣", status: "Low" },
  { name: "Avocados", detail: "2 ripe now", percent: 65, icon: "🥑", status: "Ready" },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [week, setWeek] = useState(0);
  const [checked, setChecked] = useState([true, true, false, false]);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  const weekLabel = week === 0 ? "August 18–24" : week < 0 ? "August 11–17" : "August 25–31";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Leaf size={19} strokeWidth={2.6} /></div>
          <span>plenty.</span>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {nav.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => setActive(label)}>
              <Icon size={18} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="household-card">
          <div className="household-icon"><Users size={18} /></div>
          <div><strong>The Parkers</strong><span>4 family members</span></div>
          <ChevronDown size={16} />
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item"><CircleHelp size={18} /><span>Help & support</span></button>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
          <div className="profile">
            <div className="avatar">GP</div>
            <div><strong>Geoff Parker</strong><span>Family admin</span></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Leaf size={17} /></div><span>plenty.</span></div>
          <div className="search-wrap">
            <Search size={18} />
            <input aria-label="Search" placeholder="Search recipes, ingredients..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
          <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> <span>Add recipe</span></button>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><Sparkles size={14} /> Tuesday, August 18</p>
              <h1>Good evening, Geoff</h1>
              <p className="subtitle">Dinner is handled. Here’s what’s happening in your kitchen.</p>
            </div>
            <div className="week-controls">
              <button aria-label="Previous week" onClick={() => setWeek((value) => value - 1)}><ChevronLeft size={18} /></button>
              <span>{weekLabel}</span>
              <button aria-label="Next week" onClick={() => setWeek((value) => value + 1)}><ChevronRight size={18} /></button>
            </div>
          </section>

          <section className="metrics" aria-label="Household summary">
            <div className="metric"><span className="metric-icon purple"><CalendarDays size={19} /></span><div><small>Meals planned</small><strong>5 <em>/ 7 days</em></strong></div><span className="trend">+2</span></div>
            <div className="metric"><span className="metric-icon green"><PackageOpen size={19} /></span><div><small>Kitchen inventory</small><strong>42 <em>items</em></strong></div><span className="status-dot">Healthy</span></div>
            <div className="metric"><span className="metric-icon amber"><ShoppingBasket size={19} /></span><div><small>Shopping list</small><strong>12 <em>items</em></strong></div><button className="metric-link" onClick={() => { setActive("Groceries"); notify("Shopping list opened"); }}>View list <ArrowRight size={14} /></button></div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div><h2>This week’s dinners</h2><p>Your plan updates inventory automatically.</p></div>
              <button className="text-button" onClick={() => setActive("Meal plan")}>Full meal plan <ArrowRight size={15} /></button>
            </div>
            <div className="meal-grid">
              {days.map((item, index) => (
                <article className={`meal-card ${item.tone}`} key={item.day}>
                  <div className="meal-visual"><span>{item.emoji}</span><div className="meal-date"><b>{item.day}</b><strong>{item.date}</strong></div><button aria-label={`More options for ${item.meal}`}><MoreHorizontal size={18} /></button></div>
                  <div className="meal-info">
                    <h3>{item.meal}</h3>
                    <p><Clock3 size={14} /> {item.meta}</p>
                    <button className={`prep-toggle ${checked[index] ? "done" : ""}`} onClick={() => setChecked((current) => current.map((value, i) => i === index ? !value : value))}>
                      <span>{checked[index] && <Check size={12} strokeWidth={3} />}</span>{checked[index] ? "Ingredients ready" : "Check ingredients"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="lower-grid">
            <section className="panel kitchen-panel">
              <div className="panel-heading"><div><h2>Kitchen watch</h2><p>Items that need your attention</p></div><button onClick={() => setActive("Kitchen")}>View all</button></div>
              <div className="inventory-list">
                {inventory.map((item) => (
                  <div className="inventory-row" key={item.name}>
                    <span className="food-icon">{item.icon}</span>
                    <div className="inventory-copy"><div><strong>{item.name}</strong><em>{item.status}</em></div><span>{item.detail}</span><div className="stock-bar"><i style={{ width: `${item.percent}%` }} /></div></div>
                    <button aria-label={`Add ${item.name} to list`} onClick={() => notify(`${item.name} added to your list`)}><Plus size={17} /></button>
                  </div>
                ))}
              </div>
              <div className="smart-note"><Sparkles size={18} /><p><strong>Smart inventory is on</strong><span>We’ll deduct ingredients as you cook.</span></p><button onClick={() => notify("Inventory settings opened")}><ChevronRight size={18} /></button></div>
            </section>

            <section className="panel shopping-panel">
              <div className="panel-heading"><div><h2>Ready to shop</h2><p>12 items · Estimated $47.80</p></div><span className="list-badge"><ListChecks size={16} /> 2 of 12</span></div>
              <div className="store-stack">
                <button onClick={() => notify("Walmart cart connection started")}><span className="store-logo walmart">✦</span><span><strong>Walmart</strong><small>Best match · $43.20</small></span><em>Send to cart</em><ArrowRight size={16} /></button>
                <button onClick={() => notify("Target cart connection started")}><span className="store-logo target">◎</span><span><strong>Target</strong><small>10 of 12 available · $46.15</small></span><em>Send to cart</em><ArrowRight size={16} /></button>
              </div>
              <button className="compare-button" onClick={() => notify("Comparing nearby stores...")}><CreditCard size={17} /> Compare all stores</button>
              <p className="integration-note">Cart integrations connect securely at checkout.</p>
            </section>
          </div>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={20} /><span>{label === "Meal plan" ? "Plan" : label === "Groceries" ? "List" : label}</span></button>)}
      </nav>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}><X size={19} /></button><div className="modal-icon"><CookingPot size={24} /></div><p className="eyebrow">Recipe collection</p><h2 id="modal-title">Add something delicious</h2><p>Save a recipe from anywhere or create your own from scratch.</p><label>Recipe link<input autoFocus placeholder="Paste a recipe URL" /></label><div className="modal-actions"><button className="secondary-button" onClick={() => notify("Recipe editor opened")}>Create manually</button><button className="primary-button" onClick={() => { setModalOpen(false); notify("Recipe imported"); }}>Import recipe</button></div></div></div>}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}
