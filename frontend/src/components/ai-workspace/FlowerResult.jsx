import { useState } from "react";
import {
  BookOpen, Bug, ExternalLink, Globe2, Headphones, HeartPulse, Image as ImageIcon,
  Landmark, Leaf, Library, Microscope, Pause, ShieldAlert, Sparkles, Sprout, Sun,
  Trees, Volume2, Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const tabs = [
  ["story", BookOpen, "Overview"],
  ["care", Sprout, "Care"],
  ["botany", Microscope, "Botany"],
  ["health", HeartPulse, "Health & safety"],
  ["ecology", Trees, "Ecology"],
  ["culture", Landmark, "Uses & culture"],
  ["gallery", ImageIcon, "Gallery"],
  ["sources", Library, "Sources"],
];

const title = (value) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function DataGrid({ values = {} }) {
  return <div className="deep-data-grid">{Object.entries(values).map(([key, value]) => <div key={key}><span>{title(key)}</span><b>{Array.isArray(value) ? value.join(" · ") : value || "Not available"}</b></div>)}</div>;
}

function KnowledgeLists({ sections }) {
  return <div className="knowledge-columns">{sections.map(([heading, Icon, values]) => <article key={heading}><h3><Icon /> {heading}</h3>{(Array.isArray(values) ? values : [values]).filter(Boolean).map((value) => <p key={value}>{value}</p>)}</article>)}</div>;
}

export default function FlowerResult({ result, language, languages, translating, translationNote, onLanguage, onTranslate, onSpeak, onSelectAlternative, speaking }) {
  const [tab, setTab] = useState("story");
  const navigate = useNavigate();
  const confidence = Math.round((result.confidence || 0) * 1000) / 10;
  const images = result.images || [];
  const deep = result.deep_profile || {};
  const mode = result.source?.mode;
  const sourceLabel = mode === "live" ? "Live recognition" : mode === "browser" ? "On-device visual AI" : mode === "search" ? "Voice / name search" : "Interactive sample";
  const scoreLabel = mode === "search" ? "Exact name match" : mode === "browser" ? `${confidence}% visual match` : `${confidence}% confidence`;
  const showAlternatives = ["browser", "live"].includes(mode) && result.alternatives?.length > 0;

  const addToGarden = () => {
    navigate("/garden", {
      state: {
        addPlant: {
          nickname: result.common_name,
          common_name: result.common_name,
          scientific_name: result.scientific_name,
          slug: result.slug || result.common_name.toLowerCase().split(" ")[0],
          hero_image: images[0] || null,
        },
      },
    });
  };

  return (
    <section className="result-card reveal">
      <div className="result-hero">
        <div className="result-image">
          {images[0] ? <img src={images[0]} alt={result.common_name} /> : <div className="image-fallback"><Leaf /></div>}
          <span className={`source-pill ${["live", "browser"].includes(mode) ? "live" : ""}`}><Sparkles size={13} /> {sourceLabel}</span>
        </div>
        <div className="result-intro">
          <div className="result-topline"><span>{result.family}</span><span className="confidence-badge">{scoreLabel}</span></div>
          <h2>{result.common_name}</h2>
          <i>{result.scientific_name}</i>
          <p>{result.description}</p>
          <div className="result-actions">
            <button className="button small" onClick={() => speaking ? onSpeak("") : onSpeak(`${result.common_name}. ${result.summary}`)}>{speaking ? <><Pause /> Stop</> : <><Volume2 /> Listen</>}</button>
            <button className="button small primary" onClick={addToGarden}><Sprout /> Add to My Garden</button>
            {result.article_url && <a className="button small ghost" href={result.article_url} target="_blank" rel="noreferrer"><ExternalLink /> Source article</a>}
          </div>
        </div>
      </div>

      {result.needs_confirmation && <div className="match-review-banner"><ShieldAlert /><div><b>This visual match needs confirmation</b><span>The top candidates are close. Compare the alternatives and visible flower structures before saving the identity.</span></div></div>}
      {showAlternatives && <div className="candidate-strip"><div><b>Other likely matches</b><span>{result.confidence_note || "Recognition is probabilistic; choose an alternative if it fits the photograph better."}</span></div><div className="candidate-options">{result.alternatives.map((candidate) => <button type="button" key={`${candidate.slug || candidate.scientific_name}-${candidate.confidence}`} onClick={() => onSelectAlternative?.(candidate)}><span>{candidate.common_name}</span><i>{candidate.scientific_name}</i><small>{Math.round((candidate.confidence || 0) * 1000) / 10}% visual match</small></button>)}</div></div>}

      <div className="language-bar">
        <div><Globe2 /><span><b>Experience the complete profile in your language</b><small>Translation and voice use the same locale</small></span></div>
        <select value={language} onChange={(event) => onLanguage(event.target.value)}>{languages.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
        <button className="button small primary" onClick={onTranslate} disabled={translating || language === result.language}>{translating ? <span className="spinner" /> : "Translate full profile"}</button>
      </div>
      {translationNote && <div className="translation-note">{translationNote}</div>}

      <div className="result-tabs deep-tabs" role="tablist">
        {tabs.map(([key, Icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)} title={label}><Icon /> <span>{label}</span></button>)}
      </div>

      <div className="result-body deep-result-body">
        {tab === "story" && <div className="story-panel"><p className="lead-story">{result.summary || "No extended description is available yet."}</p><div className="facts-grid"><div><span>Native region</span><b>{result.native_region}</b></div><div><span>Bloom season</span><b>{result.bloom_season}</b></div></div>{result.facts?.length > 0 && <div className="fact-list"><h3><Sparkles /> Did you know?</h3>{result.facts.map((fact) => <p key={fact}>{fact}</p>)}</div>}<div className="profile-depth-note"><Library /><div><b>A layered evidence profile</b><span>Explore care, morphology, health risks, ecology, cultural context, safety, reference images, and independent authority links.</span></div></div></div>}

        {tab === "care" && <div className="deep-section"><div className="care-grid"><article><Sun /><span>Sunlight</span><p>{result.sunlight}</p></article><article><Waves /><span>Water</span><p>{result.watering}</p></article><article><Sprout /><span>Blooming</span><p>{result.bloom_season}</p></article><article><Leaf /><span>Useful for</span><p>{result.uses?.join(" · ") || "See species references."}</p></article></div><h3 className="section-label">Complete growing conditions</h3><DataGrid values={deep.care} /><h3 className="section-label">Growth behaviour</h3><DataGrid values={deep.growth} /></div>}

        {tab === "botany" && <div className="deep-section"><h3 className="section-label">Taxonomic identity</h3><DataGrid values={deep.taxonomy || { family: result.family, genus: result.genus, species: result.scientific_name }} /><h3 className="section-label">Visible morphology</h3><DataGrid values={deep.morphology} /><div className="science-source"><Microscope /><span><b>Identification remains probabilistic</b><small>Confirm distinguishing structures and the accepted scientific name before research, treatment, consumption, or conservation decisions.</small></span></div></div>}

        {tab === "health" && <div className="deep-section"><KnowledgeLists sections={[["Common pests", Bug, deep.health?.common_pests], ["Common diseases", HeartPulse, deep.health?.common_diseases], ["Warning signs", ShieldAlert, deep.health?.warning_signs], ["Prevention", Leaf, deep.health?.prevention]]} /><h3 className="section-label">Human and animal safety</h3><DataGrid values={deep.safety} /><div className="safety-banner"><ShieldAlert /><p><b>Safety boundary</b> Never eat, medicate with, or treat a plant based only on image recognition. Verify the species and use local professional guidance for serious or rapidly spreading symptoms.</p></div></div>}

        {tab === "ecology" && <div className="deep-section"><DataGrid values={deep.ecology} /><div className="profile-depth-note"><Trees /><div><b>Local context matters</b><span>Pollinator value, invasiveness, hardiness, and conservation status can change by region. Use the linked biodiversity sources and local authority guidance.</span></div></div></div>}

        {tab === "culture" && <div className="deep-section"><DataGrid values={deep.culture} />{result.uses?.length > 0 && <div className="fact-list"><h3><Landmark /> Documented use areas</h3>{result.uses.map((value) => <p key={value}>{value}</p>)}</div>}</div>}

        {tab === "gallery" && <div className="gallery-grid">{images.length ? images.map((image, index) => <a href={image} target="_blank" rel="noreferrer" key={image}><img src={image} alt={`${result.common_name} reference ${index + 1}`} /></a>) : <div className="empty-inline">No related images were returned.</div>}</div>}

        {tab === "sources" && <div className="sources-panel"><div className="source-method"><Library /><div><h3>Where this profile comes from</h3><p>{deep.data_note || "Recognition is combined with botanical knowledge sources. Verify critical details against an independent authority."}</p><small>Profile reviewed {deep.last_reviewed || "when generated"} · Recognition: {result.source?.recognition} · Knowledge: {result.source?.knowledge}</small></div></div><div className="source-links">{(deep.references || []).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span><b>{source.label}</b><small>{source.scope}</small></span><ExternalLink /></a>)}</div></div>}
      </div>
      <div className="result-footnote"><Headphones /> Voice quality and availability depend on voices installed in your browser or operating system. Health and safety information is educational guidance.</div>
    </section>
  );
}
