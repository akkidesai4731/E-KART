const mobileNames = [
  "Samsung Galaxy A16",
  "Samsung Galaxy A56",
  "Samsung Galaxy S25",
  "iPhone 16e",
  "iPhone 16",
  "iPhone 16 Pro",
  "Redmi Note 14",
  "Redmi Note 14 Pro",
  "POCO X7",
  "POCO F7",
  "OnePlus Nord CE4 Lite",
  "OnePlus Nord 5",
  "OnePlus 13R",
  "Realme 14 Pro",
  "Realme P3",
  "Vivo V50",
  "Vivo T4",
  "OPPO Reno 13",
  "OPPO A5 Pro",
  "Motorola Edge 50 Fusion",
  "Motorola Edge 60 Pro",
  "Nothing Phone 3a",
  "Nothing Phone 3a Pro",
  "Google Pixel 9a",
  "Google Pixel 9",
  "Infinix Note 50",
  "Tecno Camon 40",
  "iQOO Z10",
  "iQOO Neo 10R",
  "Lava Agni 3",
];

export const mobiles = mobileNames.map((name, i) => ({
  id: `mobile-${i + 1}`,
  name,
  brand: name.split(" ")[0],
  category: "Mobiles",
  price: 9999 + i * 2500,
  stock: 100,
  rating: Number((4 + (i % 10) / 10).toFixed(1)),

  image:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",

  images: [
    {
      label: "Front View",
      url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
    },
    {
      label: "Back View",
      url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85",
    },
    {
      label: "Side View",
      url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=85",
    },
    {
      label: "Angled View",
      url: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=900&q=85",
    },
    {
      label: "Close-up View",
      url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=85",
    },
  ],

  description: `${name} smartphone with modern features and connectivity.`,

  features: [
    "Modern touchscreen display",
    "5G/4G connectivity, depending on model",
    "Multiple camera features",
    "Portable everyday design",
  ],

  specifications: {
    Connectivity: "5G/4G, depending on model",
    Display: "Touchscreen",
    Storage: "Varies by model",
    Battery: "Varies by model",
  },
}));
