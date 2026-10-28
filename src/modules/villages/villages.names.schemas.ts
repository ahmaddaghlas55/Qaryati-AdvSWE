
import { villageParamsSchema } from './villages.schemas';

export const villageNamesParamsSchema = villageParamsSchema;

export type VillageNamesParams = {
  slug: string;
};
