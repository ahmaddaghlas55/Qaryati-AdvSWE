
import { Request, Response } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/errors/app-error';
import { SourcesService } from './sources.service';
import { sourceListQuerySchema, sourceParamsSchema } from './sources.schemas';

export class SourcesController {
  constructor(private readonly service: SourcesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const parsed = sourceListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ValidationError(
        'Request validation failed',
        this.validationDetails(parsed.error)
      );
    }

    const result = await this.service.list(parsed.data);
    res.status(200).json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const parsed = sourceParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new ValidationError(
        'Request validation failed',
        this.validationDetails(parsed.error)
      );
    }

    const source = await this.service.getById(parsed.data.id);
    res.status(200).json({ data: source });
  };

  private validationDetails(error: z.ZodError) {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      issue: issue.message,
    }));
  }
}
