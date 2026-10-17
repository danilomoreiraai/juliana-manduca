import type { HelenaBodyId } from '@juliana/contracts';

export const bodies: Record<HelenaBodyId, [string, string]> = {
  sun: ['Sol', '☉'],
  moon: ['Lua', '☽'],
  mercury: ['Mercúrio', '☿'],
  venus: ['Vênus', '♀'],
  mars: ['Marte', '♂'],
  jupiter: ['Júpiter', '♃'],
  saturn: ['Saturno', '♄'],
  uranus: ['Urano', '♅'],
  neptune: ['Netuno', '♆'],
  pluto: ['Plutão', '♇'],
};
const signs = [
  'Áries',
  'Touro',
  'Gêmeos',
  'Câncer',
  'Leão',
  'Virgem',
  'Libra',
  'Escorpião',
  'Sagitário',
  'Capricórnio',
  'Aquário',
  'Peixes',
];
export const glyphs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
export const position = (angle: number) => {
  const minutes = Math.round(angle * 60) % 21600;
  return `${Math.floor((minutes % 1800) / 60)}°${String(minutes % 60).padStart(2, '0')}′ ${signs[Math.floor(minutes / 1800)]}`;
};
