import { Request, Response } from 'express';

import { GovernorateService } from './governorates.service';

export class GovernorateController {
  constructor(private readonly service: GovernorateService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const governorates = await this.service.listAll();
    res.status(200).json({ data: governorates });
  };
}