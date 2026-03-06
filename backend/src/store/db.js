import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

const PATHS = {
  offers: path.join(DATA_DIR, 'offers.json'),
  destinations: path.join(DATA_DIR, 'destinations.json'),
  inquiries: path.join(DATA_DIR, 'inquiries.json'),
  users: path.join(DATA_DIR, 'users.json'),
};

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export const db = {
  offers: {
    read: () => readJson(PATHS.offers),
    write: (data) => writeJson(PATHS.offers, data),
  },
  destinations: {
    read: () => readJson(PATHS.destinations),
    write: (data) => writeJson(PATHS.destinations, data),
  },
  inquiries: {
    read: () => readJson(PATHS.inquiries),
    write: (data) => writeJson(PATHS.inquiries, data),
  },
  users: {
    read: () => readJson(PATHS.users),
    write: (data) => writeJson(PATHS.users, data),
  },
};

// --- ID and slug helpers ---

function getHighestNumericId(items, prefix) {
  return items.reduce((max, item) => {
    if (!item?.id?.startsWith(prefix)) return max;
    const numeric = Number(item.id.replace(prefix, ''));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
}

export function nextOfferId(offers) {
  return `of-${String(getHighestNumericId(offers, 'of-') + 1).padStart(4, '0')}`;
}

export function nextDestinationId(destinations) {
  return `dest-${String(getHighestNumericId(destinations, 'dest-') + 1).padStart(3, '0')}`;
}

export function nextInquiryId(inquiries) {
  return `inq-${String(getHighestNumericId(inquiries, 'inq-') + 1).padStart(4, '0')}`;
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function uniqueSlug(base, existingSlugs) {
  const initial = slugify(base) || `item-${Date.now()}`;
  if (!existingSlugs.has(initial)) return initial;
  let i = 2;
  while (existingSlugs.has(`${initial}-${i}`)) i++;
  return `${initial}-${i}`;
}
