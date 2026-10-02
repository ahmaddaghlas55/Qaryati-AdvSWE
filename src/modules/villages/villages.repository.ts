export interface VillageSummary {
  slug: string;
  name: {
    ar: string | null;
    en: string | null;
  };
  governorate: {
    slug: string;
    nameAr: string;
    nameEn: string;
  };
  municipality: string | null;
  updatedAt: string;
}

export interface VillageDetail extends VillageSummary {
  overview: string | null;
  elevationM: number | null;
  areaKm2: number | null;
}

export interface VillagePageQuery {
  status: string;
  governorateSlug?: string;
  sort: 'slug' | 'updatedAt';
  order: 'asc' | 'desc';
  skip: number;
  take: number;
}

export interface VillageRepository {
  findPage(query: VillagePageQuery): Promise<{
    items: VillageSummary[];
    totalItems: number;
  }>;
  findBySlug(slug: string, status: string): Promise<VillageDetail | null>;
}
