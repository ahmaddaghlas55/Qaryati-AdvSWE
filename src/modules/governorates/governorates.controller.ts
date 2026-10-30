import { Request, Response } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/errors/app-error';
import { GovernorateService } from './governorates.service';
import { governorateParamsSchema, governorateVillagesQuerySchema } from './governorates.schemas';

export class GovernorateController {
  constructor(private readonly service: GovernorateService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const governorates = await this.service.listAll();
    res.status(200).json({ data: governorates });
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const parsed = governorateParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Request validation failed', this.validationDetails(parsed.error));
    }
    const governorate = await this.service.getBySlug(parsed.data.slug);
    res.status(200).json({ data: governorate });
  };

  listVillages = async (req: Request, res: Response): Promise<void> => {
    const params = governorateParamsSchema.safeParse(req.params);
    const query = governorateVillagesQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      const details = [
        ...(params.success ? [] : this.validationDetails(params.error)),
        ...(query.success ? [] : this.validationDetails(query.error)),
      ];
      throw new ValidationError('Request validation failed', details);
    }
    const result = await this.service.listVillages(params.data.slug, query.data);
    res.status(200).json(result);
  };

  private validationDetails(error: z.ZodError) {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      issue: issue.message,
    }));
  }
}