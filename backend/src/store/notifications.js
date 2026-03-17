import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTIF_PATH = path.join(__dirname, '../../data/notifications.json');

async function readAll() {
  try {
    const content = await fs.readFile(NOTIF_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeAll(data) {
  await fs.writeFile(NOTIF_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function nextId(notifications) {
  const max = notifications.reduce((m, n) => {
    const num = Number(String(n.id || '').replace('notif-', ''));
    return Number.isFinite(num) ? Math.max(m, num) : m;
  }, 0);
  return `notif-${String(max + 1).padStart(4, '0')}`;
}

export async function createNotification({ type, title, body, forRoles, offerId, offerSlug, offerTitle }) {
  const all = await readAll();
  const notif = {
    id: nextId(all),
    type,
    title,
    body,
    forRoles,
    readBy: [],
    offerId: offerId || null,
    offerSlug: offerSlug || null,
    offerTitle: offerTitle || null,
    createdAt: new Date().toISOString(),
  };
  await writeAll([notif, ...all]);
  return notif;
}

export { readAll, writeAll };
