import { promises as fs } from 'node:fs';
import path from 'node:path';

const OFFERS_PATH = path.join(process.cwd(), 'mocks', 'mock_offers_varied.json');
const DESTINATIONS_PATH = path.join(process.cwd(), 'mocks', 'mock_destinations_informative.json');

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function writeJson(filePath, data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, serialized, 'utf8');
}

export async function readOffers() {
  return readJson(OFFERS_PATH);
}

export async function writeOffers(data) {
  return writeJson(OFFERS_PATH, data);
}

export async function readDestinations() {
  return readJson(DESTINATIONS_PATH);
}

export async function writeDestinations(data) {
  return writeJson(DESTINATIONS_PATH, data);
}

function getHighestNumericId(items, prefix) {
  return items.reduce((max, item) => {
    if (!item?.id?.startsWith(prefix)) return max;
    const numeric = Number(item.id.replace(prefix, ''));
    if (!Number.isFinite(numeric)) return max;
    return Math.max(max, numeric);
  }, 0);
}

export function createOfferId(offers) {
  const next = getHighestNumericId(offers, 'of-') + 1;
  return `of-${String(next).padStart(4, '0')}`;
}

export function createDestinationId(destinations) {
  const next = getHighestNumericId(destinations, 'dest-') + 1;
  return `dest-${String(next).padStart(3, '0')}`;
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

export function createUniqueSlug(base, existingSlugs) {
  const initial = slugify(base) || `item-${Date.now()}`;
  if (!existingSlugs.has(initial)) return initial;

  let index = 2;
  while (existingSlugs.has(`${initial}-${index}`)) {
    index += 1;
  }
  return `${initial}-${index}`;
}
