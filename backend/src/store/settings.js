import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabase } from './supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_PATH = join(__dirname, '../../data/settings.json');

const BUCKET = 'images';
const SETTINGS_KEY = '_config/settings.json';

const DEFAULT_SETTINGS = {
  hero: {
    type: 'image',
    url: '/assets/images/hero-img.jpg',
    poster: null,
  },
};

// Supabase is available in production; local file is the dev fallback.
function hasSupabase() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function readLocal() {
  try {
    if (!existsSync(LOCAL_PATH)) return structuredClone(DEFAULT_SETTINGS);
    return JSON.parse(readFileSync(LOCAL_PATH, 'utf-8'));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function readSettings() {
  if (hasSupabase()) {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(SETTINGS_KEY);
      if (!error && data) return JSON.parse(await data.text());
    } catch {
      // fall through to local
    }
  }
  return readLocal();
}

export async function writeSettings(settings) {
  if (hasSupabase()) {
    const buf = Buffer.from(JSON.stringify(settings, null, 2), 'utf-8');
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(SETTINGS_KEY, buf, { contentType: 'application/json', upsert: true });
    if (error) throw error;
    return;
  }
  // Dev fallback: write to local JSON file
  writeFileSync(LOCAL_PATH, JSON.stringify(settings, null, 2));
}
