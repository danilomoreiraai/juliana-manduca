import { z } from 'zod';

export const helenaBodyIds = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;

const angleSchema = z.number().min(0).lt(360);
const bodyIdSchema = z.enum(helenaBodyIds);

export const helenaNatalInputSchema = z.strictObject({
  date: z.iso.date().refine((value) => {
    const year = Number(value.slice(0, 4));
    return year >= 1600 && year <= 2399;
  }, 'Use uma data entre 1600 e 2399'),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Informe uma hora válida'),
  utcOffsetMinutes: z.number().int().min(-840).max(840),
  latitude: z.number().gt(-90).lt(90),
  longitude: z.number().min(-180).max(180),
  houseSystem: z.enum(['P', 'K', 'E', 'W']),
  zodiac: z.enum(['tropical', 'lahiri', 'fagan_bradley']),
});

const bodySchema = z.strictObject({
  id: bodyIdSchema,
  longitude: angleSchema,
  latitude: z.number().min(-90).max(90),
  speed: z.number(),
  retrograde: z.boolean(),
  house: z.number().int().min(1).max(12),
});

const aspectSchema = z.strictObject({
  bodyA: bodyIdSchema,
  bodyB: bodyIdSchema,
  type: z.enum(['conjunction', 'sextile', 'square', 'trine', 'opposition']),
  angle: z.union([z.literal(0), z.literal(60), z.literal(90), z.literal(120), z.literal(180)]),
  orb: z.number().min(0).max(8),
  phase: z.enum(['applying', 'separating', 'exact']),
});

export const helenaNatalResultSchema = z.strictObject({
  protocol: z.literal('helena.natal.v1'),
  engine: z.strictObject({
    name: z.literal('Swiss Ephemeris'),
    version: z.string().min(1).max(40),
    bindingVersion: z.literal('2.10.3.6'),
  }),
  ephemeris: z.literal('moshier'),
  input: helenaNatalInputSchema,
  julianDayUt: z.number(),
  ayanamsa: angleSchema,
  ascendant: angleSchema,
  midheaven: angleSchema,
  bodies: z
    .array(bodySchema)
    .length(10)
    .refine(
      (bodies) => new Set(bodies.map((body) => body.id)).size === 10,
      'O resultado precisa conter os dez corpos distintos',
    ),
  houses: z.array(angleSchema).length(12),
  aspects: z.array(aspectSchema).max(45),
});

export type HelenaNatalInput = z.infer<typeof helenaNatalInputSchema>;
export type HelenaNatalResult = z.infer<typeof helenaNatalResultSchema>;
export type HelenaBodyId = (typeof helenaBodyIds)[number];
