import { apiFetch } from "../api/axiosClient";
import { catalogResult, demoResult, enrichDemoResult, DEMO_HISTORY, DEMO_FLOWERS } from "../../data/demoData";
import { findFlowerByName } from "../../data/flowerRecognitionCatalog";
import { createDemoGarden } from "../../data/gardenDemoData";
import { recognizeFlowerImage, recognitionModel } from "../recognition/browserFlowerRecognizer";

export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === "true";

const demoSession = (name = "Bloom Explorer") => ({
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 86400,
  token_type: "bearer",
  user: {
    id: "demo-user",
    name,
    email: "explorer@bloomsense.demo",
    provider: "demo",
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
});

export const authApi = {
  register: (name, email, password) =>
    DEMO_MODE
      ? Promise.resolve(demoSession(name))
      : apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    DEMO_MODE
      ? Promise.resolve(demoSession(email.split("@")[0] || "Bloom Explorer"))
      : apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  google: (credential) =>
    DEMO_MODE
      ? Promise.resolve(demoSession("Google Demo User"))
      : apiFetch("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  logout: (refreshToken) =>
    DEMO_MODE
      ? Promise.resolve()
      : apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }),
  demo: () => Promise.resolve(demoSession()),
};

export const flowerApi = {
  samples: () => DEMO_MODE ? Promise.resolve({ items: DEMO_FLOWERS }) : apiFetch("/flowers/samples"),
  sample: (slug) => DEMO_MODE ? Promise.resolve(demoResult(slug)) : apiFetch(`/flowers/samples/${slug}`),
  identify: async (file, language = "en", options = {}) => {
    if (DEMO_MODE) {
      const match = await recognizeFlowerImage(file, {
        imageUrl: options.imageUrl,
        onProgress: options.onProgress,
      });
      return enrichDemoResult(catalogResult(match.slug, {
        ...match,
        image_url: options.imageUrl,
        source: {
          recognition: `${recognitionModel.id} on-device visual ranking`,
          knowledge: "BloomSense catalogue and linked botanical authorities",
          mode: "browser",
        },
      }));
    }
    const form = new FormData();
    form.append("image", file);
    form.append("language", language);
    return apiFetch("/flowers/identify", { method: "POST", body: form });
  },
  search: async (query, language = "en") => {
    if (DEMO_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const match = findFlowerByName(query);
      if (!match) {
        throw new Error(`No browser-catalogue match was found for “${query}”. Try a common or scientific flower name, or connect the PlantNet-backed server for broader coverage.`);
      }
      return enrichDemoResult(catalogResult(match.slug, {
        confidence: 1,
        alternatives: [],
        source: {
          recognition: "exact voice/text catalogue match",
          knowledge: "BloomSense catalogue, Wikipedia, and linked botanical authorities",
          mode: "search",
        },
      }));
    }
    return apiFetch("/flowers/search", {
      method: "POST",
      body: JSON.stringify({ query, language }),
    });
  },
  candidate: async (candidate, language = "en", imageUrl = "") => {
    if (DEMO_MODE) {
      return enrichDemoResult(catalogResult(candidate.slug, {
        confidence: candidate.confidence,
        alternatives: [],
        image_url: imageUrl,
        source: {
          recognition: "user-confirmed browser model alternative",
          knowledge: "BloomSense catalogue, Wikipedia, and linked botanical authorities",
          mode: "browser",
        },
      }));
    }
    return apiFetch("/flowers/search", {
      method: "POST",
      body: JSON.stringify({ query: candidate.scientific_name || candidate.common_name, language }),
    });
  },
  translate: (texts, target) => {
    if (DEMO_MODE) {
      return Promise.resolve({ translations: texts, target, provider: "Demo mode — connect a translation key for live output" });
    }
    return apiFetch("/flowers/translate", {
      method: "POST",
      body: JSON.stringify({ texts, target, source: "auto" }),
    });
  },
  history: () => DEMO_MODE ? Promise.resolve({ items: DEMO_HISTORY }) : apiFetch("/users/me/history"),
};

export const gardenApi = {
  list: () => DEMO_MODE ? Promise.resolve({ items: [createDemoGarden()] }) : apiFetch("/gardens"),
  dashboard: (gardenId) => DEMO_MODE ? Promise.resolve(createDemoGarden()) : apiFetch(`/gardens/${gardenId}/dashboard`),
  create: (payload) => apiFetch("/gardens", { method: "POST", body: JSON.stringify(payload) }),
  update: (gardenId, payload) => apiFetch(`/gardens/${gardenId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  analyze: (gardenId, payload) => apiFetch(`/gardens/${gardenId}/analyze`, { method: "POST", body: JSON.stringify(payload) }),
  addPlant: (gardenId, payload) => apiFetch(`/gardens/${gardenId}/plants`, { method: "POST", body: JSON.stringify(payload) }),
  addPhoto: (gardenId, form) => apiFetch(`/gardens/${gardenId}/photos`, { method: "POST", body: form }),
  healthCheck: (gardenId, plantId, form) => apiFetch(`/gardens/${gardenId}/plants/${plantId}/health-checks`, { method: "POST", body: form }),
  water: (gardenId, plantId) => apiFetch(`/gardens/${gardenId}/plants/${plantId}/water`, { method: "POST" }),
  createTask: (gardenId, payload) => apiFetch(`/gardens/${gardenId}/tasks`, { method: "POST", body: JSON.stringify(payload) }),
  completeTask: (gardenId, taskId) => apiFetch(`/gardens/${gardenId}/tasks/${taskId}/complete`, { method: "POST" }),
  snoozeTask: (gardenId, taskId, days = 1) => apiFetch(`/gardens/${gardenId}/tasks/${taskId}/snooze?days=${days}`, { method: "POST" }),
};
