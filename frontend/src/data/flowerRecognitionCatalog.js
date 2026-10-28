const flower = (slug, common_name, scientific_name, family, aliases = []) => ({
  slug,
  common_name,
  scientific_name,
  family,
  aliases,
  prompt: `a clear close-up photograph of a ${common_name.toLowerCase()} flower in bloom`,
});

// Broad, human-readable classes for the offline browser model. PlantNet remains the
// production recognizer for species-level coverage; these classes keep the public
// static demo useful without shipping an API secret to the browser.
export const FLOWER_RECOGNITION_CATALOG = [
  flower("rose", "Rose", "Rosa", "Rosaceae", ["roses"]),
  flower("sunflower", "Sunflower", "Helianthus annuus", "Asteraceae", ["sun flower"]),
  flower("lotus", "Sacred lotus", "Nelumbo nucifera", "Nelumbonaceae", ["lotus flower", "indian lotus"]),
  flower("orchid", "Moth orchid", "Phalaenopsis", "Orchidaceae", ["orchid", "phalaenopsis orchid"]),
  flower("tulip", "Tulip", "Tulipa", "Liliaceae"),
  flower("hibiscus", "Hibiscus", "Hibiscus rosa-sinensis", "Malvaceae", ["china rose", "shoe flower"]),
  flower("marigold", "Marigold", "Tagetes", "Asteraceae", ["tagetes"]),
  flower("jasmine", "Jasmine", "Jasminum", "Oleaceae", ["jessamine"]),
  flower("daisy", "English daisy", "Bellis perennis", "Asteraceae", ["daisy"]),
  flower("lily", "True lily", "Lilium", "Liliaceae", ["lily"]),
  flower("lavender", "Lavender", "Lavandula", "Lamiaceae"),
  flower("dahlia", "Dahlia", "Dahlia", "Asteraceae"),
  flower("chrysanthemum", "Chrysanthemum", "Chrysanthemum", "Asteraceae", ["mum", "mums"]),
  flower("daffodil", "Daffodil", "Narcissus pseudonarcissus", "Amaryllidaceae", ["narcissus"]),
  flower("peony", "Peony", "Paeonia", "Paeoniaceae"),
  flower("carnation", "Carnation", "Dianthus caryophyllus", "Caryophyllaceae"),
  flower("bougainvillea", "Bougainvillea", "Bougainvillea", "Nyctaginaceae", ["paper flower"]),
  flower("zinnia", "Zinnia", "Zinnia elegans", "Asteraceae"),
  flower("petunia", "Petunia", "Petunia", "Solanaceae"),
  flower("geranium", "Garden geranium", "Pelargonium × hortorum", "Geraniaceae", ["pelargonium", "geranium"]),
  flower("iris", "Bearded iris", "Iris germanica", "Iridaceae", ["iris"]),
  flower("magnolia", "Magnolia", "Magnolia", "Magnoliaceae"),
  flower("hydrangea", "Hydrangea", "Hydrangea macrophylla", "Hydrangeaceae"),
  flower("poppy", "Corn poppy", "Papaver rhoeas", "Papaveraceae", ["poppy", "red poppy"]),
  flower("dandelion", "Dandelion", "Taraxacum officinale", "Asteraceae"),
  flower("poinsettia", "Poinsettia", "Euphorbia pulcherrima", "Euphorbiaceae", ["christmas star"]),
  flower("anthurium", "Anthurium", "Anthurium andraeanum", "Araceae", ["flamingo flower"]),
  flower("bird-of-paradise", "Bird of paradise", "Strelitzia reginae", "Strelitziaceae", ["strelitzia"]),
  flower("camellia", "Camellia", "Camellia japonica", "Theaceae"),
  flower("azalea", "Azalea", "Rhododendron", "Ericaceae"),
  flower("bluebell", "English bluebell", "Hyacinthoides non-scripta", "Asparagaceae", ["bluebell"]),
  flower("water-lily", "Water lily", "Nymphaea", "Nymphaeaceae", ["waterlily"]),
  flower("morning-glory", "Morning glory", "Ipomoea purpurea", "Convolvulaceae"),
  flower("passion-flower", "Passion flower", "Passiflora caerulea", "Passifloraceae", ["passionflower"]),
  flower("foxglove", "Foxglove", "Digitalis purpurea", "Plantaginaceae"),
  flower("snapdragon", "Snapdragon", "Antirrhinum majus", "Plantaginaceae"),
  flower("crocus", "Crocus", "Crocus", "Iridaceae"),
  flower("buttercup", "Buttercup", "Ranunculus", "Ranunculaceae"),
  flower("black-eyed-susan", "Black-eyed Susan", "Rudbeckia hirta", "Asteraceae"),
  flower("california-poppy", "California poppy", "Eschscholzia californica", "Papaveraceae"),
  flower("forget-me-not", "Forget-me-not", "Myosotis", "Boraginaceae", ["forget me not"]),
  flower("coneflower", "Purple coneflower", "Echinacea purpurea", "Asteraceae", ["echinacea", "coneflower"]),
  flower("gardenia", "Gardenia", "Gardenia jasminoides", "Rubiaceae"),
  flower("fuchsia", "Fuchsia", "Fuchsia", "Onagraceae"),
  flower("freesia", "Freesia", "Freesia", "Iridaceae"),
  flower("primrose", "Primrose", "Primula vulgaris", "Primulaceae"),
  flower("sweet-pea", "Sweet pea", "Lathyrus odoratus", "Fabaceae"),
  flower("gladiolus", "Gladiolus", "Gladiolus", "Iridaceae", ["sword lily"]),
  flower("plumeria", "Frangipani", "Plumeria rubra", "Apocynaceae", ["plumeria"]),
  flower("oleander", "Oleander", "Nerium oleander", "Apocynaceae"),
  flower("aster", "Aster", "Symphyotrichum", "Asteraceae"),
  flower("cosmos", "Cosmos", "Cosmos bipinnatus", "Asteraceae"),
  flower("nasturtium", "Nasturtium", "Tropaeolum majus", "Tropaeolaceae"),
  flower("yarrow", "Yarrow", "Achillea millefolium", "Asteraceae"),
  flower("calla-lily", "Calla lily", "Zantedeschia aethiopica", "Araceae"),
  flower("canna-lily", "Canna lily", "Canna indica", "Cannaceae", ["canna"]),
  flower("begonia", "Begonia", "Begonia", "Begoniaceae"),
  flower("impatiens", "Busy Lizzie", "Impatiens walleriana", "Balsaminaceae", ["impatiens"]),
  flower("pansy", "Pansy", "Viola × wittrockiana", "Violaceae"),
  flower("violet", "Sweet violet", "Viola odorata", "Violaceae", ["violet"]),
  flower("lilac", "Lilac", "Syringa vulgaris", "Oleaceae"),
  flower("lupine", "Lupine", "Lupinus", "Fabaceae", ["lupin"]),
  flower("delphinium", "Delphinium", "Delphinium", "Ranunculaceae", ["larkspur"]),
  flower("hollyhock", "Hollyhock", "Alcea rosea", "Malvaceae"),
  flower("sweet-william", "Sweet William", "Dianthus barbatus", "Caryophyllaceae"),
  flower("king-protea", "King protea", "Protea cynaroides", "Proteaceae", ["protea"]),
  flower("grape-hyacinth", "Grape hyacinth", "Muscari armeniacum", "Asparagaceae", ["muscari"]),
];

const normalize = (value = "") => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function findFlowerBySlug(slug) {
  return FLOWER_RECOGNITION_CATALOG.find((item) => item.slug === slug) || null;
}

export function findFlowerByName(query) {
  const wanted = normalize(query);
  if (!wanted) return null;

  const ranked = FLOWER_RECOGNITION_CATALOG.map((item) => {
    const names = [item.common_name, item.scientific_name, item.slug, ...item.aliases].map(normalize);
    if (names.includes(wanted)) return { item, score: 3 };
    if (names.some((name) => name.startsWith(wanted) || wanted.startsWith(name))) return { item, score: 2 };
    if (names.some((name) => name.includes(wanted) || wanted.includes(name))) return { item, score: 1 };
    return { item, score: 0 };
  }).sort((left, right) => right.score - left.score);

  return ranked[0]?.score ? ranked[0].item : null;
}
