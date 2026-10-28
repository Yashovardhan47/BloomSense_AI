import {
  Activity, ArrowRight, BellRing, BrainCircuit, Camera, Check, ChevronRight,
  Flower2, Globe2, HeartPulse, Languages, Layers3, LockKeyhole, MapPinned,
  ScanLine, ShieldCheck, Sparkles, Sprout, Volume2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { DEMO_FLOWERS } from "../data/demoData";

const capabilities = [
  {
    icon: ScanLine,
    number: "01",
    title: "Identify what is blooming",
    text: "Camera, upload, and voice/text modes rank real visual candidates, show confidence, and expose alternatives instead of forcing one answer.",
    tag: "On-device visual model",
  },
  {
    icon: BrainCircuit,
    number: "02",
    title: "Understand the complete plant",
    text: "Open taxonomy, morphology, care, ecology, safety, culture, references, related images, and evidence notes in one deep profile.",
    tag: "Botanical knowledge",
  },
  {
    icon: MapPinned,
    number: "03",
    title: "Map the whole garden",
    text: "Record dimensions, orientation, soil, sunlight, irrigation, every corner image, growing zone, and each plant’s exact position.",
    tag: "Six-view garden scan",
  },
  {
    icon: HeartPulse,
    number: "04",
    title: "Monitor visible plant health",
    text: "Build a health baseline per plant, compare changes over time, surface stress signals, and preserve a clear inspection history.",
    tag: "Longitudinal health",
  },
  {
    icon: BellRing,
    number: "05",
    title: "Turn insight into garden work",
    text: "Prioritise watering, inspection, pruning, scanning, and custom tasks with reminders tied to individual plants and zones.",
    tag: "Actionable care plan",
  },
  {
    icon: Languages,
    number: "06",
    title: "Make knowledge accessible",
    text: "Translate the experience across language presets, listen with matching browser voices, and use speech for hands-free search.",
    tag: "Language + voice",
  },
];

const journey = [
  [Camera, "Capture", "Photograph a flower or scan every view of a garden."],
  [BrainCircuit, "Understand", "Compare visual evidence and open the full botanical context."],
  [Layers3, "Organise", "Place recognised plants into zones and establish health records."],
  [Activity, "Improve", "Complete care, monitor change, and build garden progress."],
];

export default function LandingPage() {
  const lotus = DEMO_FLOWERS.find((flower) => flower.slug === "lotus") || DEMO_FLOWERS[0];

  return (
    <div className="public-main">
      <section className="public-hero container">
        <div className="public-hero-copy reveal">
          <div className="eyebrow"><Sparkles size={15} /> The complete BloomSense perspective</div>
          <h1>Know one flower.<br /><span>Care for an entire garden.</span></h1>
          <p>BloomSense AI connects accurate flower discovery, deep plant knowledge, whole-garden mapping, visible-health monitoring, and daily care in one responsible botanical platform.</p>
          <div className="public-hero-actions">
            <Link className="button primary" to="/auth?mode=register">Create your account <ArrowRight size={18} /></Link>
            <a className="button ghost" href="#platform">Explore the platform <ChevronRight size={18} /></a>
          </div>
          <div className="public-proof">
            <span><ShieldCheck /> Confidence-aware identification</span>
            <span><Globe2 /> Multilingual knowledge</span>
            <span><LockKeyhole /> JWT + Google authentication</span>
          </div>
        </div>

        <div className="platform-preview reveal delay-one" aria-label="BloomSense platform preview">
          <div className="preview-topbar"><span><Flower2 /> BloomSense intelligence</span><em><i /> Garden live</em></div>
          <div className="preview-body">
            <div className="preview-garden">
              <div className="preview-garden-head"><span>Whole-garden pulse</span><b>82%</b></div>
              <div className="mini-garden-map">
                <span className="mini-zone zone-a">Morning sun</span>
                <span className="mini-zone zone-b">Bright shade</span>
                {DEMO_FLOWERS.slice(0, 4).map((flower, index) => (
                  <i className={`mini-plant plant-${index + 1}`} key={flower.slug}>
                    <img src={flower.images[0]} alt="" />
                  </i>
                ))}
                <small>12.5 × 8.2 m · 4 plants mapped</small>
              </div>
              <div className="preview-stats"><span><b>4</b> monitored</span><span><b>3</b> tasks today</span><span><b>67%</b> scan coverage</span></div>
            </div>
            <div className="preview-identification">
              <img src={lotus.images[0]} alt="Pink sacred lotus" />
              <span className="preview-confidence">96.3%</span>
              <div><small>VISUAL CANDIDATE</small><h3>{lotus.common_name}</h3><i>{lotus.scientific_name}</i><p>Profile, care, ecology, culture and references ready.</p></div>
            </div>
          </div>
          <div className="preview-alert"><BellRing /><span><small>Priority now</small><b>Check sunflower soil moisture</b></span><em>Overdue</em></div>
        </div>
      </section>

      <section className="perspective-strip">
        <div className="container">
          <span>One connected intelligence layer</span>
          <b>Discover</b><i /> <b>Understand</b><i /> <b>Map</b><i /> <b>Monitor</b><i /> <b>Care</b>
        </div>
      </section>

      <section className="section container public-platform" id="platform">
        <header className="public-section-heading">
          <div><span className="eyebrow">Platform overview</span><h2>Not just an identifier.<br />A living system for plants.</h2></div>
          <p>The public interface explains the complete project. Your personal home appears only after authentication and turns these capabilities into your own daily workspace.</p>
        </header>
        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, number, title, text, tag }) => (
            <article className="capability-card" key={number}>
              <div><span>{number}</span><Icon /></div>
              <h3>{title}</h3><p>{text}</p><small><Check /> {tag}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="section public-journey">
        <div className="container">
          <header className="public-section-heading compact">
            <div><span className="eyebrow">One continuous journey</span><h2>From first sight to better care</h2></div>
            <p>Each mode shares context, so identification is not the end of the experience—it becomes a useful garden record.</p>
          </header>
          <div className="journey-grid">
            {journey.map(([Icon, title, text], index) => (
              <article key={title}><span>{index + 1}</span><Icon /><h3>{title}</h3><p>{text}</p>{index < journey.length - 1 && <ChevronRight />}</article>
            ))}
          </div>
        </div>
      </section>

      <section className="section container garden-perspective">
        <div className="garden-perspective-visual">
          <div className="perspective-frame">
            <div className="frame-header"><span><MapPinned /> Garden digital perspective</span><b>6-view analysis</b></div>
            <div className="frame-photo-grid">
              {DEMO_FLOWERS.slice(0, 4).map((flower, index) => <img src={flower.images[index % flower.images.length]} alt="" key={flower.slug} />)}
              <span className="photo-missing">+ west view</span><span className="photo-missing">+ overhead</span>
            </div>
            <div className="frame-analysis"><span><i style={{ width: "67%" }} /></span><div><b>67% coverage</b><small>Dimensions, zones, light, soil, irrigation and plant positions analysed together.</small></div></div>
          </div>
        </div>
        <div className="garden-perspective-copy">
          <span className="eyebrow"><Sprout size={15} /> The garden is a managed space</span>
          <h2>Every corner becomes context. Every plant gets a record.</h2>
          <p>BloomSense models the user’s real garden—not a generic checklist. Measurements and images form the garden perspective; plants are mapped inside it; health checks and work are tracked over time.</p>
          <ul>
            <li><MapPinned /><span><b>Spatial understanding</b> Dimensions, corners, growing zones and conditions.</span></li>
            <li><HeartPulse /><span><b>Plant-by-plant health</b> Photos, visible signals, trends and next actions.</span></li>
            <li><BellRing /><span><b>Daily garden operations</b> Watering and other work ordered by urgency.</span></li>
          </ul>
          <Link className="text-link" to="/auth?mode=register">Build your personal garden <ArrowRight /></Link>
        </div>
      </section>

      <section className="section public-knowledge">
        <div className="container knowledge-layout">
          <div className="knowledge-copy">
            <span className="eyebrow"><Flower2 size={15} /> Beyond a flower name</span>
            <h2>A detected plant opens into a complete, explainable profile.</h2>
            <p>Results include what the image supports, what remains uncertain, and where to verify important information. The profile is designed for learning without inventing unsupported facts.</p>
            <div className="knowledge-tags"><span>Taxonomy</span><span>Morphology</span><span>Care</span><span>Health</span><span>Ecology</span><span>Safety</span><span>Culture</span><span>References</span></div>
            <div className="accessible-row"><span><Languages /> Translate</span><span><Volume2 /> Listen</span><span><ShieldCheck /> Verify</span></div>
          </div>
          <article className="knowledge-profile">
            <img src={lotus.images[0]} alt={lotus.common_name} />
            <div className="knowledge-profile-title"><span>{Math.round(lotus.confidence * 100)}% sample match</span><h3>{lotus.common_name}</h3><i>{lotus.scientific_name}</i></div>
            <div className="knowledge-facts"><span><small>FAMILY</small><b>{lotus.family}</b></span><span><small>NATIVE REGION</small><b>{lotus.native_region}</b></span><span><small>LIGHT</small><b>{lotus.sunlight}</b></span><span><small>PROFILE</small><b>8 evidence sections</b></span></div>
          </article>
        </div>
      </section>

      <section className="section container public-access">
        <div><LockKeyhole /><span><small>SECURE ACCESS</small><b>Email + rotating JWT sessions</b></span></div>
        <div><span className="google-letter">G</span><span><small>FASTER ENTRY</small><b>Verified Google authentication</b></span></div>
        <div><Globe2 /><span><small>INCLUSIVE EXPERIENCE</small><b>Language, voice and speech modes</b></span></div>
      </section>

      <section className="section container public-cta">
        <div><span className="eyebrow"><Sparkles size={15} /> The public tour ends here</span><h2>Your personal BloomSense home starts after sign-in.</h2><p>Open a private dashboard for garden priorities, health, recent discoveries, and progress—completely separate from this project overview.</p></div>
        <div><Link className="button light" to="/auth?mode=register">Create account <ArrowRight /></Link><Link className="button ghost" to="/auth">Sign in</Link></div>
      </section>
    </div>
  );
}
