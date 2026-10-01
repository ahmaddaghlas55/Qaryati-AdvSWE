import { Governorate, GovernorateRepository } from './governorates.repository';
import { GovernorateService } from './governorates.service';

describe('GovernorateService', () => {
  it('returns all governorates from the repository', async () => {
    const fakeData: Governorate[] = [
      { slug: 'nablus', nameAr: 'نابلس', nameEn: 'Nablus' },
      { slug: 'jenin', nameAr: 'جنين', nameEn: 'Jenin' },
    ];
    const repository: GovernorateRepository = { findAll: async () => fakeData };
    const service = new GovernorateService(repository);

    const result = await service.listAll();

    expect(result).toEqual(fakeData);
  });
});
