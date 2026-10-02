export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  category: "Celebration Cakes" | "Pastries" | "Dessert Cups & Small Bites";
  image: string;
  tags: ("V" | "VE" | "GF")[];
  sizes: string[];
  flavors: string[];
  allergenInfo: string;
}

export const MENU_ITEMS: MenuItem[] = [
  // Category 1: Celebration Cakes
  {
    id: "eton-mess",
    name: "Eton Mess Couture",
    price: 85,
    description: "Vanilla sponge, fresh raspberry compote, crispy meringue shards, and whipped white chocolate chantilly.",
    longDescription: "Our signature celebration cake. Light vanilla sponge layered with house-made fresh raspberry compote, crispy Swiss meringue shards, and frosted with an airy whipped white chocolate chantilly buttercream. Decorated with fresh seasonal berries and gold leaf detail. Perfect for weddings and milestones.",
    category: "Celebration Cakes",
    image: "/img/cake_eton_mess.jpg",
    tags: ["V"],
    sizes: ["6-inch (12 Servings) - $85", "8-inch (24 Servings) - $135", "10-inch (38 Servings) - $185"],
    flavors: ["Classic Vanilla Swiss Meringue", "Fresh Raspberry Curd & Vanilla", "White Chocolate Chantilly"],
    allergenInfo: "Contains wheat, dairy, and eggs. May contain traces of nuts."
  },
  {
    id: "salted-hazelnut",
    name: "Salted Hazelnut Drip",
    price: 90,
    description: "Rich dark chocolate mud sponge, organic salted caramel drip, honeycomb shards, and hazelnut praline.",
    longDescription: "A chocolate lover's dream. Layers of dense, rich dark chocolate mud sponge, filled with house-made salted butter caramel and crunchy hazelnut praline. Finished with a salted caramel drip, pieces of natural honeycomb, and roasted hazelnuts. Breathtakingly modern and highly satisfying.",
    category: "Celebration Cakes",
    image: "/img/cake_salted_hazelnut.jpg",
    tags: ["V"],
    sizes: ["6-inch (12 Servings) - $90", "8-inch (24 Servings) - $140", "10-inch (38 Servings) - $190"],
    flavors: ["Dark Chocolate Salted Caramel", "Espresso Hazelnut Ganache"],
    allergenInfo: "Contains wheat, dairy, eggs, and tree nuts (hazelnuts)."
  },
  {
    id: "citrus-elderflower",
    name: "Citrus Elderflower",
    price: 95,
    description: "Zesty lemon and elderflower sponge, house-made lemon curd, and fresh botanical lavender buttercream.",
    longDescription: "A bright, botanical masterpiece. Fluffy lemon-infused sponge cake layers soaked in elderflower liqueur syrup, spread with tart house-made lemon curd, and frosted with organic lavender Swiss meringue buttercream. A sensory delight with real edible flowers adorning the cake.",
    category: "Celebration Cakes",
    image: "/img/cake_citrus_elderflower.jpg",
    tags: ["V", "GF"],
    sizes: ["6-inch (12 Servings) - $95", "8-inch (24 Servings) - $145", "10-inch (38 Servings) - $195"],
    flavors: ["Zesty Lemon & Elderflower", "Lavender Buttercream & Raspberry"],
    allergenInfo: "Contains dairy and eggs. Gluten-free recipe."
  },
  {
    id: "valrhona-espresso",
    name: "Valrhona Espresso Mud",
    price: 110,
    description: "Decadent velvet chocolate cake, Valrhona dark chocolate mousse layers, and espresso buttercream.",
    longDescription: "An ultra-premium chocolate cake. Crafted with French Valrhona couverture chocolate, creating deep, velvety chocolate sponge layers. Paired with silky Valrhona chocolate mousse and finished with a robust espresso-infused buttercream. Strikingly decorated with cocoa nibs and espresso dust.",
    category: "Celebration Cakes",
    image: "/img/cake_valrhona_espresso.jpg",
    tags: ["V"],
    sizes: ["6-inch (12 Servings) - $110", "8-inch (24 Servings) - $160", "10-inch (38 Servings) - $210"],
    flavors: ["Pure Valrhona Fudge", "Espresso Mousse & Chocolate Chunks"],
    allergenInfo: "Contains wheat, dairy, and eggs."
  },

  // Category 2: Pastries
  {
    id: "tarte-tatin",
    name: "Couture Tarte Tatin",
    price: 16,
    description: "Upside-down caramelized heirloom apples, flaky puff pastry, and vanilla bean crème fraîche.",
    longDescription: "An individual take on the French classic. Hand-sliced heirloom apples caramelized to a deep amber hue in salted farm butter and sugar, baked atop a circular base of house-rolled flaky butter puff pastry. Served with a side of Madagascar vanilla bean crème fraîche.",
    category: "Pastries",
    image: "/img/cake_citrus_elderflower.jpg", // Fallback to existing download
    tags: ["V"],
    sizes: ["Single Serving - $16", "Box of 4 - $58"],
    flavors: ["Caramelized Apple & Cinnamon", "Pear Cardamom Tatin"],
    allergenInfo: "Contains wheat, dairy, and eggs."
  },
  {
    id: "pistachio-eclair",
    name: "Sicilian Pistachio Eclair",
    price: 12,
    description: "Crispy choux pastry, roasted Sicilian pistachio cream, and glazed white chocolate pistachio ganache.",
    longDescription: "Perfectly baked choux pastry shells, light and crisp, filled to the brim with a rich pastry cream made from 100% roasted Sicilian pistachio paste. Dipped in a silky white chocolate pistachio glaze and decorated with crushed raw pistachios and rose petals.",
    category: "Pastries",
    image: "/img/cake_valrhona_espresso.jpg",
    tags: ["V"],
    sizes: ["Single Serving - $12", "Box of 6 - $65"],
    flavors: ["Roasted Pistachio", "Pistachio Rose Water"],
    allergenInfo: "Contains wheat, dairy, eggs, and tree nuts (pistachios)."
  },

  // Category 3: Dessert Cups & Small Bites
  {
    id: "macaron-box",
    name: "Botanical Macaron Box",
    price: 36,
    description: "A signature collection of lavender-honey, rose-raspberry, and salted pistache French macarons.",
    longDescription: "A selection of 12 delicate French macarons. Crisp almond shells with soft, chewy centers filled with rich ganaches. Flavors include Lavender Honey, Rose Water Raspberry, and Salted Sicilian Pistachio. Gift boxed in our signature linen-textured packaging.",
    category: "Dessert Cups & Small Bites",
    image: "/img/cake_eton_mess.jpg",
    tags: ["V", "GF"],
    sizes: ["Box of 12 - $36", "Box of 24 - $68"],
    flavors: ["Assorted Botanical Flavors"],
    allergenInfo: "Contains dairy, eggs, and almonds. Gluten-free recipe."
  },
  {
    id: "salted-caramel-cup",
    name: "Salted Caramel Dessert Shooters",
    price: 24,
    description: "Layers of chocolate mud crumble, soft salted caramel, and vanilla bean mascarpone mousse.",
    longDescription: "Presented in elegant, tall crystal shot cups. Layers of dark chocolate mud cake crumbles, rich salted butter caramel, toasted pecan brittle, and a featherlight Madagascar vanilla bean mascarpone mousse. Designed for upscale dessert tables.",
    category: "Dessert Cups & Small Bites",
    image: "/img/cake_salted_hazelnut.jpg",
    tags: ["V"],
    sizes: ["Set of 6 - $24", "Set of 12 - $44"],
    flavors: ["Salted Caramel Pecan", "Raspberry Chocolate Mascarpone"],
    allergenInfo: "Contains wheat, dairy, eggs, and tree nuts (pecans)."
  }
];
