import {
  VillageDetail,
  VillageRepository,
  VillageSummary,
} from './villages.repository';
import { villageListQuerySchema, villageParamsSchema } from './villages.schemas';
import { PUBLIC_VILLAGE_STATUS, VillageService } from './villages.service';

const village: VillageSummary = {
  slug: 'fake-village',
  name: { ar: 'قرية وهمية', en: 'Fake Village' },
  governorate: { slug: 'nablus', nameAr: 'نابلس', nameEn: 'Nablus' },
  municipality: null,
  updatedAt: '2026-10-02T00:00:00.000Z',
};

const detail: VillageDetail = {
  ...village,
  overview: null,
  elevationM: null,
  areaKm2: null,
};

describe('VillageService', () => {
  it('always requests verified villages and calculates pagination', async () => {
    let receivedQuery: Parameters<VillageRepository['findPage']>[0] | undefined;
    const repository: VillageRepository = {
      findPage: async (query) => {
        receivedQuery = query;
        return { items: [village], totalItems: 21 };
      },
      findBySlug: async () => detail,
    };

    const result = await new VillageService(repository).list({
      page: 2,
      pageSize: 10,
      sort: 'slug',
      order: 'asc',
    });

    expect(receivedQuery).toEqual({
      status: PUBLIC_VILLAGE_STATUS,
      governorateSlug: undefined,
      sort: 'slug',
      order: 'asc',
      skip: 10,
      take: 10,
    });
    expect(result.meta).toEqual({
      page: 2,
      pageSize: 10,
      totalItems: 21,
      totalPages: 3,
    });
  });

  it('returns zero total pages when there are no items', async () => {
    const repository: VillageRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findBySlug: async () => null,
    };

    const result = await new VillageService(repository).list({
      page: 1,
      pageSize: 20,
      sort: 'slug',
      order: 'asc',
    });

    expect(result.meta.totalPages).toBe(0);
  });

  it('returns a village by slug', async () => {
    const repository: VillageRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findBySlug: async (slug, status) => {
        expect(slug).toBe('fake-village');
        expect(status).toBe(PUBLIC_VILLAGE_STATUS);
        return detail;
      },
    };

    await expectAsync(new VillageService(repository).getBySlug('fake-village'))
      .toBeResolvedTo(detail);
  });

  it('throws NotFoundError when a village is missing', async () => {
    const repository: VillageRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findBySlug: async () => null,
    };

    await expectAsync(new VillageService(repository).getBySlug('missing'))
      .toBeRejectedWithError('Village not found');
  });
});

describe('village schemas', () => {
  it('applies list defaults', () => {
    expect(villageListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: 'slug',
      order: 'asc',
    });
  });

  it('rejects invalid pagination and sort values', () => {
    expect(villageListQuerySchema.safeParse({ page: 0 }).success).toBeFalse();
    expect(villageListQuerySchema.safeParse({ pageSize: 101 }).success).toBeFalse();
    expect(villageListQuerySchema.safeParse({ sort: 'name' }).success).toBeFalse();
  });

  it('rejects a bad slug', () => {
    expect(villageParamsSchema.safeParse({ slug: 'Bad Slug' }).success).toBeFalse();
  });
});
