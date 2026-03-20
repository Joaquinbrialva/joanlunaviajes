import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/settings.json');

const DEFAULT_SETTINGS = {
  hero: {
    type: 'image',
    url: '/assets/images/hero-img.jpg',
    poster: null,
  },
};

export function readSettings() {
  try {
    if (!existsSync(DATA_PATH)) return structuredClone(DEFAULT_SETTINGS);
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function writeSettings(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
