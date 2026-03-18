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
