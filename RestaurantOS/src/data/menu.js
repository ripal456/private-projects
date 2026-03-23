export const MENU = [
  {
    id: 1,
    name: "Margherita",
    desc: "San Marzano tomato, fior di latte, fresh basil",
    price: 12.9,
    emoji: "🍕",
    category: "Pizza",
    badge: "Popular",
  },
  {
    id: 2,
    name: "Diavola",
    desc: "Spicy salami, chilli, smoked mozzarella",
    price: 14.5,
    emoji: "🍕",
    category: "Pizza",
  },
  {
    id: 3,
    name: "Truffle Fungi",
    desc: "Black truffle cream, mixed mushrooms, parmesan",
    price: 17.9,
    emoji: "🍕",
    category: "Pizza",
    badge: "Chef",
  },
  {
    id: 4,
    name: "Tagliatelle Bolognese",
    desc: "Slow-cooked beef ragù, fresh pasta, parmesan",
    price: 13.5,
    emoji: "🍝",
    category: "Pasta",
    badge: "Popular",
  },
  {
    id: 5,
    name: "Cacio e Pepe",
    desc: "Tonnarelli, pecorino romano, black pepper",
    price: 11.9,
    emoji: "🍝",
    category: "Pasta",
  },
  {
    id: 6,
    name: "Penne Arrabbiata",
    desc: "Spicy tomato sauce, garlic, fresh chilli",
    price: 10.5,
    emoji: "🍝",
    category: "Pasta",
  },
  {
    id: 7,
    name: "Tiramisù",
    desc: "Mascarpone cream, espresso-soaked savoiardi",
    price: 6.9,
    emoji: "🍮",
    category: "Dessert",
    badge: "Popular",
  },
  {
    id: 8,
    name: "Panna Cotta",
    desc: "Vanilla cream, wild berry coulis",
    price: 5.9,
    emoji: "🍮",
    category: "Dessert",
  },
  {
    id: 9,
    name: "Sparkling Water",
    desc: "750ml San Pellegrino",
    price: 3.5,
    emoji: "💧",
    category: "Drinks",
  },
  {
    id: 10,
    name: "Aperol Spritz",
    desc: "Aperol, Prosecco, soda, orange slice",
    price: 8.5,
    emoji: "🍹",
    category: "Drinks",
    badge: "New",
  },
];

export const CATEGORIES = [
  "All",
  ...new Set(MENU.map((item) => item.category)),
];

export const STATUS_FLOW = ["new", "preparing", "ready", "done"];

export const STATUS_CONFIG = {
  new: { label: "New", progress: 15, color: "#e8ff4d" },
  preparing: { label: "Preparing", progress: 50, color: "#fb923c" },
  ready: { label: "Ready", progress: 85, color: "#4ade80" },
  done: { label: "Done", progress: 100, color: "#444" },
};

export const ADVANCE_LABELS = {
  new: "Start Preparing →",
  preparing: "Mark Ready →",
  ready: "Mark Done →",
  done: null,
};
