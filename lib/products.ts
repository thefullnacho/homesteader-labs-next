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
    description: "RPi 5 + Hailo 8L NPU + Waveshare 4.2\" e-ink + RPi Camera Module 3. Offline field identification: 95–96% accuracy across 15 species and deadly lookalikes. No cloud, no signal required.",
    specs: ["RPI5_8GB", "HAILO_8L_NPU", "4.2IN_EINK", "RPi_CAM_3", "BLE_SENSORSx4", "OFFLINE_FIRST"],
    stock: "PRE-ORDER",
    features: [
      "95–96% field ID accuracy — industry baseline ~76%",
      "Multi-model cartridge convergence — mycologist, berry, herbalist",
      "Hailo 8L: 8 TOPS dedicated NPU, runs all cartridges in parallel",
      "Offline-first — no cloud dependency, works without signal",
      "BLE sensor integration: humidity, air quality, radiation context (upcoming)"
    ]
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
