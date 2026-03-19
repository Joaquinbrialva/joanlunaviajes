// Lista curada de aerolíneas relevantes para rutas desde Argentina / Latinoamérica
// Logos servidos por Aviasales CDN (pics.avs.io) — gratuito, sin API key, por código IATA

const airlines = [
  // Latinoamérica
  { iata: 'LA', name: 'LATAM Airlines' },
  { iata: 'AR', name: 'Aerolíneas Argentinas' },
  { iata: 'AV', name: 'Avianca' },
  { iata: 'CM', name: 'Copa Airlines' },
  { iata: 'G3', name: 'Gol Linhas Aéreas' },
  { iata: 'H2', name: 'Sky Airline' },
  { iata: 'JA', name: 'JetSMART' },
  { iata: 'AM', name: 'Aeroméxico' },
  { iata: 'VB', name: 'VivaAerobus' },
  { iata: 'Y4', name: 'Volaris' },
  { iata: '8V', name: 'Calafia Airlines' },
  { iata: 'P9', name: 'Peruvian Airlines' },
  { iata: 'LC', name: 'LATAM Perú' },
  { iata: '9I', name: 'Thai Airways' },
  { iata: 'BF', name: 'French Bee' },

  // Norteamérica
  { iata: 'AA', name: 'American Airlines' },
  { iata: 'UA', name: 'United Airlines' },
  { iata: 'DL', name: 'Delta Air Lines' },
  { iata: 'B6', name: 'JetBlue Airways' },
  { iata: 'WN', name: 'Southwest Airlines' },
  { iata: 'AC', name: 'Air Canada' },
  { iata: 'WS', name: 'WestJet' },

  // Europa
  { iata: 'AF', name: 'Air France' },
  { iata: 'KL', name: 'KLM' },
  { iata: 'IB', name: 'Iberia' },
  { iata: 'VY', name: 'Vueling' },
  { iata: 'LH', name: 'Lufthansa' },
  { iata: 'BA', name: 'British Airways' },
  { iata: 'AZ', name: 'ITA Airways' },
  { iata: 'TP', name: 'TAP Air Portugal' },
  { iata: 'LX', name: 'Swiss International' },
  { iata: 'OS', name: 'Austrian Airlines' },
  { iata: 'SN', name: 'Brussels Airlines' },
  { iata: 'SK', name: 'Scandinavian Airlines' },
  { iata: 'AY', name: 'Finnair' },
  { iata: 'FR', name: 'Ryanair' },
  { iata: 'U2', name: 'easyJet' },
  { iata: 'W6', name: 'Wizz Air' },

  // Medio Oriente / Asia
  { iata: 'EK', name: 'Emirates' },
  { iata: 'QR', name: 'Qatar Airways' },
  { iata: 'EY', name: 'Etihad Airways' },
  { iata: 'TK', name: 'Turkish Airlines' },
  { iata: 'SQ', name: 'Singapore Airlines' },
  { iata: 'CX', name: 'Cathay Pacific' },
  { iata: 'JL', name: 'Japan Airlines' },
  { iata: 'NH', name: 'ANA All Nippon Airways' },

  // África / Oceanía
  { iata: 'QF', name: 'Qantas' },
  { iata: 'NZ', name: 'Air New Zealand' },
  { iata: 'ET', name: 'Ethiopian Airlines' },
  { iata: 'SA', name: 'South African Airways' },
];

export default airlines;

/**
 * Devuelve la URL del logo de la aerolínea según su código IATA.
 * Usa el CDN de Aviasales (pics.avs.io) — gratuito, sin API key.
 * size: ancho x alto en px (el CDN acepta cualquier valor)
 */
export function getLogoUrl(iata, size = 100) {
  if (!iata) return null;
  return `https://pics.avs.io/${size}/${size}/${iata.toUpperCase()}.png`;
}
