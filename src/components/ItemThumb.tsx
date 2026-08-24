import { useState } from "react";
import {
  Headphones,
  Keyboard,
  Watch,
  Smartphone,
  Camera,
  Cpu,
  Shirt,
  Footprints,
  Glasses,
  Backpack,
  ShoppingBag,
  Dumbbell,
  Volleyball,
  GlassWater,
  Coffee,
  Lamp,
  Gem,
  Sparkles,
  Wrench,
  Disc3,
  Droplets,
  Car,
  Cog,
  Package,
  type LucideIcon,
} from "lucide-react";

// A clean, colored icon tile chosen by matching keywords in the item's NAME, so
// each product shows an icon that fits what it is (e.g. "Mechanical Keyboard" →
// keyboard, "Ignition Coil…" → a cog, "Brake Rotor…" → a disc). Falls back to
// the category, then a generic package icon.
type ThemeKey = "tech" | "auto" | "apparel" | "active" | "home" | "beauty" | "generic";
const THEMES: Record<ThemeKey, string> = {
  tech: "bg-blue-50 text-blue-600",
  auto: "bg-zinc-100 text-zinc-600",
  apparel: "bg-violet-50 text-violet-600",
  active: "bg-emerald-50 text-emerald-600",
  home: "bg-amber-50 text-amber-600",
  beauty: "bg-pink-50 text-pink-600",
  generic: "bg-slate-100 text-slate-500",
};

const NAME_MATCHERS: [string[], LucideIcon, ThemeKey][] = [
  // automotive parts
  [["ignition", "coil", "spark plug"], Cog, "auto"],
  [["brake", "rotor", "caliper", "brake pad"], Disc3, "auto"],
  [
    ["control arm", "suspension", "strut", "shock", "axle", "cv joint", "tie rod",
      "ball joint", "sway bar", "wheel hub", "steering", "coilover"],
    Cog,
    "auto",
  ],
  [["fuel", "gas tank", "fuel tank", "injector", "carburetor"], Droplets, "auto"],
  [
    ["engine", "motor", "piston", "crankshaft", "camshaft", "cylinder", "gasket",
      "alternator", "radiator", "timing belt", "water pump", "manifold", "valve",
      "muffler", "exhaust", "clutch", "transmission"],
    Car,
    "auto",
  ],
  [["repair kit", "tool kit", "toolkit", "wrench", "screwdriver", "drill", "socket set", "pliers", "tool"], Wrench, "auto"],
  // consumer tech
  [["headphone", "earbud", "earphone", "headset", "airpod"], Headphones, "tech"],
  [["keyboard"], Keyboard, "tech"],
  [["smartwatch", "wristwatch", "watch", "fitness tracker"], Watch, "tech"],
  [["smartphone", "iphone", "cell phone", "phone case"], Smartphone, "tech"],
  [["camera", "lens", "gopro", "webcam", "camcorder"], Camera, "tech"],
  // apparel / accessories
  [["jacket", "coat", "hoodie", "sweater", "sweatshirt", "cardigan"], Shirt, "apparel"],
  [["t-shirt", "tshirt", "polo", "jersey", "blouse", "shirt"], Shirt, "apparel"],
  [["sneaker", "shoe", "boot", "footwear", "loafer", "sandal", "trainer", "heel"], Footprints, "apparel"],
  [["sunglass", "eyewear", "goggle", "glasses"], Glasses, "apparel"],
  [["backpack", "handbag", "duffel", "tote", "luggage", "wallet", "purse", "satchel"], Backpack, "apparel"],
  // fitness / sports
  [["dumbbell", "barbell", "kettlebell", "weight plate", "weights", "yoga", "exercise mat", "resistance band", "fitness"], Dumbbell, "active"],
  [["basketball", "football", "soccer", "tennis", "racket", "ball", "sports"], Volleyball, "active"],
  [["water bottle", "bottle", "flask", "tumbler", "shaker"], GlassWater, "active"],
  // home / kitchen
  [["mug", "coffee cup", "coffee"], Coffee, "home"],
  [["lamp", "lantern", "bulb", "chandelier", "sconce"], Lamp, "home"],
  // beauty / jewelry
  [["bead", "bracelet", "necklace", "jewel", "earring", "pendant", "charm", "anklet"], Gem, "beauty"],
  [["lipstick", "mascara", "cosmetic", "makeup", "skincare", "serum", "perfume", "fragrance", "lotion", "shampoo"], Sparkles, "beauty"],
];

const CATEGORY_FALLBACK: Record<string, [LucideIcon, ThemeKey]> = {
  electronics: [Cpu, "tech"],
  apparel: [Shirt, "apparel"],
  footwear: [Footprints, "apparel"],
  fitness: [Dumbbell, "active"],
  "home & living": [Lamp, "home"],
  accessories: [ShoppingBag, "apparel"],
  beauty: [Sparkles, "beauty"],
  sports: [Volleyball, "active"],
};

function pick(name: string, category: string): [LucideIcon, ThemeKey] {
  const n = name.toLowerCase();
  for (const [terms, Icon, theme] of NAME_MATCHERS) {
    if (terms.some((t) => n.includes(t))) return [Icon, theme];
  }
  return CATEGORY_FALLBACK[category.trim().toLowerCase()] ?? [Package, "generic"];
}

export default function ItemThumb({
  category,
  title,
  imageUrl,
  size = "md",
}: {
  category: string;
  title?: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const [Icon, themeKey] = pick(title ?? "", category);
  const box = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const ic = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={title ?? category}
        title={title ?? category}
        className={`${box} shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      title={title ?? category}
      className={`flex ${box} shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 ${THEMES[themeKey]}`}
    >
      <Icon className={ic} strokeWidth={2} />
    </div>
  );
}
