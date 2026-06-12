import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);
const prisma = new PrismaClient();
const demo = await prisma.user.findFirst({ where: { email: "demo@saleshub.app" } });

const STAT = ["Delivered", "Delivered", "Delivered", "Shipped", "Shipped", "Unshipped", "Canceled"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rows = Array.from({ length: 22 }, (_, i) => {
  const amount = Math.round((15 + Math.random() * 120) * 100) / 100;
  return { userId: demo.id, productId: null, productName: "Wireless Headphones", category: "Electronics",
    customerName: "Cust " + i, quantity: 1, unitPrice: amount, amount, status: pick(STAT),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 55) * 86_400_000) };
});
await prisma.order.createMany({ data: rows });
const ids = (await prisma.order.findMany({ where: { userId: demo.id }, select: { id: true } })).map((x) => x.id);

const token = await new SignJWT({ userId: demo.id, expiresAt: new Date(Date.now() + 6e8).toISOString() })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(new TextEncoder().encode(env.SESSION_SECRET));
const PORT = 9000 + Math.floor(Math.random() * 900);
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, "--disable-gpu", "--hide-scrollbars", "--window-size=1500,1000", "--user-data-dir=" + process.env.TEMP + "\\edge_pf_" + PORT, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function bws() { for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://localhost:${PORT}/json/version`)).json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; } catch {} await sleep(200); } throw new Error("no cdp"); }
const ws = new WebSocket(await bws());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nid = 1; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}, sessionId) => { const id = nid++; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((r) => pend.set(id, r)); };
const { result: cr } = await send("Target.createTarget", { url: "about:blank" });
const { result: at } = await send("Target.attachToTarget", { targetId: cr.targetId, flatten: true });
const sid = at.sessionId;
await send("Network.enable", {}, sid);
await send("Network.setCookie", { name: "session", value: token, domain: "localhost", path: "/", httpOnly: true }, sid);
await send("Page.enable", {}, sid);
await send("Emulation.setDeviceMetricsOverride", { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false }, sid);
await send("Page.navigate", { url: "http://localhost:3000/performance" }, sid);
await sleep(2800);
const { result: shot } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1500, height: 1050, scale: 1 } }, sid);
writeFileSync("scripts\\perf.png", Buffer.from(shot.data, "base64"));
console.log("SAVED");
ws.close(); proc.kill();
await prisma.order.deleteMany({ where: { id: { in: ids } } });
console.log(`demoOrders=${await prisma.order.count({ where: { userId: demo.id } })}`);
await prisma.$disconnect();
process.exit(0);
