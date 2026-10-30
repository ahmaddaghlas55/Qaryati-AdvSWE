import { NotFoundError } from '../../shared/errors/app-error';
import { Governorate, GovernorateDetail, GovernorateRepository } from './governorates.repository';
import { GovernorateVillagesQuery } from './governorates.schemas';

// Public governorate village results follow the verified-only policy from villages.service.ts.
export const PUBLIC_STATUS = 'verified';

export class GovernorateService {
  constructor(private readonly repository: GovernorateRepository) {}

  async listAll(): Promise<Governorate[]> {
    return this.repository.findAll();
  }

  async getBySlug(slug: string): Promise<GovernorateDetail> {
    const governorate = await this.repository.findBySlug(slug);
    if (!governorate) {
      throw new NotFoundError('Governorate not found');
    }
    return governorate;
  }

  async listVillages(slug: string, query: GovernorateVillagesQuery) {
    const result = await this.repository.findVillagesPage({
      governorateSlug: slug,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      sort: query.sort,
      order: query.order,
    });

    if (!result) {
      throw new NotFoundError('Governorate not found');
    }

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
}