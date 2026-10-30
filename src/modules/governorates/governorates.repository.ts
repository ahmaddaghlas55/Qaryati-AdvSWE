export interface Governorate {
  slug: string;
  nameAr: string;
  nameEn: string;
}

export interface GovernorateDetail extends Governorate {}

export interface VillageSummaryInGovernorate {
  slug: string;
  name: { ar: string | null; en: string | null };
  municipality: string | null;
  updatedAt: string;
}

export interface FindVillagesInGovernorateArgs {
  governorateSlug: string;
  skip: number;
  take: number;
  sort: 'slug' | 'updatedAt';
  order: 'asc' | 'desc';
}

export interface GovernorateRepository {
  findAll(): Promise<Governorate[]>;
  findBySlug(slug: string): Promise<GovernorateDetail | null>;
  findVillagesPage(args: FindVillagesInGovernorateArgs): Promise<{
    items: VillageSummaryInGovernorate[];
    totalItems: number;
  } | null>;
}