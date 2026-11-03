const refrigeratorNames = [
  "Samsung Single Door 215L",
  "LG Single Door 183L",
  "Godrej Single Door 200L",
  "Whirlpool Single Door 190L",
  "Haier Single Door 190L",
  "Samsung Double Door 256L",
  "LG Double Door 272L",
  "Whirlpool Double Door 240L",
  "Haier Double Door 265L",
  "Godrej Double Door 300L",
  "Samsung Side-by-Side 500L",
  "Haier Side-by-Side 580L",
  "LG French Door 550L",
  "Samsung Convertible 256L",
  "LG Convertible 308L",
  "Haier Bottom Freezer 340L",
  "Midea Mini Fridge 45L",
  "Godrej Mini Fridge 90L",
  "Hisense Mini Fridge 50L",
  "Voltas Beko Inverter 190L",
  "Whirlpool Inverter 236L",
  "Panasonic Frost Free 280L",
  "Bosch Premium 340L",
  "Haier Beverage Cooler 100L",
  "Blue Star Commercial 400L",
  "Voltas Deep Freezer 200L",
  "Blue Star Deep Freezer 300L",
  "Hisense Four Door 470L",
  "Samsung Smart Refrigerator 650L",
  "Godrej Energy Saver 215L",
];

export const refrigerators = refrigeratorNames.map((name, i) => ({
  id: "fridge-1",
  name: "LG Direct Cool Single Door Refrigerator",
  brand: "LG",
  category: "Refrigerators",
  price: 13990,
  stock: 10,
  rating: 4.4,

  image: "/images/fridge-front.jpg",

  images: [
    { label: "Front", url: "/images/fridge-front.jpg" },
    { label: "Inside", url: "/images/fridge-inside.jpg" },
    { label: "Side", url: "/images/fridge-side.jpg" },
    { label: "Angled", url: "/images/fridge-angle.jpg" },
  ],

  variants: [
    {
      id: "blue-185",
      label: "Blue • 185 L",
      price: 13990,
      stock: 10,
      image: "/images/fridge-front.jpg",
    },
    {
      id: "silver-185",
      label: "Silver • 185 L",
      price: 14490,
      stock: 5,
      image: "/images/fridge-silver.jpg",
    },
  ],

  description: "A single-door refrigerator for everyday home use.",

  specifications: {
    Capacity: "185 L",
    Type: "Single door",
    Cooling: "Direct cool",
    Usage: "Household",
  },
}));
