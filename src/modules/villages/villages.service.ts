import { NotFoundError } from '../../shared/errors/app-error';
import { VillageDetail, VillageRepository } from './villages.repository';
import { VillageListQuery } from './villages.schemas';

// TODO: Authenticated reviewers will be able to request other statuses.
export const PUBLIC_VILLAGE_STATUS = 'verified';

export class VillageService {
  constructor(private readonly repository: VillageRepository) {}

  async list(query: VillageListQuery) {
    const skip = (query.page - 1) * query.pageSize;
    const result = await this.repository.findPage({
      status: PUBLIC_VILLAGE_STATUS,
      governorateSlug: query.governorate,
      sort: query.sort,
      order: query.order,
      skip,
      take: query.pageSize,
    });

    return {
      data: result.items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
    };
  }

  async getBySlug(slug: string): Promise<VillageDetail> {
    const village = await this.repository.findBySlug(slug, PUBLIC_VILLAGE_STATUS);
    if (!village) {
      throw new NotFoundError('Village not found');
    }
    return village;
  }
}
