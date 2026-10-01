export interface Governorate {
  slug: string;
  nameAr: string;
  nameEn: string;
}

export interface GovernorateRepository {
  findAll(): Promise<Governorate[]>;
}