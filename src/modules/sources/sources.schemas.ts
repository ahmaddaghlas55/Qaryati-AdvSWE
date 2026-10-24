
import { z } from 'zod';

export const sourceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().max(50).optional(),
  publicationYear: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
});

export const sourceParamsSchema = z.object({
  id: z.coerce.number().int().positive().safe(),
});

export type SourceListQuery = z.infer<typeof sourceListQuerySchema>;
export type SourceParams = z.infer<typeof sourceParamsSchema>;
