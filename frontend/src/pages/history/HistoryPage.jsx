import { useEffect, useState } from "react";
import { CalendarDays, Flower2, History, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { flowerApi } from "../../services/auth/authService";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    flowerApi.history().then((response) => setItems(response.items)).catch((caught) => setError(caught.message)).finally(() => setLoading(false));
  }, []);

  const visible = items.filter((item) => `${item.common_name} ${item.scientific_name}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="history-page container">
      <header className="history-heading"><div><span className="eyebrow"><History size={15} /> Your private collection</span><h1>Discovery history</h1><p>Every plant you identify or search becomes part of your learning trail.</p></div><button className="button primary" onClick={() => navigate("/discover")}><Sparkles /> New discovery</button></header>
      <div className="history-toolbar"><div className="input-shell"><Search /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search your flowers" /></div><span>{visible.length} discoveries</span></div>
      {loading && <div className="empty-state"><span className="spinner large" /><p>Opening your garden…</p></div>}
      {error && <div className="workspace-error">{error}</div>}
      {!loading && !error && visible.length === 0 && <div className="empty-state"><Flower2 /><h2>Your garden is ready to bloom</h2><p>Identify your first flower to begin a visual learning history.</p><button className="button primary" onClick={() => navigate("/discover")}>Start discovering</button></div>}
      <div className="history-grid">
        {visible.map((item) => <article className="history-card" key={item.id}><div className="history-image">{item.hero_image ? <img src={item.hero_image} alt={item.common_name} /> : <Flower2 /> }<span>{Math.round(item.confidence * 100)}%</span></div><div><small>{item.result?.family || "Flowering plant"}</small><h3>{item.common_name}</h3><i>{item.scientific_name}</i><p><CalendarDays /> {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</p><button onClick={() => navigate("/discover", { state: { historyResult: item.result } })}>Explore again</button></div></article>)}
      </div>
    </section>
  );
}
