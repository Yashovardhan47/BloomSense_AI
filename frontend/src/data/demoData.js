import { findFlowerBySlug } from "./flowerRecognitionCatalog";

const BASE_FLOWERS = [
  {
    slug: "rose",
    common_name: "Rose",
    scientific_name: "Rosa",
    family: "Rosaceae",
    genus: "Rosa",
    confidence: 0.982,
    description: "Flowering shrub · Rosaceae family",
    summary: "Roses are woody flowering plants celebrated for layered petals, fragrance, and extraordinary diversity. Their colours and forms come from centuries of cultivation across the world.",
    native_region: "Temperate regions of the Northern Hemisphere",
    bloom_season: "Spring through autumn",
    sunlight: "Six or more hours of direct sunlight",
    watering: "Water deeply when the top layer of soil begins to dry",
    uses: ["Ornamental gardens", "Perfumery", "Culinary rose water", "Pollinator habitat"],
    facts: ["Rose hips are naturally rich in vitamin C", "There are tens of thousands of cultivated varieties"],
    images: [
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=88",
      "https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=900&q=82",
    ],
  },
  {
    slug: "sunflower",
    common_name: "Sunflower",
    scientific_name: "Helianthus annuus",
    family: "Asteraceae",
    genus: "Helianthus",
    confidence: 0.971,
    description: "Annual flowering plant · Asteraceae family",
    summary: "The sunflower’s apparent bloom is a head containing hundreds of tiny florets. Young plants follow the sun, while mature flower heads generally settle facing east.",
    native_region: "North America",
    bloom_season: "Summer to early autumn",
    sunlight: "Full sun",
    watering: "Deep, moderate watering during establishment",
    uses: ["Edible seeds", "Cooking oil", "Pollinator habitat", "Ornamental planting"],
    facts: ["One head may contain more than one thousand florets", "Its genus name means sun flower"],
    images: [
      "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1400&q=88",
      "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=82",
    ],
  },
  {
    slug: "lotus",
    common_name: "Sacred lotus",
    scientific_name: "Nelumbo nucifera",
    family: "Nelumbonaceae",
    genus: "Nelumbo",
    confidence: 0.963,
    description: "Aquatic perennial · National flower of India",
    summary: "The sacred lotus rises above still water on strong stalks. Its highly water-repellent leaves inspired the scientific ‘lotus effect’ used in self-cleaning materials.",
    native_region: "Asia and northern Australia",
    bloom_season: "Warm summer months",
    sunlight: "Full sun above warm, still water",
    watering: "Grow submerged in a suitable aquatic container",
    uses: ["Water gardens", "Cultural ceremonies", "Edible rhizomes", "Traditional cuisine"],
    facts: ["Lotus seeds can remain viable for centuries", "It is India’s national flower"],
    images: [
      "https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?auto=format&fit=crop&w=1400&q=88",
      "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=900&q=82",
    ],
  },
  {
    slug: "orchid",
    common_name: "Moth orchid",
    scientific_name: "Phalaenopsis",
    family: "Orchidaceae",
    genus: "Phalaenopsis",
    confidence: 0.951,
    description: "Tropical epiphyte · Orchidaceae family",
    summary: "Moth orchids are elegant tropical epiphytes with long-lived flowers and thick aerial roots. They are among the most popular orchids grown indoors.",
    native_region: "South and Southeast Asia to northern Australia",
    bloom_season: "Often winter to spring indoors",
    sunlight: "Bright, indirect light",
    watering: "Water after aerial roots become silvery",
    uses: ["Indoor ornament", "Floral displays", "Hybrid breeding"],
    facts: ["Orchid seeds are dust-like", "Many orchids need fungal partners to germinate"],
    images: [
      "https://images.unsplash.com/photo-1566907225472-6f86d4ce7f3b?auto=format&fit=crop&w=1400&q=88",
      "https://images.unsplash.com/photo-1524598171353-ce84a157ed3c?auto=format&fit=crop&w=900&q=82",
    ],
  },
];

const PROFILE_DETAILS = {
  rose: {
    taxonomy: { kingdom: "Plantae", order: "Rosales", family: "Rosaceae", genus: "Rosa", species: "Rosa spp." },
    growth: { life_cycle: "Woody perennial", growth_habit: "Shrub, climber, or groundcover", mature_height: "0.3–6 m by cultivar", mature_spread: "0.3–4 m by cultivar", growth_rate: "Moderate to vigorous", hardiness: "Cultivar dependent; many suit temperate climates" },
    morphology: { leaves: "Alternate, usually pinnate leaves with serrated leaflets", flowers: "Five petals in wild species; many cultivars have densely layered petals", fruit: "Rose hips containing multiple achenes", roots: "Woody root system; grafted plants may have a distinct rootstock" },
    care: { soil: "Fertile, well-drained loam with organic matter", ph: "About 6.0–7.0", temperature: "Cultivar dependent; protect tender growth from extremes", humidity: "Good airflow reduces fungal pressure", fertilizer: "Feed during active growth according to a soil test", pruning: "Remove dead or diseased wood; time structural pruning to rose class", propagation: "Cuttings, layering, budding, grafting, or seed" },
    health: { common_pests: ["Aphids", "Spider mites", "Thrips", "Rose sawfly larvae"], common_diseases: ["Black spot", "Powdery mildew", "Rust", "Botrytis blight"], warning_signs: ["Black or yellowing leaves", "Distorted new growth", "White powdery coating", "Damaged buds"], prevention: ["Water at soil level", "Provide airflow", "Remove infected debris", "Prefer resistant cultivars"] },
    safety: { toxicity: "Generally non-toxic, but treatments and correct identification matter", pets: "Generally non-toxic; thorns can injure", humans: "Thorns can puncture skin; use gloves", edible: "Some unsprayed petals and hips are used as food; never consume chemically treated plants", allergy_note: "Fragrance or pollen can affect sensitive people" },
    ecology: { habitat: "Varied temperate habitats", pollinators: ["Bees", "Hoverflies", "Beetles"], wildlife_value: "Hips feed wildlife and dense shrubs provide shelter", invasiveness: "Some species spread aggressively; check locally", conservation: "Status varies across Rosa species" },
    culture: { symbolism: "Love, beauty, remembrance, and secrecy; meanings vary by colour and culture", etymology: "Rosa is the classical Latin name", history: "Cultivated for fragrance, ceremony, medicine, and ornament for millennia", traditional_uses: ["Perfumery", "Rose water", "Culinary flavouring", "Ceremonial decoration"] },
  },
  sunflower: {
    taxonomy: { kingdom: "Plantae", order: "Asterales", family: "Asteraceae", genus: "Helianthus", species: "Helianthus annuus" },
    growth: { life_cycle: "Annual", growth_habit: "Erect herb", mature_height: "About 0.5–4 m by cultivar", mature_spread: "About 0.3–1 m", growth_rate: "Fast", hardiness: "Warm-season annual; frost sensitive" },
    morphology: { leaves: "Coarse, broad leaves that become alternate higher on the stem", flowers: "Composite head containing ray and disc florets", fruit: "Single-seeded cypsela commonly called a sunflower seed", roots: "Strong taproot with spreading lateral roots" },
    care: { soil: "Well-drained soil with moderate fertility", ph: "Roughly 6.0–7.5", temperature: "Warm conditions after frost", humidity: "Average outdoor humidity with airflow", fertilizer: "Avoid excess nitrogen that produces weak stems", pruning: "Usually unnecessary; support very tall cultivars", propagation: "Direct sow seed after frost risk" },
    health: { common_pests: ["Aphids", "Sunflower moth", "Seed-feeding birds"], common_diseases: ["Downy mildew", "Rust", "Sclerotinia stem rot"], warning_signs: ["Stem lesions", "Leaf spotting", "Sudden wilt", "Damaged flower heads"], prevention: ["Rotate crops", "Avoid waterlogging", "Space for airflow", "Remove infected material"] },
    safety: { toxicity: "Generally non-toxic", pets: "Generally considered non-toxic to cats and dogs", humans: "Seeds are a common food; allergy is possible", edible: "Seeds and oil are edible from correctly identified food-safe plants", allergy_note: "Seed and pollen allergy can occur" },
    ecology: { habitat: "Sunny cultivated and disturbed ground", pollinators: ["Native bees", "Honey bees", "Butterflies"], wildlife_value: "Seeds feed birds and small mammals", invasiveness: "May self-seed; regional behaviour varies", conservation: "Common cultivated species" },
    culture: { symbolism: "Warmth, loyalty, optimism, and admiration", etymology: "Helianthus combines Greek roots for sun and flower", history: "Domesticated in North America and later distributed globally", traditional_uses: ["Food seed", "Oil", "Dye", "Ornamental planting"] },
  },
  lotus: {
    taxonomy: { kingdom: "Plantae", order: "Proteales", family: "Nelumbonaceae", genus: "Nelumbo", species: "Nelumbo nucifera" },
    growth: { life_cycle: "Aquatic perennial", growth_habit: "Rhizomatous emergent aquatic", mature_height: "Leaves and flowers often rise 1–1.5 m above water", mature_spread: "Spreads through rhizomes", growth_rate: "Vigorous in warm water", hardiness: "Rhizomes need climate-appropriate winter protection" },
    morphology: { leaves: "Large circular peltate leaves with water-repellent surfaces", flowers: "Large multi-petalled blooms held above water", fruit: "Flat-topped receptacle containing nut-like seeds", roots: "Edible rhizomes anchored in heavy aquatic soil" },
    care: { soil: "Heavy loam or aquatic planting media", ph: "Neutral to mildly acidic or alkaline", temperature: "Warm water and a long frost-free season", humidity: "Aquatic environment", fertilizer: "Use aquatic fertilizer after established growth", pruning: "Remove yellow leaves above water level", propagation: "Rhizome division or seed" },
    health: { common_pests: ["Aphids", "Spider mites", "Leaf-mining insects"], common_diseases: ["Rhizome rot", "Leaf spot"], warning_signs: ["Soft dark rhizomes", "Failure to emerge", "Rapid leaf collapse", "Spreading spots"], prevention: ["Use clean stock", "Maintain warm sunlit water", "Avoid damaged rhizomes", "Remove decay"] },
    safety: { toxicity: "Food use is established, but water contamination and identification matter", pets: "Avoid unsupervised consumption", humans: "Consume only correctly identified, clean, food-grown parts", edible: "Rhizomes and seeds are used in several cuisines", allergy_note: "Food sensitivity is possible" },
    ecology: { habitat: "Shallow still or slow-moving freshwater", pollinators: ["Beetles", "Bees"], wildlife_value: "Adds aquatic structure and food resources", invasiveness: "Rhizomes can spread strongly outside containers", conservation: "Widely cultivated; local status varies" },
    culture: { symbolism: "Purity, renewal, resilience, and spiritual awakening", etymology: "Nucifera means nut-bearing", history: "Central to South and East Asian religion, art, cuisine, and material culture", traditional_uses: ["Ceremonial use", "Food", "Water gardens", "Traditional medicine"] },
  },
  orchid: {
    taxonomy: { kingdom: "Plantae", order: "Asparagales", family: "Orchidaceae", genus: "Phalaenopsis", species: "Phalaenopsis spp." },
    growth: { life_cycle: "Perennial", growth_habit: "Mostly epiphytic herb", mature_height: "20–90 cm including flower spikes", mature_spread: "About 20–60 cm", growth_rate: "Slow to moderate", hardiness: "Tropical; protect from cold" },
    morphology: { leaves: "Thick leathery leaves in a basal rosette", flowers: "Bilateral moth-like flowers on arching spikes", fruit: "Capsule with numerous dust-like seeds", roots: "Photosynthetic aerial roots with spongy velamen" },
    care: { soil: "Airy orchid bark or species-appropriate epiphytic medium", ph: "Slightly acidic conditions are often preferred", temperature: "Warm indoor range with gentle day-night variation", humidity: "Moderate humidity with airflow", fertilizer: "Dilute balanced orchid feed during active growth", pruning: "Remove dead roots and spent spikes according to condition", propagation: "Keiki division, specialist seed culture, or tissue culture" },
    health: { common_pests: ["Mealybugs", "Scale insects", "Spider mites"], common_diseases: ["Root rot", "Bacterial soft rot", "Fungal leaf spots"], warning_signs: ["Mushy roots", "Wrinkled leaves", "Sticky pests", "Wet spreading lesions"], prevention: ["Keep water out of the crown", "Use draining media", "Sterilise tools", "Quarantine new plants"] },
    safety: { toxicity: "Phalaenopsis is generally regarded as non-toxic", pets: "Generally listed as non-toxic to cats and dogs", humans: "Not intended as food", edible: "Do not consume decorative orchids", allergy_note: "Sap or potting media may irritate sensitive skin" },
    ecology: { habitat: "Humid tropical forests, often growing on trees without parasitising them", pollinators: ["Species-specific moths", "Bees", "Other insects"], wildlife_value: "Part of diverse forest epiphyte communities", invasiveness: "Not usually invasive as a houseplant", conservation: "Wild orchids can be threatened; buy legally propagated plants" },
    culture: { symbolism: "Elegance, refinement, affection, and luxury", etymology: "Phalaenopsis refers to a moth-like appearance", history: "Global horticulture has produced many long-flowering hybrids", traditional_uses: ["Indoor ornament", "Floral display", "Breeding", "Conservation collections"] },
  },
};

const referenceLinks = (flower) => {
  const query = encodeURIComponent(flower.scientific_name);
  return [
    { label: "Kew Plants of the World Online", scope: "Accepted names, taxonomy, and distribution", url: `https://powo.science.kew.org/results?q=${query}` },
    { label: "GBIF", scope: "Biodiversity records and global occurrence data", url: `https://www.gbif.org/species/search?q=${query}` },
    { label: "iNaturalist", scope: "Community observations and identification context", url: `https://www.inaturalist.org/taxa/search?q=${query}` },
    { label: "Wikimedia Commons", scope: "Reference imagery and individual licences", url: `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image` },
  ];
};

export const DEMO_FLOWERS = BASE_FLOWERS.map((flower) => ({
  ...flower,
  deep_profile: {
    ...PROFILE_DETAILS[flower.slug],
    references: referenceLinks(flower),
    last_reviewed: "2026-10-07",
    data_note: "BloomSense combines recognition, curated horticultural guidance, and linked biodiversity references. Verify scientific names, toxicity, edibility, and treatment decisions with the cited authority or a local specialist.",
  },
}));

export const DEMO_HISTORY = DEMO_FLOWERS.slice(0, 3).map((flower, index) => ({
  id: `demo-${flower.slug}`,
  common_name: flower.common_name,
  scientific_name: flower.scientific_name,
  confidence: flower.confidence,
  language: "en",
  hero_image: flower.images[0],
  created_at: new Date(Date.now() - index * 86400000).toISOString(),
  result: flower,
}));

const genericProfile = (flower) => ({
  taxonomy: {
    kingdom: "Plantae",
    family: flower.family,
    genus: flower.scientific_name.split(" ")[0],
    species: flower.scientific_name,
  },
  growth: {
    life_cycle: "Confirm for the identified species or cultivar",
    growth_habit: "Varies within this botanical group",
    mature_height: "Use a species-level authority before planting",
    mature_spread: "Use a species-level authority before planting",
    growth_rate: "Climate and cultivar dependent",
    hardiness: "Check a regional horticultural source",
  },
  morphology: {
    leaves: "Compare leaf arrangement, margins, venation, and surface with an identification key",
    flowers: "Confirm petal or tepal count, symmetry, reproductive structures, and inflorescence",
    fruit: "Fruit and seed characters can separate visually similar species",
    roots: "Root form cannot be established safely from a flower photograph alone",
  },
  care: {
    soil: "Confirm species and local soil requirements before changing care",
    ph: "Species specific",
    temperature: "Species and cultivar specific",
    humidity: "Provide airflow and confirm species needs",
    fertilizer: "Avoid treating from an image match alone; use a soil test and species guidance",
    pruning: "Confirm growth habit and flowering cycle before pruning",
    propagation: "Consult the linked botanical and horticultural references",
  },
  health: {
    common_pests: ["Inspect stems, leaf undersides, buds, and roots before diagnosing"],
    common_diseases: ["Symptoms can overlap across fungal, bacterial, viral, and environmental stress"],
    warning_signs: ["Rapid wilt", "Spreading lesions", "Root collapse", "Severe pest activity"],
    prevention: ["Use clean tools", "Avoid overwatering", "Provide suitable airflow", "Quarantine affected plants"],
  },
  safety: {
    toxicity: "Unknown until the exact species is independently confirmed",
    pets: "Keep away from pets until species-level toxicity is checked",
    humans: "Wear gloves and avoid sap or pollen if sensitivity is possible",
    edible: "Never consume a plant based on image recognition",
    allergy_note: "Pollen, fragrance, sap, and contact reactions vary",
  },
  ecology: {
    habitat: "See the linked distribution records for this botanical group",
    pollinators: ["Pollinator relationships vary by species and region"],
    wildlife_value: "Confirm with a local native-plant or biodiversity authority",
    invasiveness: "Check the current regional invasive-species list",
    conservation: "Use accepted-name and occurrence sources for current status",
  },
  culture: {
    symbolism: "Meanings differ across species, places, and traditions",
    etymology: `Search the accepted name ${flower.scientific_name} in the linked references`,
    history: "The linked sources provide a starting point for independently verified research",
    traditional_uses: ["Do not infer medicinal or edible use from a visual match"],
  },
  references: referenceLinks(flower),
  last_reviewed: "2026-10-08",
  data_note: "This browser result is a visual candidate, not a definitive species determination. BloomSense deliberately avoids inventing species-specific facts when the photograph cannot support them; use the linked botanical authorities to verify the accepted name, distribution, safety, and care.",
});

function baseCatalogResult(flower, options = {}) {
  const sample = DEMO_FLOWERS.find((item) => item.slug === flower.slug);
  const images = [options.image_url, ...(sample?.images || [])].filter(Boolean);
  const uniqueImages = [...new Set(images)];
  const alternatives = options.alternatives ?? (sample
    ? DEMO_FLOWERS.filter((item) => item.slug !== flower.slug)
      .slice(0, 3)
      .map(({ slug, common_name, scientific_name, confidence }) => ({ slug, common_name, scientific_name, confidence: Math.max(confidence - 0.12, 0) }))
    : []);

  return {
    ...(sample || {
      ...flower,
      genus: flower.scientific_name.split(" ")[0],
      description: `Visual candidate · ${flower.family} family`,
      summary: `The photograph most closely matches ${flower.common_name} (${flower.scientific_name}) among the flower groups checked by the browser model. Confirm diagnostic structures and the accepted scientific name before relying on this identification.`,
      native_region: "Open the linked biodiversity records for verified distribution",
      bloom_season: "Varies by species, cultivar, and climate",
      sunlight: "Confirm after species-level identification",
      watering: "Confirm after species-level identification",
      uses: ["Botanical identification", "Garden record keeping", "Further reference research"],
      facts: ["A single flower photograph may not show the structures needed for species-level identification"],
      images: uniqueImages,
      deep_profile: genericProfile(flower),
    }),
    id: `sample-${flower.slug}`,
    confidence: options.confidence ?? sample?.confidence ?? 0,
    alternatives,
    images: uniqueImages.length ? uniqueImages : sample?.images || [],
    language: "en",
    needs_confirmation: Boolean(options.needs_confirmation),
    confidence_note: options.confidence_note,
    source: options.source || { recognition: "interactive demo", knowledge: "curated BloomSense catalogue with linked authorities", mode: "demo" },
  };
}

export const demoResult = (slug) => {
  const flower = DEMO_FLOWERS.find((item) => item.slug === slug);
  if (!flower) throw new Error(`No guided sample exists for “${slug || "that flower"}”.`);
  return baseCatalogResult(flower);
};

export const catalogResult = (slug, options = {}) => {
  const flower = findFlowerBySlug(slug);
  if (!flower) throw new Error("The visual model returned a flower outside the supported browser catalogue.");
  return baseCatalogResult(flower, options);
};

export async function enrichDemoResult(result) {
  const term = encodeURIComponent(result.scientific_name);
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${term}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return result;
    const article = await response.json();
    const thumbnail = article.originalimage?.source || article.thumbnail?.source;
    return {
      ...result,
      description: article.description || result.description,
      summary: article.extract || result.summary,
      article_url: article.content_urls?.desktop?.page || result.article_url,
      images: [...new Set([...result.images, thumbnail].filter(Boolean))],
      source: {
        ...result.source,
        knowledge: article.extract ? "BloomSense safeguards, Wikipedia, and linked botanical authorities" : result.source?.knowledge,
      },
    };
  } catch {
    return result;
  }
}
