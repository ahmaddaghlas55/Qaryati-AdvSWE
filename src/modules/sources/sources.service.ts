
import { NotFoundError } from '../../shared/errors/app-error';
import { SourceDetail, SourcesRepository } from './sources.repository';
import { SourceListQuery } from './sources.schemas';

export class SourcesService {
  constructor(private readonly repository: SourcesRepository) {}

  async list(query: SourceListQuery) {
    const skip = (query.page - 1) * query.pageSize;

    const result = await this.repository.findPage({
      type: query.type,
      publicationYear: query.publicationYear,
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

  async getById(id: number): Promise<SourceDetail> {
    const source = await this.repository.findById(id);

    if (!source) {
      throw new NotFoundError('Source not found');
    }

    return source;
  }
}
