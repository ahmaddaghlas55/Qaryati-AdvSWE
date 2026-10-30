import { z } from 'zod';

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);

export const governorateParamsSchema = z.object({
  slug: slugSchema,
});

export const governorateVillagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['slug', 'updatedAt']).default('slug'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type GovernorateParams = z.infer<typeof governorateParamsSchema>;
export type GovernorateVillagesQuery = z.infer<typeof governorateVillagesQuerySchema>;
