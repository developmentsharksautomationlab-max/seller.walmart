// End-to-end check of the data layer + seeds a demo account.
// Run with: node --env-file=.env scripts/verify.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@saleshub.app";
const DEMO_PASSWORD = "demo1234";
const TEST_EMAIL = "isolation-test@saleshub.app";

let pass = 0;
let fail = 0;
function check(label, cond) {
  console.log(`${cond ? "✅ PASS" : "❌ FAIL"}  ${label}`);
  cond ? pass++ : fail++;
}

const d = (s) => new Date(s + "T12:00:00Z");

async function main() {
  // Clean slate for the accounts this script manages (cascade removes their data).
  await prisma.user.deleteMany({
    where: { email: { in: [DEMO_EMAIL, TEST_EMAIL] } },
  });

  // --- Demo user (kept) ---
  const demo = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  const products = await Promise.all(
    [
      ["Wireless Headphones", "Electronics", 129.0, 40],
      ["Smart Watch Pro", "Electronics", 249.0, 25],
      ["Mechanical Keyboard", "Electronics", 89.0, 60],
      ["Cotton T-Shirt", "Apparel", 19.99, 200],
      ["Desk Lamp", "Home & Living", 34.5, 75],
    ].map(([name, category, price, stock]) =>
      prisma.product.create({
        data: { userId: demo.id, name, category, price, stock },
      }),
    ),
  );
  const byName = Object.fromEntries(products.map((p) => [p.name, p]));

  const orderSpec = [
    ["Wireless Headphones", "Aarav Sharma", 1, "Paid", "2026-06-10"],
    ["Smart Watch Pro", "Diya Patel", 1, "Pending", "2026-06-09"],
    ["Mechanical Keyboard", "Kabir Singh", 2, "Paid", "2026-06-05"],
    ["Cotton T-Shirt", "Ananya Rao", 3, "Paid", "2026-06-02"],
    ["Smart Watch Pro", "Vivaan Gupta", 1, "Paid", "2026-05-20"],
    ["Desk Lamp", "Isha Mehta", 2, "Paid", "2026-05-15"],
    ["Wireless Headphones", "Rohan Das", 1, "Refunded", "2026-05-08"],
    ["Cotton T-Shirt", "Saanvi Nair", 5, "Paid", "2026-05-02"],
    ["Mechanical Keyboard", "Arjun Iyer", 1, "Paid", "2026-04-18"],
    ["Smart Watch Pro", "Myra Reddy", 2, "Paid", "2026-04-10"],
    ["Desk Lamp", "Aditya Bose", 1, "Paid", "2026-03-22"],
    ["Wireless Headphones", "Tara Kapoor", 2, "Paid", "2026-03-05"],
    ["Cotton T-Shirt", "Neil Verma", 4, "Paid", "2026-02-14"],
  ];

  for (const [pname, customer, qty, status, date] of orderSpec) {
    const p = byName[pname];
    await prisma.order.create({
      data: {
        userId: demo.id,
        productId: p.id,
        productName: p.name,
        category: p.category,
        customerName: customer,
        quantity: qty,
        unitPrice: p.price,
        amount: p.price * qty,
        status,
        createdAt: d(date),
      },
    });
  }

  // --- Isolation-test user (deleted at the end) ---
  const other = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Other User",
      passwordHash: await bcrypt.hash("whatever", 10),
    },
  });
  const otherProduct = await prisma.product.create({
    data: { userId: other.id, name: "Secret Widget", category: "X", price: 999, stock: 1 },
  });
  await prisma.order.create({
    data: {
      userId: other.id,
      productId: otherProduct.id,
      productName: otherProduct.name,
      category: otherProduct.category,
      customerName: "Spy",
      quantity: 1,
      unitPrice: 999,
      amount: 999,
      status: "Paid",
      createdAt: d("2026-06-10"),
    },
  });

  // === Checks ===
  // 1. Password hashing round-trips.
  check(
    "bcrypt: correct password verifies",
    await bcrypt.compare(DEMO_PASSWORD, demo.passwordHash),
  );
  check(
    "bcrypt: wrong password rejected",
    !(await bcrypt.compare("wrongpass", demo.passwordHash)),
  );

  // 2. Multi-tenant isolation: demo's query never returns the other user's rows.
  const demoOrders = await prisma.order.findMany({ where: { userId: demo.id } });
  check(
    `isolation: demo sees only own orders (${demoOrders.length} == ${orderSpec.length})`,
    demoOrders.length === orderSpec.length,
  );
  check(
    "isolation: 'Secret Widget' never leaks into demo's orders",
    !demoOrders.some((o) => o.productName === "Secret Widget"),
  );
  const demoProducts = await prisma.product.findMany({ where: { userId: demo.id } });
  check(
    "isolation: demo sees only own products (5)",
    demoProducts.length === 5 && !demoProducts.some((p) => p.name === "Secret Widget"),
  );

  // 3. Aggregation math: total revenue = sum of PAID amounts only.
  const paid = demoOrders.filter((o) => o.status === "Paid");
  const totalRevenue = paid.reduce((s, o) => s + o.amount, 0);
  const expected = orderSpec
    .filter(([, , , status]) => status === "Paid")
    .reduce((s, [pname, , qty]) => s + byName[pname].price * qty, 0);
  check(
    `revenue: paid total computed correctly ($${totalRevenue.toFixed(2)})`,
    Math.abs(totalRevenue - expected) < 0.001,
  );
  check(
    "revenue: excludes Pending + Refunded",
    paid.length === orderSpec.filter(([, , , s]) => s === "Paid").length,
  );

  // 4. onDelete: deleting a product keeps the order (snapshot survives, FK nulled).
  const kbId = byName["Mechanical Keyboard"].id;
  await prisma.product.delete({ where: { id: kbId } });
  const orphan = await prisma.order.findFirst({
    where: { userId: demo.id, productName: "Mechanical Keyboard" },
  });
  check(
    "onDelete: order survives product deletion, productId nulled",
    orphan && orphan.productId === null && orphan.productName === "Mechanical Keyboard",
  );
  // restore the product so the demo account looks complete
  await prisma.product.create({
    data: { userId: demo.id, name: "Mechanical Keyboard", category: "Electronics", price: 89, stock: 60 },
  });

  // --- Cleanup the isolation-test user; keep the demo account ---
  await prisma.user.delete({ where: { id: other.id } });

  console.log(`\n${pass} passed, ${fail} failed.`);
  console.log(
    fail === 0
      ? `\nDemo account ready → email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`
      : "",
  );
  process.exit(fail === 0 ? 0 : 1);
}

main().finally(() => prisma.$disconnect());
