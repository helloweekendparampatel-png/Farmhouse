/*
  Warnings:

  - The values [OWNER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "capacity" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "discount" TEXT,
ADD COLUMN     "facilities" TEXT[],
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalPrice" TEXT,
ADD COLUMN     "price" TEXT,
ADD COLUMN     "pricing" JSONB,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviews" INTEGER,
ADD COLUMN     "rules" TEXT[],
ADD COLUMN     "weekdayPrice" TEXT,
ADD COLUMN     "weekendPrice" TEXT;
