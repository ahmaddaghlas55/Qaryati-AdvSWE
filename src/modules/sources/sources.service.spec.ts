
import {
  SourceDetail,
  SourcesRepository,
  SourceSummary,
} from './sources.repository';
import { sourceListQuerySchema, sourceParamsSchema } from './sources.schemas';
import { SourcesService } from './sources.service';

const source: SourceSummary = {
  id: 1,
  title: 'Palestinian Villages',
  type: 'book',
  publicationYear: 2020,
  author: 'Test Author',
  updatedAt: '2026-10-24T00:00:00.000Z',
};

const detail: SourceDetail = {
  ...source,
  publisher: 'Test Publisher',
  url: 'https://example.com/source',
};

describe('SourcesService', () => {
  it('calculates pagination for the first page', async () => {
    let receivedArgs: Parameters<SourcesRepository['findPage']>[0] | undefined;

    const repository: SourcesRepository = {
      findPage: async (args) => {
        receivedArgs = args;
        return { items: [source], totalItems: 25 };
      },
      findById: async () => detail,
    };

    const result = await new SourcesService(repository).list({
      page: 1,
      pageSize: 10,
    });

    expect(receivedArgs).toEqual({
      type: undefined,
      publicationYear: undefined,
      skip: 0,
      take: 10,
    });

    expect(result.data).toEqual([source]);
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
    });
  });

  it('calculates pagination for the third page', async () => {
    let receivedArgs: Parameters<SourcesRepository['findPage']>[0] | undefined;

    const repository: SourcesRepository = {
      findPage: async (args) => {
        receivedArgs = args;
        return { items: [source], totalItems: 25 };
      },
      findById: async () => detail,
    };

    const result = await new SourcesService(repository).list({
      page: 3,
      pageSize: 10,
    });

    expect(receivedArgs?.skip).toBe(20);
    expect(receivedArgs?.take).toBe(10);
    expect(result.meta.totalPages).toBe(3);
  });

  it('passes type and publicationYear filters to the repository', async () => {
    let receivedArgs: Parameters<SourcesRepository['findPage']>[0] | undefined;

    const repository: SourcesRepository = {
      findPage: async (args) => {
        receivedArgs = args;
        return { items: [source], totalItems: 1 };
      },
      findById: async () => detail,
    };

    await new SourcesService(repository).list({
      page: 1,
      pageSize: 20,
      type: 'book',
      publicationYear: 2020,
    });

    expect(receivedArgs).toEqual({
      type: 'book',
      publicationYear: 2020,
      skip: 0,
      take: 20,
    });
  });

  it('returns zero total pages when there are no sources', async () => {
    const repository: SourcesRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findById: async () => null,
    };

    const result = await new SourcesService(repository).list({
      page: 1,
      pageSize: 20,
    });

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('returns one total page when all sources fit', async () => {
    const repository: SourcesRepository = {
      findPage: async () => ({ items: [source], totalItems: 1 }),
      findById: async () => null,
    };

    const result = await new SourcesService(repository).list({
      page: 1,
      pageSize: 20,
    });

    expect(result.meta.totalPages).toBe(1);
  });

  it('returns two total pages when needed', async () => {
    const repository: SourcesRepository = {
      findPage: async () => ({ items: [source], totalItems: 21 }),
      findById: async () => null,
    };

    const result = await new SourcesService(repository).list({
      page: 1,
      pageSize: 20,
    });

    expect(result.meta.totalPages).toBe(2);
  });

  it('returns source details by ID', async () => {
    const repository: SourcesRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findById: async (id) => {
        expect(id).toBe(1);
        return detail;
      },
    };

    await expectAsync(new SourcesService(repository).getById(1))
      .toBeResolvedTo(detail);
  });

  it('throws NotFoundError when a source is missing', async () => {
    const repository: SourcesRepository = {
      findPage: async () => ({ items: [], totalItems: 0 }),
      findById: async () => null,
    };

    await expectAsync(new SourcesService(repository).getById(999))
      .toBeRejectedWithError('Source not found');
  });
});

describe('source schemas', () => {
  it('applies default pagination values', () => {
    expect(sourceListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('rejects invalid pagination values', () => {
    expect(sourceListQuerySchema.safeParse({ page: 0 }).success).toBeFalse();
    expect(sourceListQuerySchema.safeParse({ pageSize: 101 }).success).toBeFalse();
  });

  it('rejects invalid source IDs', () => {
    expect(sourceParamsSchema.safeParse({ id: 'abc' }).success).toBeFalse();
    expect(sourceParamsSchema.safeParse({ id: '-1' }).success).toBeFalse();
    expect(sourceParamsSchema.safeParse({ id: '0' }).success).toBeFalse();
  });

  it('accepts valid source IDs', () => {
    expect(sourceParamsSchema.parse({ id: '5' })).toEqual({ id: 5 });
  });

  it('validates publicationYear boundaries', () => {
    expect(
      sourceListQuerySchema.safeParse({ publicationYear: 1799 }).success
    ).toBeFalse();

    expect(
      sourceListQuerySchema.safeParse({
        publicationYear: new Date().getFullYear() + 1,
      }).success
    ).toBeFalse();

    expect(
      sourceListQuerySchema.safeParse({ publicationYear: 2020 }).success
    ).toBeTrue();
  });
});
