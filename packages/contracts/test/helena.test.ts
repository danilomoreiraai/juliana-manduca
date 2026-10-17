import { describe, expect, it } from 'vitest';
import * as contracts from '../src/index.js';
import fixture from './fixtures/helena-j2000.json' with { type: 'json' };

const input = {
  date: '2000-01-01',
  time: '12:00:00',
  utcOffsetMinutes: 0,
  latitude: -23.5505,
  longitude: -46.6333,
  houseSystem: 'P',
  zodiac: 'tropical',
};

describe('HELENA natal contracts', () => {
  it('exports validated input and result schemas', () => {
    expect(contracts).toHaveProperty('helenaNatalInputSchema');
    expect(contracts).toHaveProperty('helenaNatalResultSchema');
  });

  it('accepts explicit fractional UTC offsets and leap days', () => {
    const schema = Reflect.get(contracts, 'helenaNatalInputSchema');
    expect(schema.safeParse({ ...input, date: '2000-02-29', utcOffsetMinutes: 345 }).success).toBe(
      true,
    );
  });

  it.each([
    { date: '1900-02-29' },
    { date: '2001-04-31' },
    { date: '1599-12-31' },
    { date: '2400-01-01' },
    { time: '24:00' },
    { time: '12:60:00' },
    { utcOffsetMinutes: 841 },
    { utcOffsetMinutes: 330.5 },
    { latitude: 90 },
    { latitude: Number.NaN },
    { longitude: Number.POSITIVE_INFINITY },
    { longitude: -181 },
    { houseSystem: 'unsupported' },
    { zodiac: 'unsupported' },
    { token: 'unexpected' },
  ])('rejects invalid or unsupported input %j', (patch) => {
    const schema = Reflect.get(contracts, 'helenaNatalInputSchema');
    expect(schema.safeParse({ ...input, ...patch }).success).toBe(false);
  });

  it('accepts a complete synthetic result from the pinned real engine', () => {
    expect(contracts.helenaNatalResultSchema.safeParse(fixture).success).toBe(true);
  });

  it.each([
    { protocol: 'other' },
    { ephemeris: 'unknown' },
    { julianDayUt: Number.NaN },
    { ayanamsa: -1 },
    { ascendant: 360 },
    { midheaven: Number.POSITIVE_INFINITY },
    { houses: fixture.houses.slice(1) },
    { bodies: fixture.bodies.slice(1) },
    { bodies: fixture.bodies.map(() => fixture.bodies[0]) },
    { engine: { ...fixture.engine, bindingVersion: 'different' } },
  ])('rejects incomplete or unsupported numerical output %j', (patch) => {
    expect(contracts.helenaNatalResultSchema.safeParse({ ...fixture, ...patch }).success).toBe(
      false,
    );
  });
});
