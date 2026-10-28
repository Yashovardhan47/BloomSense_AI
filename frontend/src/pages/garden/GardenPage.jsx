import { useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, BellRing, Camera, Check, CheckCircle2, Clock3, CloudSun,
  Droplets, Flower2, Gauge, Grid3X3, HeartPulse, ImagePlus, Leaf, ListChecks, Map,
  Plus, RefreshCcw, Ruler, ScanLine, Sprout, Sun, ThermometerSun, Upload, Wind,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { createDemoGarden } from "../../data/gardenDemoData";
import { DEMO_MODE, gardenApi } from "../../services/auth/authService";

const tabs = [
  ["overview", Grid3X3, "Overview"],
  ["scan", ScanLine, "Garden scan"],
  ["health", HeartPulse, "Plant health"],
  ["care", ListChecks, "Care & alerts"],
  ["progress", Activity, "Progress"],
];

const statusLabel = { healthy: "Healthy", watch: "Watch", attention: "Needs attention", critical: "Critical" };

function dueText(value) {
  const hours = Math.round((new Date(value).getTime() - Date.now()) / 3600000);
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours < 24) return `in ${hours || 1}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function metricIcon(key) {
  return { temperature: ThermometerSun, humidity: Wind, soil_moisture: Droplets, sunlight_hours: Sun, rain_outlook: CloudSun }[key] || Gauge;
}

export default function GardenPage() {
  const [garden, setGarden] = useState(() => createDemoGarden());
  const [tab, setTab] = useState("overview");
  const [selectedPlantId, setSelectedPlantId] = useState("plant-sunflower");
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [healthFile, setHealthFile] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", details: "", priority: "medium", plant_id: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const addedPlantRef = useRef(false);

  useEffect(() => {
    if (DEMO_MODE) return;
    gardenApi.list()
      .then(async ({ items }) => {
        if (items.length) setGarden(await gardenApi.dashboard(items[0].id));
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const incoming = location.state?.addPlant;
    if (!incoming || addedPlantRef.current) return;
    if (!DEMO_MODE && loading) return;
    addedPlantRef.current = true;
    const newPlant = {
      id: `plant-${Date.now()}`,
      ...incoming,
      nickname: incoming.nickname || incoming.common_name,
      zone_name: "Unplaced · map this plant",
      position_x: 50,
      position_y: 50,
      watering_interval_days: 3,
      health_score: 0,
      health_status: "watch",
      hydration: "not checked",
      next_water_at: new Date(Date.now() + 86400000).toISOString(),
      last_watered_at: null,
      trend: [0],
      signals: ["Newly added from plant detection", "Capture a health photo to establish a baseline"],
      action: "Place this plant on the garden map and run its first health check",
    };
    if (DEMO_MODE) {
      setGarden((current) => ({ ...current, plants: [newPlant, ...current.plants] }));
      setSelectedPlantId(newPlant.id);
      setTab("health");
      setNotice(`${newPlant.common_name} was added. Place it on the map and create its first health baseline.`);
    } else if (garden.id) {
      gardenApi.addPlant(garden.id, newPlant).then((saved) => {
        setGarden((current) => ({ ...current, plants: [saved, ...current.plants] }));
        setSelectedPlantId(saved.id); setTab("health");
      }).catch((error) => setNotice(error.message));
    }
    navigate("/garden", { replace: true, state: null });
  }, [garden.id, loading, location.state, navigate]);

  const selectedPlant = garden.plants.find((plant) => plant.id === selectedPlantId) || garden.plants[0];
  const activeTasks = garden.tasks.filter((task) => task.status !== "completed");
  const urgentTasks = activeTasks.filter((task) => ["urgent", "high"].includes(task.priority) || task.status === "overdue");
  const averageHealth = Math.round(garden.plants.reduce((total, plant) => total + plant.health_score, 0) / Math.max(garden.plants.length, 1));

  const updatePlant = (plantId, values) => setGarden((current) => ({
    ...current,
    plants: current.plants.map((plant) => plant.id === plantId ? { ...plant, ...values } : plant),
  }));

  const markWatered = async (plant) => {
    try {
      const saved = !DEMO_MODE ? await gardenApi.water(garden.id, plant.id) : {
        ...plant,
        last_watered_at: new Date().toISOString(),
        next_water_at: new Date(Date.now() + (plant.watering_interval_days || 3) * 86400000).toISOString(),
        hydration: "recently watered",
      };
      updatePlant(plant.id, saved);
      setGarden((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.plant_id === plant.id && task.task_type === "water" ? { ...task, status: "completed" } : task),
        timeline: [{ id: Date.now(), type: "water", title: `${plant.nickname} was watered`, detail: "The next soil check has been scheduled.", at: new Date().toISOString() }, ...current.timeline],
      }));
      setNotice(`${plant.nickname} is marked as watered. Next soil check scheduled.`);
    } catch (error) { setNotice(error.message); }
  };

  const completeTask = async (taskId) => {
    if (!DEMO_MODE) await gardenApi.completeTask(garden.id, taskId);
    setGarden((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, status: "completed" } : task) }));
    setNotice("Garden work completed and added to progress.");
  };

  const snoozeTask = async (taskId) => {
    if (!DEMO_MODE) await gardenApi.snoozeTask(garden.id, taskId, 1);
    setGarden((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, status: "pending", due_at: new Date(Date.now() + 86400000).toISOString() } : task),
    }));
    setNotice("Reminder moved to tomorrow.");
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    const task = {
      id: `task-${Date.now()}`,
      task_type: "custom",
      title: taskForm.title.trim(),
      details: taskForm.details.trim(),
      priority: taskForm.priority,
      plant_id: taskForm.plant_id || null,
      due_at: new Date(Date.now() + 86400000).toISOString(),
      status: "pending",
    };
    try {
      const saved = !DEMO_MODE ? await gardenApi.createTask(garden.id, task) : task;
      setGarden((current) => ({ ...current, tasks: [...current.tasks, saved] }));
      setTaskForm({ title: "", details: "", priority: "medium", plant_id: "" });
      setNotice("New garden task scheduled for tomorrow.");
    } catch (error) { setNotice(error.message); }
  };

  const addCornerPhoto = async (corner, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setNotice("Garden views must be JPEG, PNG, or WebP and no larger than 3 MB."); return;
    }
    setBusy(true);
    try {
      let saved = { image: URL.createObjectURL(file), captured: true, note: file.name };
      if (!DEMO_MODE) {
        const form = new FormData(); form.append("corner", corner); form.append("image", file);
        saved = await gardenApi.addPhoto(garden.id, form);
      }
      setGarden((current) => ({
        ...current,
        photo_slots: current.photo_slots.map((slot) => slot.corner === corner ? { ...slot, ...saved } : slot),
      }));
      setNotice(`${corner[0].toUpperCase() + corner.slice(1)} view saved. Run the full scan when all views are ready.`);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  const analyzeGarden = async () => {
    setBusy(true); setNotice("");
    const locallyAnalyze = () => {
      const captured = garden.photo_slots.filter((slot) => slot.captured);
      const missing = garden.photo_slots.filter((slot) => !slot.captured).map((slot) => slot.corner);
      const coverage = Math.round((captured.length / garden.photo_slots.length) * 100);
      setGarden((current) => ({ ...current, analysis: { ...current.analysis, coverage_score: coverage, captured_views: captured.map((slot) => slot.corner), missing_views: missing } }));
      setNotice(missing.length ? `Scan complete. Add ${missing.join(" and ")} views for full coverage.` : "Full six-view scan complete. Plant map and care priorities are current.");
    };
    if (DEMO_MODE) {
      window.setTimeout(() => { locallyAnalyze(); setBusy(false); }, 900);
      return;
    }
    try {
      await gardenApi.update(garden.id, {
        name: garden.name, location: garden.location, length_m: Number(garden.length_m), width_m: Number(garden.width_m),
        orientation: garden.orientation, climate: garden.climate, soil_type: garden.soil_type,
        sunlight: garden.sunlight, irrigation_method: garden.irrigation_method, notes: garden.notes,
      });
      const saved = await gardenApi.analyze(garden.id, { length_m: Number(garden.length_m), width_m: Number(garden.width_m) });
      setGarden(saved);
      setNotice(saved.analysis.missing_views.length ? `Scan saved. Add ${saved.analysis.missing_views.join(" and ")} views for full coverage.` : "Full six-view scan saved. Plant map and priorities are current.");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  const runHealthCheck = async (plant) => {
    setBusy(true); setSelectedPlantId(plant.id);
    if (DEMO_MODE) {
      window.setTimeout(() => {
        const nextScore = Math.min(100, plant.health_score + (plant.health_score < 75 ? 2 : 1));
        updatePlant(plant.id, { health_score: nextScore, health_status: nextScore >= 85 ? "healthy" : nextScore >= 65 ? "watch" : "attention", trend: [...plant.trend.slice(-4), nextScore] });
        setBusy(false);
        setNotice(`${plant.nickname}'s demo screening is complete. It is illustrative—not a disease diagnosis.`);
      }, 900);
      return;
    }
    if (!healthFile) { setBusy(false); setNotice("Add a current health photo before running the check."); return; }
    try {
      const form = new FormData(); form.append("image", healthFile);
      const saved = await gardenApi.healthCheck(garden.id, plant.id, form);
      updatePlant(plant.id, saved); setHealthFile(null);
      setNotice(`${plant.nickname}'s health photo was recorded. Review the evidence and recommended action.`);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="empty-state"><span className="spinner large" /><p>Opening your garden…</p></div>;

  return (
    <section className="garden-page container">
      <header className="garden-heading">
        <div>
          <span className="eyebrow"><Sprout size={15} /> Personal garden intelligence</span>
          <div className="garden-title-row"><h1>{garden.name}</h1><span className="garden-live"><i /> Monitoring active</span></div>
          <p>{garden.location} · {garden.length_m} × {garden.width_m} m · {garden.area_m2} m² · {garden.orientation}</p>
        </div>
        <div className="garden-heading-actions">
          <button className="button ghost" onClick={() => setTab("scan")}><Camera /> Update garden scan</button>
          <button className="button primary" onClick={() => navigate("/discover")}><Plus /> Detect and add plant</button>
        </div>
      </header>

      {DEMO_MODE && <div className="demo-banner"><Leaf /> Interactive garden inspection build. Changes last for this visit; the FastAPI version stores gardens, scans, plants, health history, and recurring work.</div>}
      {notice && <button className="garden-notice" onClick={() => setNotice("")}><CheckCircle2 /> {notice}<span>Dismiss</span></button>}

      <div className="garden-tabs" role="tablist">
        {tabs.map(([key, Icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon /> {label}</button>)}
      </div>

      {tab === "overview" && (
        <div className="garden-overview">
          <div className="garden-kpis">
            <article><span><Flower2 /> Plants mapped</span><b>{garden.plants.length}</b><small>Across {garden.zones.length} growing zones</small></article>
            <article><span><HeartPulse /> Garden health</span><b>{averageHealth}%</b><small>{garden.plants.filter((p) => p.health_score < 75).length} plant needs attention</small></article>
            <article><span><BellRing /> Active care</span><b>{activeTasks.length}</b><small>{urgentTasks.length} high-priority alert{urgentTasks.length === 1 ? "" : "s"}</small></article>
            <article><span><ScanLine /> Scan coverage</span><b>{garden.analysis.coverage_score}%</b><small>{garden.analysis.missing_views.length ? `${garden.analysis.missing_views.length} views still needed` : "All views captured"}</small></article>
          </div>

          <div className="garden-main-grid">
            <article className="garden-panel garden-map-panel">
              <div className="panel-heading"><div><span>Live garden map</span><h2>Every plant in its place</h2></div><button onClick={() => setTab("scan")}><Map /> Edit layout</button></div>
              <div className="garden-map" aria-label="Mapped garden plants">
                <div className="map-path horizontal" /><div className="map-path vertical" />
                {garden.zones.map((zone, index) => <span className={`map-zone zone-${index + 1}`} key={zone.id} style={{ "--zone": zone.colour }}><b>{zone.name}</b><small>{zone.light} · {zone.moisture}% moisture</small></span>)}
                {garden.plants.map((plant) => <button key={plant.id} className={`plant-pin ${selectedPlantId === plant.id ? "selected" : ""}`} style={{ left: `${plant.position_x}%`, top: `${plant.position_y}%` }} onClick={() => setSelectedPlantId(plant.id)} aria-label={`Open ${plant.nickname}`}><img src={plant.hero_image} alt="" /><i className={plant.health_status} /></button>)}
                <div className="map-scale"><Ruler /> {garden.length_m} m × {garden.width_m} m</div>
              </div>
              {selectedPlant && <div className="selected-plant-strip"><img src={selectedPlant.hero_image} alt={selectedPlant.common_name} /><div><small>{selectedPlant.zone_name}</small><b>{selectedPlant.nickname} · {selectedPlant.common_name}</b><span>{selectedPlant.health_score}% health · Water {dueText(selectedPlant.next_water_at)}</span></div><button onClick={() => { setTab("health"); setSelectedPlantId(selectedPlant.id); }}>Open health record</button></div>}
            </article>

            <aside className="garden-panel alert-panel">
              <div className="panel-heading"><div><span>Smart alerts</span><h2>What needs you now</h2></div><b className="alert-count">{urgentTasks.length}</b></div>
              <div className="alert-list">
                {urgentTasks.map((task) => {
                  const plant = garden.plants.find((item) => item.id === task.plant_id);
                  return <article key={task.id} className={`care-alert ${task.priority}`}><div className="alert-icon">{task.task_type === "water" ? <Droplets /> : <AlertTriangle />}</div><div><small>{task.status === "overdue" ? "Overdue" : dueText(task.due_at)}</small><b>{task.title}</b><p>{task.details}</p>{plant && <span>{plant.zone_name}</span>}<div><button onClick={() => completeTask(task.id)}><Check /> Done</button><button onClick={() => snoozeTask(task.id)}><Clock3 /> Tomorrow</button></div></div></article>;
                })}
              </div>
              <button className="all-care-button" onClick={() => setTab("care")}>View complete care plan</button>
            </aside>
          </div>

          <div className="environment-strip">
            {Object.entries(garden.environment).filter(([key]) => key !== "updated").map(([key, value]) => { const Icon = metricIcon(key); return <div key={key}><Icon /><span><small>{key.replaceAll("_", " ")}</small><b>{value}</b></span></div>; })}
            <small>Updated {garden.environment.updated}</small>
          </div>
        </div>
      )}

      {tab === "scan" && (
        <div className="garden-scan-layout">
          <article className="garden-panel scan-setup">
            <div className="panel-heading"><div><span>Garden dimensions</span><h2>Map the whole growing space</h2></div><Ruler /></div>
            <div className="dimension-grid">
              <label><span>Length</span><div><input type="number" min="0.1" step="0.1" value={garden.length_m} onChange={(event) => setGarden({ ...garden, length_m: event.target.value, area_m2: Math.round(event.target.value * garden.width_m * 10) / 10 })} /><b>m</b></div></label>
              <label><span>Width</span><div><input type="number" min="0.1" step="0.1" value={garden.width_m} onChange={(event) => setGarden({ ...garden, width_m: event.target.value, area_m2: Math.round(garden.length_m * event.target.value * 10) / 10 })} /><b>m</b></div></label>
              <label><span>Total area</span><div className="readonly-dimension"><b>{garden.area_m2}</b> m²</div></label>
              <label><span>Orientation</span><select value={garden.orientation} onChange={(event) => setGarden({ ...garden, orientation: event.target.value })}><option>East-facing</option><option>West-facing</option><option>North-facing</option><option>South-facing</option><option>Mixed exposure</option></select></label>
            </div>
            <div className="garden-context-grid">
              {["climate", "soil_type", "sunlight", "irrigation_method"].map((key) => <label key={key}><span>{key.replaceAll("_", " ")}</span><input value={garden[key]} onChange={(event) => setGarden({ ...garden, [key]: event.target.value })} /></label>)}
            </div>
          </article>

          <article className="garden-panel corner-capture">
            <div className="panel-heading"><div><span>Six-view coverage</span><h2>Photograph every corner</h2></div><b>{garden.photo_slots.filter((slot) => slot.captured).length}/6 ready</b></div>
            <p className="panel-copy">Stand near the centre when possible. Include soil, leaves, paths, containers, irrigation lines, and each boundary so BloomSense can compare zones over time.</p>
            <div className="corner-grid">
              {garden.photo_slots.map((slot) => <label className={`corner-slot ${slot.captured ? "captured" : ""}`} key={slot.corner}>
                {slot.image ? <img src={slot.image} alt={`${slot.label} garden view`} /> : <span className="corner-placeholder"><ImagePlus /><b>Add {slot.label.toLowerCase()}</b></span>}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => addCornerPhoto(slot.corner, event.target.files[0])} />
                <span className="corner-label">{slot.captured ? <CheckCircle2 /> : <Upload />}<b>{slot.label}</b><small>{slot.note}</small></span>
              </label>)}
            </div>
            <button className="button primary scan-garden-button" onClick={analyzeGarden} disabled={busy}>{busy ? <><span className="spinner" /> Analysing garden structure…</> : <><ScanLine /> Analyse the complete garden</>}</button>
          </article>

          <aside className="garden-panel scan-report">
            <div className="coverage-ring" style={{ "--coverage": `${garden.analysis.coverage_score * 3.6}deg` }}><div><b>{garden.analysis.coverage_score}%</b><span>coverage</span></div></div>
            <h3>Current analysis</h3>
            {garden.analysis.recommendations.map((item) => <p key={item}><Check /> {item}</p>)}
            <div className="scan-scope"><b>Analysis considers</b><span>Dimensions · photo coverage · zones · sunlight · soil · moisture · irrigation · plant positions · health records · scheduled care</span></div>
          </aside>
        </div>
      )}

      {tab === "health" && (
        <div className="health-workspace">
          <aside className="garden-panel plant-health-list">
            <div className="panel-heading"><div><span>Plant inventory</span><h2>{garden.plants.length} monitored plants</h2></div><HeartPulse /></div>
            {garden.plants.map((plant) => <button key={plant.id} className={selectedPlantId === plant.id ? "active" : ""} onClick={() => setSelectedPlantId(plant.id)}><img src={plant.hero_image} alt="" /><span><b>{plant.nickname}</b><small>{plant.common_name} · {plant.zone_name}</small></span><strong className={plant.health_status}>{plant.health_score}</strong></button>)}
            <button className="add-inventory" onClick={() => navigate("/discover")}><Plus /> Detect and add another plant</button>
          </aside>

          {selectedPlant && <article className="garden-panel health-detail">
            <div className="health-hero"><img src={selectedPlant.hero_image} alt={selectedPlant.common_name} /><div><span className={`health-state ${selectedPlant.health_status}`}><i /> {statusLabel[selectedPlant.health_status] || "Baseline needed"}</span><h2>{selectedPlant.nickname}</h2><i>{selectedPlant.scientific_name}</i><p>{selectedPlant.zone_name}</p></div><div className="health-score"><b>{selectedPlant.health_score || "—"}</b><span>health score</span></div></div>
            <div className="health-trend"><div><span>Last five checks</span><b>{selectedPlant.trend.at(-1) >= selectedPlant.trend.at(-2) ? "Stable or improving" : "Declining — inspect today"}</b></div><div className="mini-bars">{selectedPlant.trend.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value}%` }}><span>{value}</span></i>)}</div></div>
            <div className="health-signals"><h3>Visible signals</h3>{selectedPlant.signals.map((signal) => <p key={signal}><Check /> {signal}</p>)}</div>
            <div className="health-action"><AlertTriangle /><div><small>Recommended next action</small><b>{selectedPlant.action}</b><span>Visible-health screening is guidance, not a confirmed disease diagnosis.</span></div></div>
            <div className="health-controls">
              <label className="button ghost"><Camera /> {healthFile ? healthFile.name : "Add health photo"}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setHealthFile(event.target.files[0] || null)} /></label>
              <button className="button primary" disabled={busy || (!DEMO_MODE && !healthFile)} onClick={() => runHealthCheck(selectedPlant)}>{busy ? <span className="spinner" /> : <RefreshCcw />} Run health check</button>
              <button className="button ghost" onClick={() => markWatered(selectedPlant)}><Droplets /> Mark watered</button>
              <button className="button ghost" onClick={() => navigate(`/discover?sample=${selectedPlant.slug}`)}><Leaf /> Full plant profile</button>
            </div>
          </article>}
        </div>
      )}

      {tab === "care" && (
        <div className="care-workspace">
          <article className="garden-panel care-board">
            <div className="panel-heading"><div><span>Prioritised care plan</span><h2>Work across the whole garden</h2></div><b>{activeTasks.length} open</b></div>
            <div className="care-board-list">
              {garden.tasks.map((task) => {
                const plant = garden.plants.find((item) => item.id === task.plant_id);
                return <article key={task.id} className={`care-row ${task.status}`}><button className="task-check" onClick={() => task.status !== "completed" && completeTask(task.id)}>{task.status === "completed" && <Check />}</button><div><small>{task.task_type} · {task.status === "completed" ? "completed" : dueText(task.due_at)}</small><b>{task.title}</b><p>{task.details}</p><span>{plant ? `${plant.nickname} · ${plant.zone_name}` : "Whole garden"}</span></div><em className={task.priority}>{task.priority}</em>{task.status !== "completed" && <button className="snooze" onClick={() => snoozeTask(task.id)}>Move to tomorrow</button>}</article>;
              })}
            </div>
          </article>
          <aside className="garden-panel add-task-panel">
            <div className="panel-heading"><div><span>Custom work</span><h2>Add garden task</h2></div><Plus /></div>
            <form onSubmit={addTask}>
              <label><span>Task</span><input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Example: Add compost to east bed" /></label>
              <label><span>Plant or whole garden</span><select value={taskForm.plant_id} onChange={(event) => setTaskForm({ ...taskForm, plant_id: event.target.value })}><option value="">Whole garden</option>{garden.plants.map((plant) => <option value={plant.id} key={plant.id}>{plant.nickname} · {plant.common_name}</option>)}</select></label>
              <label><span>Priority</span><select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
              <label><span>Notes</span><textarea value={taskForm.details} onChange={(event) => setTaskForm({ ...taskForm, details: event.target.value })} placeholder="What should be checked or completed?" /></label>
              <button className="button primary"><BellRing /> Schedule for tomorrow</button>
            </form>
          </aside>
        </div>
      )}

      {tab === "progress" && (
        <div className="progress-workspace">
          <article className="garden-panel progress-summary">
            <div className="panel-heading"><div><span>Garden progress</span><h2>Health and care momentum</h2></div><Activity /></div>
            <div className="progress-score"><b>{averageHealth}</b><span>Average plant health</span><small>+6 points over the latest monitoring cycle</small></div>
            <div className="plant-progress-bars">{garden.plants.map((plant) => <div key={plant.id}><span><b>{plant.nickname}</b><small>{plant.health_score}%</small></span><i><em style={{ width: `${plant.health_score}%` }} /></i></div>)}</div>
            <div className="progress-metrics"><div><b>87%</b><span>Tasks completed on time</span></div><div><b>3</b><span>Health concerns resolved</span></div><div><b>14</b><span>Care actions this month</span></div></div>
          </article>
          <article className="garden-panel garden-timeline">
            <div className="panel-heading"><div><span>Longitudinal record</span><h2>What changed and why</h2></div><Clock3 /></div>
            {garden.timeline.map((event) => <div className="timeline-row" key={event.id}><i className={event.type}>{event.type === "water" ? <Droplets /> : event.type === "health" ? <HeartPulse /> : event.type === "scan" ? <ScanLine /> : <Leaf />}</i><div><b>{event.title}</b><p>{event.detail}</p><small>{new Date(event.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</small></div></div>)}
          </article>
        </div>
      )}
    </section>
  );
}
