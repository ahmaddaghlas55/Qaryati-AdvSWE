-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sources" DROP CONSTRAINT "sources_created_by_fkey";

-- DropForeignKey
ALTER TABLE "village_names" DROP CONSTRAINT "village_names_created_by_fkey";

-- DropForeignKey
ALTER TABLE "village_names" DROP CONSTRAINT "village_names_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "village_names" DROP CONSTRAINT "village_names_source_id_fkey";

-- DropForeignKey
ALTER TABLE "village_names" DROP CONSTRAINT "village_names_supersedes_id_fkey";

-- DropForeignKey
ALTER TABLE "village_names" DROP CONSTRAINT "village_names_village_id_fkey";

-- DropForeignKey
ALTER TABLE "villages" DROP CONSTRAINT "villages_created_by_fkey";

-- DropForeignKey
ALTER TABLE "villages" DROP CONSTRAINT "villages_governorate_id_fkey";

-- DropForeignKey
ALTER TABLE "villages" DROP CONSTRAINT "villages_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "villages" DROP CONSTRAINT "villages_source_id_fkey";

-- DropForeignKey
ALTER TABLE "villages" DROP CONSTRAINT "villages_supersedes_id_fkey";

-- AlterTable
ALTER TABLE "village_names" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "villages" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_names" ADD CONSTRAINT "village_names_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_names" ADD CONSTRAINT "village_names_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "village_names"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_names" ADD CONSTRAINT "village_names_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_names" ADD CONSTRAINT "village_names_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_names" ADD CONSTRAINT "village_names_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
