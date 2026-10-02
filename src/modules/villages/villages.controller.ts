import { Request, Response } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/errors/app-error';
import { VillageService } from './villages.service';
import { villageListQuerySchema, villageParamsSchema } from './villages.schemas';

export class VillageController {
  constructor(private readonly service: VillageService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const parsed = villageListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Request validation failed', this.validationDetails(parsed.error));
    }
    const result = await this.service.list(parsed.data);
    res.status(200).json(result);
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const parsed = villageParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Request validation failed', this.validationDetails(parsed.error));
    }
    const village = await this.service.getBySlug(parsed.data.slug);
    res.status(200).json({ data: village });
  };

  private validationDetails(error: z.ZodError) {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      issue: issue.message,
    }));
  }
}
