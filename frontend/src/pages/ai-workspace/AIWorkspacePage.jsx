import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, FileImage, ImagePlus, Languages, Mic, MicOff, Search, ShieldCheck, Sparkles, Upload, WandSparkles, X } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import CameraCapture from "../../components/ai-workspace/CameraCapture";
import FlowerResult from "../../components/ai-workspace/FlowerResult";
import { LANGUAGES, localeFor } from "../../config/languages";
import { useVoice } from "../../hooks/useVoice";
import { DEMO_FLOWERS } from "../../data/demoData";
import { DEMO_MODE, flowerApi } from "../../services/auth/authService";

const BASE_TRANSLATION_KEYS = ["common_name", "description", "summary", "native_region", "bloom_season", "sunlight", "watering"];

function recognitionStatusLabel(status) {
  if (!status) return "Analysing petals…";
  if (status.stage === "downloading") return `Downloading visual model${Number.isFinite(status.percent) ? ` · ${status.percent}%` : "…"}`;
  if (status.stage === "checking") return "Checking for a visible flower…";
  if (status.stage === "classifying") return "Comparing 67 flower groups…";
  if (status.stage === "complete") return "Building the botanical profile…";
  return "Loading the visual model…";
}

function collectTranslatable(value, path = [], output = []) {
  if (typeof value === "string") {
    const joined = path.join(".");
    const excluded = joined.includes(".taxonomy.") || joined.endsWith(".url") || joined.endsWith("last_reviewed");
    if (!excluded && value.trim()) output.push({ path, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTranslatable(item, [...path, index], output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectTranslatable(item, [...path, key], output));
  }
  return output;
}

function setAtPath(target, path, value) {
  let cursor = target;
  path.slice(0, -1).forEach((part) => { cursor = cursor[part]; });
  cursor[path.at(-1)] = value;
}

export default function AIWorkspacePage() {
  const [params, setParams] = useSearchParams();
  const [method, setMethod] = useState("upload");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [translationNote, setTranslationNote] = useState("");
  const [recognitionStatus, setRecognitionStatus] = useState(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { listening, speaking, listen, stopListening, speak, stopSpeaking } = useVoice();

  const acceptFile = useCallback((nextFile) => {
    if (!nextFile) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(nextFile.type))) {
      setError("Choose a JPEG, PNG, or WebP flower image."); return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB."); return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile); setPreview(URL.createObjectURL(nextFile)); setError(""); setResult(null);
  }, [preview]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const showResult = useCallback((value) => {
    setResult(value); setOriginalResult(value); setLanguage(value.language || "en"); setTranslationNote(""); setError("");
    setTimeout(() => document.getElementById("flower-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const loadSample = useCallback(async (slug) => {
    setBusy(true); setError("");
    try { showResult(await flowerApi.sample(slug)); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }, [showResult]);

  useEffect(() => {
    const historyResult = location.state?.historyResult;
    if (historyResult) {
      showResult(historyResult);
      navigate("/discover", { replace: true, state: null });
      return;
    }
    const sample = params.get("sample");
    if (sample) {
      loadSample(sample);
      setParams({}, { replace: true });
    }
  }, [location.state, navigate, params, setParams, loadSample, showResult]);

  const identify = async () => {
    if (!file) return setError("Add a clear flower photo first.");
    setBusy(true); setError(""); setRecognitionStatus({ stage: "loading" });
    try {
      showResult(await flowerApi.identify(file, language, {
        imageUrl: preview,
        onProgress: setRecognitionStatus,
      }));
    }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); setRecognitionStatus(null); }
  };

  const searchFlower = async (spokenQuery = query) => {
    const value = spokenQuery.trim();
    if (value.length < 2) return setError("Say or enter a flower name.");
    setQuery(value); setBusy(true); setError("");
    try { showResult(await flowerApi.search(value, language)); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  };

  const startVoice = () => {
    setError("");
    listen(localeFor(language), (transcript) => searchFlower(transcript), setError);
  };

  const chooseAlternative = async (candidate) => {
    setBusy(true); setError("");
    try { showResult(await flowerApi.candidate(candidate, language, preview)); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  };

  const translate = async () => {
    if (!result || !originalResult) return;
    if (language === originalResult.language || language === "en") {
      setResult(originalResult); setTranslationNote(""); return;
    }
    setTranslating(true); setError("");
    try {
      const entries = [];
      BASE_TRANSLATION_KEYS.forEach((key) => {
        if (originalResult[key]) entries.push({ path: [key], value: originalResult[key] });
      });
      collectTranslatable(originalResult.uses || [], ["uses"], entries);
      collectTranslatable(originalResult.facts || [], ["facts"], entries);
      collectTranslatable(originalResult.deep_profile || {}, ["deep_profile"], entries);
      const translated = structuredClone(originalResult);
      let provider = "translation service";
      for (let start = 0; start < entries.length; start += 20) {
        const batch = entries.slice(start, start + 20);
        const response = await flowerApi.translate(batch.map((item) => item.value), language);
        provider = response.provider;
        response.translations.forEach((value, index) => setAtPath(translated, batch[index].path, value));
      }
      translated.translated_to = language;
      setResult(translated);
      setTranslationNote(DEMO_MODE ? provider : `Full profile translated by ${provider}. Scientific taxonomy remains unchanged.`);
    } catch (caught) { setError(caught.message); }
    finally { setTranslating(false); }
  };

  const handleSpeak = (text) => {
    if (!text) return stopSpeaking();
    speak(text, localeFor(language));
  };

  return (
    <div className="workspace-page container">
      {cameraOpen && <CameraCapture onCapture={acceptFile} onClose={() => setCameraOpen(false)} />}
      <header className="workspace-heading">
        <div><span className="eyebrow"><WandSparkles size={15} /> Multimodal flower intelligence</span><h1>What’s blooming?</h1><p>Start with a photograph, live camera, or spoken flower name.</p></div>
        <div className="workspace-security"><ShieldCheck /><span><b>Your discovery is private</b><small>Images are sent only for recognition and are not stored.</small></span></div>
      </header>

      {DEMO_MODE && <div className="demo-banner"><Sparkles /> Image modes now use an on-device visual model across 67 flower groups—never a forced Rose fallback. Low-separation matches ask for confirmation; the PlantNet-backed server provides broader species coverage.</div>}

      <section className="discovery-card">
        <div className="method-tabs">
          <button className={method === "upload" ? "active" : ""} onClick={() => setMethod("upload")}><Upload /> Upload photo</button>
          <button className={method === "camera" ? "active" : ""} onClick={() => setMethod("camera")}><Camera /> Live camera</button>
          <button className={method === "voice" ? "active" : ""} onClick={() => setMethod("voice")}><Mic /> Voice / name</button>
        </div>

        {method !== "voice" ? (
          <div className="upload-workspace">
            <div
              className={`drop-zone ${dragging ? "dragging" : ""} ${preview ? "has-image" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}
            >
              {preview ? (
                <><img src={preview} alt="Selected flower preview" /><button className="remove-image" onClick={() => { URL.revokeObjectURL(preview); setPreview(""); setFile(null); }}><X /></button><div className="image-ready"><CheckCircle2 /> Ready to analyse <small>{file?.name}</small></div></>
              ) : (
                <><span className="upload-icon"><ImagePlus /></span><h3>{method === "camera" ? "Capture a fresh flower photo" : "Drop a flower image here"}</h3><p>For the best match, use one clear flower in natural light.</p><div className="drop-actions"><button className="button small" onClick={() => method === "camera" ? setCameraOpen(true) : inputRef.current?.click()}>{method === "camera" ? <><Camera /> Open camera</> : <><FileImage /> Browse files</>}</button>{method === "camera" && <button className="button small ghost" onClick={() => inputRef.current?.click()}>Choose existing</button>}</div><small>JPEG, PNG, WebP · maximum 10 MB</small></>
              )}
              <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => acceptFile(event.target.files[0])} />
            </div>
            <div className="analyse-panel">
              <div><Languages /><span><b>Result language</b><small>You can translate again after recognition</small></span></div>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select>
              <button className="button primary analyse-button" onClick={identify} disabled={!file || busy}>{busy ? <><span className="spinner" /> {recognitionStatusLabel(recognitionStatus)}</> : <><Sparkles /> Identify this flower</>}</button>
              {DEMO_MODE && <small className="model-note">First use downloads the quantized visual model once; later scans use the browser cache.</small>}
            </div>
          </div>
        ) : (
          <div className="voice-workspace">
            <button className={`voice-orb ${listening ? "listening" : ""}`} onClick={listening ? stopListening : startVoice}>{listening ? <MicOff /> : <Mic />}<span className="voice-wave" /></button>
            <div><h3>{listening ? "I’m listening…" : "Say a flower name"}</h3><p>{listening ? "Try “sacred lotus” or “sunflower”." : "BloomSense will search its botanical profile in your chosen language."}</p></div>
            <form onSubmit={(event) => { event.preventDefault(); searchFlower(); }} className="voice-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Or type a common or scientific name" /><button className="button primary small" disabled={busy}>{busy ? <span className="spinner" /> : "Explore"}</button></form>
            <select className="voice-language" value={language} onChange={(event) => setLanguage(event.target.value)}>{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name} voice</option>)}</select>
          </div>
        )}

        {error && <div className="workspace-error">{error}</div>}
        <div className="sample-shortcuts"><span>Try a guided sample</span>{DEMO_FLOWERS.map((flower) => <button key={flower.slug} onClick={() => loadSample(flower.slug)}><img src={flower.images[0]} alt="" /> {flower.common_name}</button>)}</div>
      </section>

      {result && <div id="flower-result"><FlowerResult result={result} language={language} languages={LANGUAGES} translating={translating} translationNote={translationNote} onLanguage={setLanguage} onTranslate={translate} onSpeak={handleSpeak} onSelectAlternative={chooseAlternative} speaking={speaking} /></div>}
    </div>
  );
}
