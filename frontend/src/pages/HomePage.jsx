import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BellRing, CalendarDays, Camera, Check,
  ChevronRight, Clock3, Droplets, Flower2, HeartPulse, History, Leaf, MapPinned,
  ScanLine, Sparkles, Sprout, Sun,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { DEMO_HISTORY } from "../data/demoData";
import { createDemoGarden } from "../data/gardenDemoData";
import { DEMO_MODE, flowerApi, gardenApi } from "../services/auth/authService";

function relativeDue(value) {
  const hours = Math.round((new Date(value).getTime() - Date.now()) / 3600000);
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours < 24) return `in ${Math.max(hours, 1)}h`;
  if (hours < 48) return "tomorrow";
  return `in ${Math.round(hours / 24)}d`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  [Camera, "Identify a plant", "Camera, upload, voice or text", "/discover", "lime"],
  [ScanLine, "Scan my garden", "Dimensions and every corner", "/garden", "aqua"],
  [HeartPulse, "Check plant health", "Inspect visible changes", "/garden", "rose"],
  [History, "Open discoveries", "Revisit complete profiles", "/history", "violet"],
];

export default function HomePage() {
  const { user } = useAuth();
  const [garden, setGarden] = useState(() => createDemoGarden());
  const [history, setHistory] = useState(() => DEMO_MODE ? DEMO_HISTORY : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [gardens, discoveries] = await Promise.all([gardenApi.list(), flowerApi.history()]);
        let currentGarden = garden;
        if (gardens.items?.length) currentGarden = await gardenApi.dashboard(gardens.items[0].id);
        if (active) {
          setGarden(currentGarden);
          setHistory(discoveries.items || []);
        }
      } catch (caught) {
        if (active) setError(caught.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const activeTasks = useMemo(() => (garden.tasks || []).filter((task) => task.status !== "completed"), [garden.tasks]);
  const priorityTasks = useMemo(() => activeTasks
    .filter((task) => ["urgent", "high"].includes(task.priority) || task.status === "overdue")
    .slice(0, 3), [activeTasks]);
  const averageHealth = Math.round((garden.plants || []).reduce((total, plant) => total + plant.health_score, 0) / Math.max(garden.plants?.length || 0, 1));
  const attentionPlants = (garden.plants || []).filter((plant) => plant.health_score < 75).length;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Explorer";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  if (loading) return <div className="empty-state"><span className="spinner large" /><p>Preparing your BloomSense home…</p></div>;

  return (
    <section className="member-home container">
      <header className="home-welcome">
        <div>
          <span className="home-date"><CalendarDays /> {today}</span>
          <h1>{greeting()}, {firstName}.</h1>
          <p>Your garden has <b>{priorityTasks.length} priorities</b> and <b>{attentionPlants} plant needing attention</b>. Here is the complete picture for today.</p>
        </div>
        <div className="home-header-actions">
          <Link className="button ghost" to="/garden"><MapPinned /> Open garden</Link>
          <Link className="button primary" to="/discover"><Camera /> Identify plant</Link>
        </div>
      </header>

      {DEMO_MODE && <div className="home-demo-note"><Sparkles /> You are exploring a private demo home. Every card opens a working BloomSense mode.<span>Interactive demo</span></div>}
      {error && <div className="workspace-error">{error}</div>}

      <div className="home-command-grid">
        <article className="home-pulse-card">
          <div className="home-card-heading"><span><Sprout /> {garden.name}</span><Link to="/garden">View details <ArrowRight /></Link></div>
          <div className="pulse-overview">
            <div className="garden-score" style={{ "--score": `${averageHealth * 3.6}deg` }}><div><b>{averageHealth}</b><span>health score</span></div></div>
            <div className="pulse-copy"><small>GARDEN PULSE</small><h2>{averageHealth >= 85 ? "Your garden is thriving" : "Mostly healthy, with a few priorities"}</h2><p>{garden.analysis?.recommendations?.[1] || "Review today’s care plan to keep every plant moving in the right direction."}</p><div><span><Sun /> {garden.environment?.sunlight_hours}</span><span><Droplets /> {garden.environment?.soil_moisture}</span></div></div>
          </div>
          <div className="pulse-stats"><span><b>{garden.plants?.length || 0}</b><small>plants monitored</small></span><span><b>{garden.zones?.length || 0}</b><small>growing zones</small></span><span><b>{garden.analysis?.coverage_score || 0}%</b><small>scan coverage</small></span><span><b>{activeTasks.length}</b><small>open care tasks</small></span></div>
        </article>

        <aside className="today-priority-card">
          <div className="home-card-heading"><span><BellRing /> Today’s priorities</span><Link to="/garden">Care plan <ArrowRight /></Link></div>
          <div className="priority-list">
            {priorityTasks.length ? priorityTasks.map((task) => {
              const plant = garden.plants.find((item) => item.id === task.plant_id);
              return (
                <Link to="/garden" className={`priority-item ${task.priority}`} key={task.id}>
                  <i>{task.task_type === "water" ? <Droplets /> : <AlertTriangle />}</i>
                  <span><small>{relativeDue(task.due_at)}{plant ? ` · ${plant.nickname}` : ""}</small><b>{task.title}</b><em>{task.details}</em></span><ChevronRight />
                </Link>
              );
            }) : <div className="all-clear"><Check /><b>All clear for today</b><span>Your next care items will appear here.</span></div>}
          </div>
          <Link className="priority-footer" to="/garden"><Clock3 /> {activeTasks.length} open tasks across the garden <ArrowRight /></Link>
        </aside>
      </div>

      <section className="home-section">
        <div className="home-section-title"><div><span>START HERE</span><h2>What would you like to do?</h2></div><p>Jump straight into a focused BloomSense workspace.</p></div>
        <div className="quick-action-grid">
          {quickActions.map(([Icon, title, text, to, colour]) => (
            <Link className={`quick-action ${colour}`} to={to} key={title}><i><Icon /></i><span><b>{title}</b><small>{text}</small></span><ArrowRight /></Link>
          ))}
        </div>
      </section>

      <div className="home-detail-grid">
        <section className="home-section home-plant-section">
          <div className="home-section-title"><div><span>PLANT HEALTH</span><h2>Plants under watch</h2></div><Link to="/garden">All plants <ArrowRight /></Link></div>
          <div className="home-plant-list">
            {garden.plants?.map((plant) => (
              <Link to="/garden" className="home-plant-row" key={plant.id}>
                <img src={plant.hero_image} alt={plant.common_name} />
                <span><b>{plant.nickname}</b><small>{plant.common_name} · {plant.zone_name}</small></span>
                <div><strong className={plant.health_status}>{plant.health_score}</strong><small>{plant.health_status === "attention" ? "Needs attention" : plant.health_status}</small></div>
                <i className="plant-health-bar"><em style={{ width: `${plant.health_score}%` }} /></i>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section home-progress-section">
          <div className="home-section-title"><div><span>YOUR MOMENTUM</span><h2>Garden progress</h2></div><Activity /></div>
          <div className="progress-hero"><span>+6</span><div><b>health points</b><small>Across the latest monitoring cycle</small></div></div>
          <div className="home-progress-bars"><div><span><b>Care completed on time</b><small>87%</small></span><i><em style={{ width: "87%" }} /></i></div><div><span><b>Garden scan coverage</b><small>{garden.analysis?.coverage_score || 0}%</small></span><i><em style={{ width: `${garden.analysis?.coverage_score || 0}%` }} /></i></div></div>
          <p><Leaf /> Keep the weekly photo rhythm to make health changes easier to compare.</p>
          <Link className="text-link" to="/garden">Open progress timeline <ArrowRight /></Link>
        </section>
      </div>

      <section className="home-section recent-section">
        <div className="home-section-title"><div><span>RECENT DISCOVERIES</span><h2>Continue learning</h2></div><Link to="/history">Complete history <ArrowRight /></Link></div>
        <div className="recent-discovery-grid">
          {history.slice(0, 3).map((item) => (
            <Link to="/discover" state={{ historyResult: item.result }} className="recent-discovery" key={item.id}>
              <img src={item.hero_image} alt={item.common_name} />
              <div><small>{Math.round(item.confidence * 100)}% match</small><h3>{item.common_name}</h3><i>{item.scientific_name}</i><span>Open complete profile <ArrowRight /></span></div>
            </Link>
          ))}
          <Link to="/discover" className="recent-new"><i><Flower2 /></i><b>Identify something new</b><span>Use a photo, camera, voice or flower name.</span><em>Start discovery <ArrowRight /></em></Link>
        </div>
      </section>
    </section>
  );
}
