import { mobiles } from "./mobiles.js";
import { laptops } from "./laptops.js";
import { refrigerators } from "./refrigerators.js";
import { televisions } from "./televisions.js";
import { homeAppliances } from "./homeAppliances.js";

const existingProducts = [
  {
    id: "phone-pro",
    name: "Nova Pro 5G Smartphone",
    brand: "Nova",
    category: "Mobiles",
    price: 42999,
    stock: 100,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
    description: "A modern 5G smartphone for everyday use.",
    specifications: {
      Display: "6.7-inch AMOLED",
      Storage: "256 GB",
      Battery: "5000 mAh",
    },
  },
  {
    id: "everyday-phone",
    name: "Everyday 5G Smartphone",
    brand: "Everyday",
    category: "Mobiles",
    price: 18999,
    stock: 100,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85",
    description: "A practical smartphone for daily use.",
    specifications: {
      Display: "6.5-inch display",
      Storage: "128 GB",
      Battery: "5000 mAh",
    },
  },
  {
    id: "fridge",
    name: "Double Door Refrigerator",
    brand: "FrostLine",
    category: "Refrigerators",
    price: 28990,
    stock: 100,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=85",
    description: "A spacious refrigerator for household use.",
    specifications: {
      Capacity: "260 litres",
      Type: "Double door",
      Cooling: "Frost free",
    },
  },
  {
    id: "smart-tv",
    name: "Vision 4K Smart Television",
    brand: "Vision",
    category: "Televisions",
    price: 36990,
    stock: 100,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85",
    description: "A smart television for movies and streaming.",
    specifications: {
      Display: "55-inch",
      Resolution: "4K UHD",
      Connectivity: "Wi-Fi and HDMI",
    },
  },
  {
    id: "washer",
    name: "Front Load Washing Machine",
    brand: "CleanWave",
    category: "Washing Machines",
    price: 31990,
    stock: 100,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85",
    description: "A washing machine for everyday laundry.",
    specifications: {
      Capacity: "8 kg",
      Type: "Front load",
      Programs: "Multiple wash programs",
    },
  },
  {
    id: "microwave",
    name: "Convection Microwave Oven",
    brand: "HeatMate",
    category: "Kitchen Appliances",
    price: 11990,
    stock: 100,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=85",
    description: "A versatile kitchen appliance.",
    specifications: {
      Capacity: "28 litres",
      Type: "Convection",
      Controls: "Digital",
    },
  },
  {
    id: "ac",
    name: "Split Air Conditioner",
    brand: "BreezeCool",
    category: "Cooling",
    price: 34990,
    stock: 100,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1631545806609-2c6a2a3d1c12?auto=format&fit=crop&w=900&q=85",
    description: "An air conditioner for indoor comfort.",
    specifications: {
      Capacity: "1.5 ton",
      Type: "Split AC",
      Cooling: "Inverter model",
    },
  },
  {
    id: "vacuum",
    name: "Cordless Vacuum Cleaner",
    brand: "DustAway",
    category: "Home Appliances",
    price: 8990,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=85",
    description: "A convenient appliance for household cleaning.",
    specifications: {
      Type: "Cordless",
      Usage: "Indoor cleaning",
      Design: "Lightweight",
    },
  },
  {
    id: "air-fryer",
    name: "Digital Air Fryer",
    brand: "CrispChef",
    category: "Kitchen Appliances",
    price: 6990,
    stock: 100,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1648131600075-7b3b3e7c5e9e?auto=format&fit=crop&w=900&q=85",
    description: "A countertop appliance for everyday cooking.",
    specifications: {
      Capacity: "5 litres",
      Controls: "Digital",
      Temperature: "Adjustable",
    },
  },
  {
    id: "lamp",
    name: "LED Desk Lamp",
    brand: "BrightHome",
    category: "Lighting",
    price: 1499,
    stock: 100,
    rating: 4.1,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    description: "A desk lamp for reading and studying.",
    specifications: {
      Lighting: "LED",
      Usage: "Desk and study",
      Brightness: "Model dependent",
    },
  },

  {
    id: "laptop-1",
    name: "UltraBook Slim Laptop",
    brand: "TechNova",
    category: "Laptops",
    price: 54999,
    stock: 100,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    description: "A slim laptop for work, study and everyday productivity.",
    specifications: {
      Display: "15.6-inch",
      RAM: "16 GB",
      Storage: "512 GB SSD",
      Connectivity: "Wi-Fi and Bluetooth",
    },
  },
  {
    id: "phone-3",
    name: "Nova Max 5G Smartphone",
    brand: "Nova",
    category: "Mobiles",
    price: 32999,
    stock: 100,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
    description: "A 5G smartphone designed for entertainment and multitasking.",
    specifications: {
      Display: "6.7-inch AMOLED",
      Storage: "256 GB",
      Battery: "5000 mAh",
      Network: "5G",
    },
  },
  {
    id: "tablet-1",
    name: "Everyday Android Tablet",
    brand: "TechNova",
    category: "Tablets",
    price: 21999,
    stock: 100,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80",
    description:
      "A versatile tablet for reading, video calls and entertainment.",
    specifications: {
      Display: "11-inch",
      Storage: "128 GB",
      Connectivity: "Wi-Fi",
      Usage: "Study and entertainment",
    },
  },
  {
    id: "headphones-1",
    name: "Wireless Bluetooth Headphones",
    brand: "SoundWave",
    category: "Audio",
    price: 2999,
    stock: 100,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Wireless headphones for music, calls and daily commuting.",
    specifications: {
      Connectivity: "Bluetooth",
      Microphone: "Built-in",
      Design: "Over-ear",
      Controls: "On-device controls",
    },
  },
  {
    id: "speaker-1",
    name: "Portable Bluetooth Speaker",
    brand: "SoundWave",
    category: "Audio",
    price: 1999,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    description: "A portable speaker for music at home or outdoors.",
    specifications: {
      Connectivity: "Bluetooth",
      Design: "Portable",
      Charging: "USB",
      Usage: "Indoor and outdoor",
    },
  },
  {
    id: "fridge-2",
    name: "Single Door Energy-Saving Refrigerator",
    brand: "FrostLine",
    category: "Refrigerators",
    price: 16999,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
    description: "A compact refrigerator suitable for smaller households.",
    specifications: {
      Type: "Single door",
      Capacity: "190 litres",
      Cooling: "Direct cool",
      Usage: "Household",
    },
  },
  {
    id: "dishwasher-1",
    name: "Automatic Dishwasher",
    brand: "CleanWave",
    category: "Home Appliances",
    price: 28999,
    stock: 100,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    description: "An automatic dishwasher to simplify kitchen cleanup.",
    specifications: {
      Type: "Automatic",
      Installation: "Freestanding or compatible fitted space",
      Usage: "Kitchen",
      Programs: "Multiple wash programs",
    },
  },
  {
    id: "induction-1",
    name: "Electric Induction Cooktop",
    brand: "KitchenPro",
    category: "Kitchen Appliances",
    price: 2499,
    stock: 100,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
    description: "A compact electric cooktop for compatible cookware.",
    specifications: {
      Type: "Induction",
      Controls: "Touch controls",
      Usage: "Cooking",
      Safety: "Model-dependent safety features",
    },
  },
  {
    id: "iron-1",
    name: "Steam Iron",
    brand: "DailyHome",
    category: "Home Appliances",
    price: 1499,
    stock: 100,
    rating: 4.1,
    image:
      "https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=800&q=80",
    description: "A steam iron for everyday clothing care.",
    specifications: {
      Type: "Steam iron",
      Temperature: "Adjustable",
      Usage: "Clothing care",
      Power: "Check product label",
    },
  },
  {
    id: "geyser-1",
    name: "Electric Water Heater",
    brand: "BreezeCool",
    category: "Home Appliances",
    price: 6999,
    stock: 100,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80",
    description: "An electric water heater for household hot-water needs.",
    specifications: {
      Type: "Storage water heater",
      Capacity: "15 litres",
      Installation: "Wall mounted",
      Safety: "Verify safety ratings before purchase",
    },
  },
  {
    id: "purifier-1",
    name: "Home Water Purifier",
    brand: "PureLife",
    category: "Home Appliances",
    price: 8999,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80",
    description:
      "A household water purifier. Check source-water compatibility before buying.",
    specifications: {
      Type: "Water purifier",
      Installation: "Model dependent",
      Filtration: "Check product specification",
      Maintenance: "Periodic filter replacement may be required",
    },
  },
  {
    id: "router-1",
    name: "Dual-Band Wi-Fi Router",
    brand: "ConnectPro",
    category: "Networking",
    price: 2499,
    stock: 100,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=800&q=80",
    description:
      "A home networking router for compatible broadband connections.",
    specifications: {
      Bands: "Dual band",
      Connectivity: "Wi-Fi and Ethernet",
      Usage: "Home networking",
      Setup: "Web or app configuration, model dependent",
    },
  },
  {
    id: "ups-1",
    name: "Home UPS and Backup Unit",
    brand: "PowerSafe",
    category: "Electrical Essentials",
    price: 5999,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80",
    description: "A backup power unit for compatible home equipment.",
    specifications: {
      Type: "Backup power",
      Capacity: "Verify model rating",
      Usage: "Home equipment",
      Battery: "Model dependent",
    },
  },
  {
    id: "extension-1",
    name: "Universal Extension Board",
    brand: "BrightHome",
    category: "Electrical Essentials",
    price: 799,
    stock: 100,
    rating: 4.1,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    description: "An extension board for compatible everyday electronics.",
    specifications: {
      Type: "Extension board",
      Outlets: "Check product model",
      Protection: "Verify safety certification",
      Usage: "Indoor",
    },
  },
  {
    id: "trimmer-1",
    name: "Rechargeable Electric Trimmer",
    brand: "DailyHome",
    category: "Personal Care Appliances",
    price: 1299,
    stock: 100,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
    description: "A rechargeable trimmer for everyday personal grooming.",
    specifications: {
      Power: "Rechargeable",
      Usage: "Personal grooming",
      Charging: "Model dependent",
      Accessories: "Check package contents",
    },
  },
];

export const products = [
  ...existingProducts,
  ...mobiles,
  ...refrigerators,
  ...homeAppliances,
  ...televisions,
  ...laptops,
];

export default products;
