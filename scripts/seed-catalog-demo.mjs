// One-off: adds a batch of real-world catalog items (with hotlinked Target
// product photos) to the demo account, matching the "Sharks" seller catalog
// screenshot the user shared. Run with:
//   node --env-file=.env scripts/seed-catalog-demo.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_EMAIL = "demo@saleshub.app";

const items = [
  {
    name: "Aroma 6-Cup Pot Style Rice Cooker",
    category: "Home & Living",
    price: 27.99,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_c3e1dcf0-06c5-40ff-93e0-42fbde8ee2d3?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: "Liftmaster 878MAX Wireless Keyless Keypad - Replacement for Older Models 877MAX, 376LM, 877LM, 976LM",
    category: "Home & Living",
    price: 25.98,
    stock: 8,
    imageUrl: null,
  },
  {
    name: "Garage Door Insulation Kit (8-Piece)",
    category: "Home & Living",
    price: 91.99,
    stock: 0,
    imageUrl: null,
  },
  {
    name: "True Temper 6' Cubic Steel Wheelbarrow w/ Steel Handle",
    category: "Home & Living",
    price: 193.29,
    stock: 0,
    imageUrl: null,
  },
  {
    name: "Avalon Limited Edition Self Cleaning Water Cooler Water Dispenser",
    category: "Home & Living",
    price: 358.99,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_1179aeb8-d4dd-4a01-a6b6-8b3491109905?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: "Scott 1000 Toilet Paper, 12 Rolls, 1,000 Sheets per Roll",
    category: "Home & Living",
    price: 17.49,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_ef1c3195-0685-4a6f-8e0a-6782cd4da872?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: "BugMD Ant Killer & Bug Spray - Roach and Cockroach Killer",
    category: "Home & Living",
    price: 39.95,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_ec11ab02-e00e-409e-9f48-4482f19cf94f?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: "Bounty Paper Towels Select-a-Size, 8 Triple Rolls",
    category: "Home & Living",
    price: 31.98,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_492edd4b-83d8-4629-b4c0-14985bae3c16?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: "Bounty Select-a-Size Paper Towels, 12 Double Rolls, White",
    category: "Home & Living",
    price: 32.99,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_05ee514d-7a73-47b0-a740-7af23d88d98d?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: 'Lasko 18" 3-Speed Elegance and Performance Oscillating Pedestal Fan',
    category: "Home & Living",
    price: 72.99,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_b0f5b82a-877a-4ccf-b161-db98e06b4f3e?wid=300&hei=300&fmt=pjpeg",
  },
  {
    name: 'Lasko Cyclone Max 18" 4-Speed Oscillating Fan, Remote',
    category: "Home & Living",
    price: 66.99,
    stock: 0,
    imageUrl:
      "https://target.scene7.com/is/image/Target/GUEST_f790ea26-da21-45b8-81cc-7ac0275bfecd?wid=300&hei=300&fmt=pjpeg",
  },
];

async function main() {
  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demo) {
    console.error(`No user found with email ${DEMO_EMAIL}. Run "npm run seed" first.`);
    process.exit(1);
  }

  for (const item of items) {
    await prisma.product.create({ data: { userId: demo.id, ...item } });
    console.log(`+ ${item.name}${item.imageUrl ? "" : "  (no image found)"}`);
  }

  console.log(`\nAdded ${items.length} items to ${DEMO_EMAIL}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
