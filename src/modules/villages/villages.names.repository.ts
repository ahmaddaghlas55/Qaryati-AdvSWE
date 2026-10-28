
export interface VillageNameItem {
  id: number;
  language: string;
  type: string;
  value: string;
  isCurrent: boolean;
  validFrom: string | null;
  validTo: string | null;
  meaningOrOrigin: string | null;
}

export interface VillageNamesRepository {
  // null: village not found or not verified.
  // []: village exists but has no matching names.
  findCurrentByVillageSlug(
    slug: string
  ): Promise<VillageNameItem[] | null>;

  findHistoryByVillageSlug(
    slug: string
  ): Promise<VillageNameItem[] | null>;
}
