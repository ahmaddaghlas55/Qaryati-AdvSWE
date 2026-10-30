import {
  Governorate,
  GovernorateRepository,
  VillageSummaryInGovernorate,
} from './governorates.repository';
import {
  governorateParamsSchema,
  governorateVillagesQuerySchema,
} from './governorates.schemas';
import { GovernorateService } from './governorates.service';

describe('GovernorateService', () => {
  it('returns all governorates from the repository', async () => {
    const fakeData: Governorate[] = [
      { slug: 'nablus', nameAr: 'نابلس', nameEn: 'Nablus' },
      { slug: 'jenin', nameAr: 'جنين', nameEn: 'Jenin' },
    ];
    const repository: GovernorateRepository = {
      findAll: async () => fakeData,
      findBySlug: async () => null,
      findVillagesPage: async () => null,
    };
    const service = new GovernorateService(repository);

    const result = await service.listAll();

    expect(result).toEqual(fakeData);
  });

  it('returns a governorate by slug', async () => {
    const governorate = { slug: 'nablus', nameAr: 'نابلس', nameEn: 'Nablus' };
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => governorate,
      findVillagesPage: async () => ({ items: [], totalItems: 0 }),
    };

    await expectAsync(new GovernorateService(repository).getBySlug('nablus'))
      .toBeResolvedTo(governorate);
  });

  it('throws NotFoundError when a governorate is missing', async () => {
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async () => null,
    };

    await expectAsync(new GovernorateService(repository).getBySlug('atlantis'))
      .toBeRejectedWithError('Governorate not found');
  });

  const village: VillageSummaryInGovernorate = {
    slug: 'beita',
    name: { ar: 'بيتا', en: 'Beita' },
    municipality: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('computes skip and take for page 1', async () => {
    let received: Parameters<GovernorateRepository['findVillagesPage']>[0] | undefined;
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async (args) => {
        received = args;
        return { items: [village], totalItems: 1 };
      },
    };

    await new GovernorateService(repository).listVillages('nablus', {
      page: 1,
      pageSize: 20,
      sort: 'slug',
      order: 'asc',
    });

    expect(received).toEqual({
      governorateSlug: 'nablus',
      skip: 0,
      take: 20,
      sort: 'slug',
      order: 'asc',
    });
  });

  it('computes skip and take for page 3', async () => {
    let received: Parameters<GovernorateRepository['findVillagesPage']>[0] | undefined;
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async (args) => {
        received = args;
        return { items: [], totalItems: 0 };
      },
    };

    await new GovernorateService(repository).listVillages('nablus', {
      page: 3,
      pageSize: 10,
      sort: 'updatedAt',
      order: 'desc',
    });

    expect(received?.skip).toBe(20);
    expect(received?.take).toBe(10);
  });

  it('calculates total pages for empty, one, and twenty-one items', async () => {
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async () => ({ items: [], totalItems: 0 }),
    };
    const service = new GovernorateService(repository);

    expect((await service.listVillages('nablus', {
      page: 1, pageSize: 20, sort: 'slug', order: 'asc',
    })).meta.totalPages).toBe(0);

    repository.findVillagesPage = async () => ({ items: [village], totalItems: 1 });
    expect((await service.listVillages('nablus', {
      page: 1, pageSize: 20, sort: 'slug', order: 'asc',
    })).meta.totalPages).toBe(1);

    repository.findVillagesPage = async () => ({ items: [village], totalItems: 21 });
    expect((await service.listVillages('nablus', {
      page: 1, pageSize: 20, sort: 'slug', order: 'asc',
    })).meta.totalPages).toBe(2);
  });

  it('throws NotFoundError when listing villages for a missing governorate', async () => {
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async () => null,
    };

    await expectAsync(new GovernorateService(repository).listVillages('atlantis', {
      page: 1, pageSize: 20, sort: 'slug', order: 'asc',
    })).toBeRejectedWithError('Governorate not found');
  });

  it('returns empty data when a governorate has no verified villages', async () => {
    const repository: GovernorateRepository = {
      findAll: async () => [],
      findBySlug: async () => null,
      findVillagesPage: async () => ({ items: [], totalItems: 0 }),
    };

    await expectAsync(new GovernorateService(repository).listVillages('nablus', {
      page: 1, pageSize: 20, sort: 'slug', order: 'asc',
    })).toBeResolvedTo({
      data: [],
      meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    });
  });

  it('validates governorate slugs and village list queries', () => {
    expect(governorateParamsSchema.safeParse({ slug: 'nablus' }).success).toBeTrue();
    expect(governorateParamsSchema.safeParse({ slug: 'Bad_Slug' }).success).toBeFalse();
    expect(governorateParamsSchema.safeParse({ slug: 'UPPERCASE' }).success).toBeFalse();
    expect(governorateParamsSchema.safeParse({ slug: 'a'.repeat(101) }).success).toBeFalse();
    expect(governorateVillagesQuerySchema.safeParse({ pageSize: 101 }).success).toBeFalse();
    expect(governorateVillagesQuerySchema.safeParse({ page: 0 }).success).toBeFalse();
    expect(governorateVillagesQuerySchema.safeParse({ sort: 'name' }).success).toBeFalse();
  });
});
