import { FLOWER_RECOGNITION_CATALOG } from "../../data/flowerRecognitionCatalog";

const MODEL_ID = "Xenova/clip-vit-base-patch32";
const FLOWER_GATE = [
  "a clear photograph containing a visible flower in bloom",
  "a plant photograph showing leaves but no visible flower",
  "a photograph of something that is not a flower or plant",
];
const MIN_FLOWER_GATE_SCORE = 0.5;
const MIN_CATALOG_SCORE = 0.055;
const REVIEW_SCORE = 0.14;
const REVIEW_MARGIN = 0.022;

let classifierPromise;
let activeProgress = () => {};

function reportModelProgress(event) {
  if (!event) return;
  if (event.status === "progress") {
    activeProgress({ stage: "downloading", percent: Math.round(event.progress || 0), file: event.file });
  } else if (event.status === "ready") {
    activeProgress({ stage: "ready", percent: 100 });
  } else {
    activeProgress({ stage: "loading", percent: null, file: event.file });
  }
}

async function getClassifier(onProgress) {
  activeProgress = onProgress || (() => {});
  if (!classifierPromise) {
    classifierPromise = import("@huggingface/transformers")
      .then(({ env, pipeline }) => {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        return pipeline("zero-shot-image-classification", MODEL_ID, {
          dtype: "q8",
          progress_callback: reportModelProgress,
        });
      })
      .catch((error) => {
        classifierPromise = undefined;
        throw error;
      });
  }
  return classifierPromise;
}

const byPrompt = new Map(FLOWER_RECOGNITION_CATALOG.map((item) => [item.prompt, item]));

export function interpretPredictions(predictions, gatePredictions = FLOWER_GATE.map((label, index) => ({ label, score: index ? 0 : 1 }))) {
  const flowerGate = gatePredictions.find((item) => item.label === FLOWER_GATE[0]);
  const gateWinner = [...gatePredictions].sort((left, right) => right.score - left.score)[0];
  if (!flowerGate || gateWinner?.label !== FLOWER_GATE[0] || flowerGate.score < MIN_FLOWER_GATE_SCORE) {
    throw new Error("No clear flower was found. Fill most of the frame with one open bloom, use natural light, and try again.");
  }

  const flowerMatches = predictions
    .map((prediction) => ({ ...prediction, flower: byPrompt.get(prediction.label) }))
    .filter((prediction) => prediction.flower)
    .sort((left, right) => right.score - left.score);
  const top = flowerMatches[0];
  const runnerUp = flowerMatches[1];
  if (!top || top.score < MIN_CATALOG_SCORE) {
    throw new Error("The flower is visible, but the browser model could not make a reliable catalogue match. Try a sharper close-up or use the PlantNet-backed server.");
  }

  const margin = top.score - (runnerUp?.score || 0);
  const needsConfirmation = top.score < REVIEW_SCORE || margin < REVIEW_MARGIN;
  return {
    slug: top.flower.slug,
    confidence: Number(top.score.toFixed(4)),
    needs_confirmation: needsConfirmation,
    confidence_note: "Relative visual similarity across the browser catalogue, not a calibrated probability.",
    alternatives: flowerMatches.slice(1, 5).map((match) => ({
      slug: match.flower.slug,
      common_name: match.flower.common_name,
      scientific_name: match.flower.scientific_name,
      confidence: Number(match.score.toFixed(4)),
    })),
  };
}

export async function recognizeFlowerImage(file, { imageUrl, onProgress } = {}) {
  const createdUrl = !imageUrl;
  const source = imageUrl || URL.createObjectURL(file);
  onProgress?.({ stage: "loading", percent: null });

  try {
    const classifier = await getClassifier(onProgress);
    onProgress?.({ stage: "checking", percent: null });
    const gatePredictions = await classifier(source, FLOWER_GATE);
    onProgress?.({ stage: "classifying", percent: null });
    const predictions = await classifier(source, FLOWER_RECOGNITION_CATALOG.map((item) => item.prompt));
    onProgress?.({ stage: "complete", percent: 100 });
    return interpretPredictions(predictions, gatePredictions);
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("No clear flower") || error.message.startsWith("The flower is visible"))) {
      throw error;
    }
    throw new Error("The on-device recognition model could not load. Check the connection for the first model download, or use a guided sample and try again.");
  } finally {
    if (createdUrl) URL.revokeObjectURL(source);
  }
}

export const recognitionModel = {
  id: MODEL_ID,
  catalogueSize: FLOWER_RECOGNITION_CATALOG.length,
};
