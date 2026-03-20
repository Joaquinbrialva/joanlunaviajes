import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  async function safeFetch(url: string) {
    if (!apiUrl) return [];
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      return res.ok ? res.json() : [];
    } catch {
      return [];
    }
  }

  const [ofertas, destinos] = await Promise.all([
    safeFetch(`${apiUrl}/api/ofertas`),
    safeFetch(`${apiUrl}/api/destinos`),
  ]);

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const ofertaUrls = (ofertas || []).map((o: { slug: string; updatedAt: string }) => ({
    url: `${base}/ofertas/${o.slug}`,
    lastModified: new Date(o.updatedAt),
  }));

  const destinoUrls = (destinos || []).map((d: { slug: string; updatedAt: string }) => ({
    url: `${base}/destinos/${d.slug}`,
    lastModified: new Date(d.updatedAt),
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/ofertas`, lastModified: new Date() },
    { url: `${base}/destinos`, lastModified: new Date() },
    ...ofertaUrls,
    ...destinoUrls,
  ];
}
