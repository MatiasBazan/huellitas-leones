import { ageFromBirthDate, ageLabel, birthDateFromAge } from '@huellitas/shared';

describe('edad de mascotas', () => {
  const today = new Date('2026-10-18T12:00:00Z');

  it('calcula la fecha aproximada desde años y meses', () => {
    expect(birthDateFromAge(2, 0, today)).toBe('2024-10-01');
    expect(birthDateFromAge(0, 14, today)).toBe('2025-08-01');
  });

  it('vuelve a años y meses sin perder datos', () => {
    expect(ageFromBirthDate(birthDateFromAge(3, 7, today), today)).toEqual({ years: 3, months: 7 });
  });

  it('arma la etiqueta en castellano', () => {
    expect(ageLabel('2024-10-01', today)).toBe('2 años');
    expect(ageLabel('2025-07-01', today)).toBe('1 año y 3 meses');
    expect(ageLabel('2026-09-01', today)).toBe('1 mes');
    expect(ageLabel('2026-10-10', today)).toBe('Menos de un mes');
  });
});
