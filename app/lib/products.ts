export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  specs: string[];
  image?: string;
  stock?: number | string;
  affiliate?: {
    url: string;
    commission?: string;
  };
  features?: string[];
}

export const products: Product[] = [
  {
    id: "WLK-MN-PRO",
    name: "WALKING MAN PRO",
    price: 299,
    category: "HARDWARE",
    description: "RPi 5 + E-Ink + Coral Edge TPU + Sony IMX500 AI Cam + BLE Sensor Suite. Offline foraging AI: 95% plant ID, yield sims. 40hr AA runtime.",
    specs: ["RPI5_8GB", "MOBILENETV3_CUSTOM", "BLE_SENSORSx4", "IP67", "OFFLINE_TTS"],
    image: "/images/pro-render.jpg",
    stock: 12,
    features: ["Thanksgiving-trained model: Deadly/edible bias (79% acc)", "Solar trickle"]
  },
  {
    id: "AFF-HELTEC-V3",
    name: "HELTEC V3 MESH NODE",
    price: 45,
    category: "AFFILIATE",
    description: "LoRa Meshtastic node for COMMS. Off-grid radio, solar-compatible.",
    specs: ["LORAX915", "ESP32", "OLED_DISP"],
    image: "/images/heltec.jpg",
    stock: "∞",
    affiliate: {
      url: "https://heltec.org/shop?ref=homelabs10",
      commission: "10%"
    }
  }
];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.id.toLowerCase() === slug.toLowerCase());
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category);
}
