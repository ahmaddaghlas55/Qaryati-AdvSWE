
import { VillageNameItem, VillageNamesRepository } from './villages.names.repository';
import { villageNamesParamsSchema } from './villages.names.schemas';
import { VillageNamesService } from './villages.names.service';

const name: VillageNameItem = {
  id: 1,
  language: 'ar',
  type: 'official',
  value: 'بيتا',
  isCurrent: true,
  validFrom: null,
  validTo: null,
  meaningOrOrigin: null,
};

describe('VillageNamesService', () => {
  it('returns current names for the correct slug', async () => {
    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async (slug) => {
        expect(slug).toBe('beita');
        return [name];
      },
      findHistoryByVillageSlug: async () => [],
    };

    const result = await new VillageNamesService(repository).listCurrent('beita');
    expect(result).toEqual({ data: [name] });
  });

  it('returns empty data when a village has no current names', async () => {
    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async () => [],
      findHistoryByVillageSlug: async () => [],
    };

    const result = await new VillageNamesService(repository).listCurrent('beita');
    expect(result).toEqual({ data: [] });
  });

  it('throws NotFoundError when the village is missing from current names', async () => {
    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async () => null,
      findHistoryByVillageSlug: async () => [],
    };

    await expectAsync(
      new VillageNamesService(repository).listCurrent('missing')
    ).toBeRejectedWithError('Village not found');
  });

  it('returns name history for the correct slug', async () => {
    const historicalName: VillageNameItem = {
      ...name,
      id: 2,
      value: 'Old Beita',
      type: 'historical',
      isCurrent: false,
      validFrom: '1900',
      validTo: '1950',
    };

    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async () => [],
      findHistoryByVillageSlug: async (slug) => {
        expect(slug).toBe('beita');
        return [historicalName, name];
      },
    };

    const result = await new VillageNamesService(repository).listHistory('beita');
    expect(result).toEqual({ data: [historicalName, name] });
  });

  it('returns empty data when a village has no name history', async () => {
    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async () => [],
      findHistoryByVillageSlug: async () => [],
    };

    const result = await new VillageNamesService(repository).listHistory('beita');
    expect(result).toEqual({ data: [] });
  });

  it('throws NotFoundError when the village is missing from history', async () => {
    const repository: VillageNamesRepository = {
      findCurrentByVillageSlug: async () => [],
      findHistoryByVillageSlug: async () => null,
    };

    await expectAsync(
      new VillageNamesService(repository).listHistory('missing')
    ).toBeRejectedWithError('Village not found');
  });
});

describe('village names schemas', () => {
  it('accepts a valid slug', () => {
    expect(villageNamesParamsSchema.safeParse({ slug: 'beita' }).success).toBeTrue();
    expect(villageNamesParamsSchema.safeParse({ slug: 'village-123' }).success).toBeTrue();
  });

  it('rejects invalid slugs', () => {
    expect(villageNamesParamsSchema.safeParse({ slug: 'Bad_Slug' }).success).toBeFalse();
    expect(villageNamesParamsSchema.safeParse({ slug: 'UPPERCASE' }).success).toBeFalse();
    expect(villageNamesParamsSchema.safeParse({ slug: 'a'.repeat(101) }).success).toBeFalse();
  });
});
