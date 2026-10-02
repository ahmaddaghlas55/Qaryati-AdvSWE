import { z } from 'zod';

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);

export const villageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  governorate: slugSchema.optional(),
  sort: z.enum(['slug', 'updatedAt']).default('slug'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const villageParamsSchema = z.object({
  slug: slugSchema,
});

export type VillageListQuery = z.infer<typeof villageListQuerySchema>;
export type VillageParams = z.infer<typeof villageParamsSchema>;
