import type { PetSize, Sex, Species } from './enums.js';

export const SPECIES_LABEL: Record<Species, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  OTRO: 'Otro',
};
export const SEX_LABEL: Record<Sex, string> = {
  MACHO: 'Macho',
  HEMBRA: 'Hembra',
  DESCONOCIDO: 'No sé',
};
export const SIZE_LABEL: Record<PetSize, string> = {
  CHICO: 'Chico',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

/** Fecha aproximada de nacimiento (YYYY-MM-DD) a partir de años y meses */
export function birthDateFromAge(years: number, months: number, today = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() - (years * 12 + months));
  return d.toISOString().slice(0, 10);
}

/** Edad en años y meses completos */
export function ageFromBirthDate(
  birthDate: string,
  today = new Date(),
): { years: number; months: number } {
  const b = new Date(`${birthDate}T00:00:00Z`);
  let total =
    (today.getUTCFullYear() - b.getUTCFullYear()) * 12 + (today.getUTCMonth() - b.getUTCMonth());
  if (today.getUTCDate() < b.getUTCDate()) total -= 1;
  total = Math.max(0, total);
  return { years: Math.floor(total / 12), months: total % 12 };
}

/** "2 años", "1 año y 3 meses", "5 meses", "Menos de un mes" */
export function ageLabel(birthDate: string, today = new Date()): string {
  const { years, months } = ageFromBirthDate(birthDate, today);
  const y = years === 1 ? '1 año' : `${years} años`;
  const m = months === 1 ? '1 mes' : `${months} meses`;
  if (years && months) return `${y} y ${m}`;
  if (years) return y;
  if (months) return m;
  return 'Menos de un mes';
}
