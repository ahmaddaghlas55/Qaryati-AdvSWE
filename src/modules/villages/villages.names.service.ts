
import { NotFoundError } from '../../shared/errors/app-error';
import {
  VillageNamesRepository,
} from './villages.names.repository';

export class VillageNamesService {
  constructor(private readonly repository: VillageNamesRepository) {}

  async listCurrent(slug: string) {
    const names = await this.repository.findCurrentByVillageSlug(slug);

    if (names === null) {
      throw new NotFoundError('Village not found');
    }

    return { data: names };
  }

  async listHistory(slug: string) {
    const names = await this.repository.findHistoryByVillageSlug(slug);

    if (names === null) {
      throw new NotFoundError('Village not found');
    }

    return { data: names };
  }
}
