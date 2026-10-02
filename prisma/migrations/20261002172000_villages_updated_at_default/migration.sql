ALTER TABLE "villages"
  ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "village_names"
  ALTER COLUMN "updated_at" SET DEFAULT now();
