
import { Request, Response } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/errors/app-error';
import { VillageNamesService } from './villages.names.service';
import { villageNamesParamsSchema } from './villages.names.schemas';

export class VillageNamesController {
  constructor(private readonly service: VillageNamesService) {}

  listCurrent = async (req: Request, res: Response): Promise<void> => {
    const parsed = villageNamesParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new ValidationError(
        'Request validation failed',
        this.validationDetails(parsed.error)
      );
    }

    const result = await this.service.listCurrent(parsed.data.slug);
    res.status(200).json(result);
  };

  listHistory = async (req: Request, res: Response): Promise<void> => {
    const parsed = villageNamesParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new ValidationError(
        'Request validation failed',
        this.validationDetails(parsed.error)
      );
    }

    const result = await this.service.listHistory(parsed.data.slug);
    res.status(200).json(result);
  };

  private validationDetails(error: z.ZodError) {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      issue: issue.message,
    }));
  }
}
