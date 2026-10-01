import { Governorate, GovernorateRepository } from './governorates.repository';

export class GovernorateService {
  constructor(private readonly repository: GovernorateRepository) {}

  async listAll(): Promise<Governorate[]> {
    return this.repository.findAll();
  }
}