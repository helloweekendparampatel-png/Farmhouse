-- DropForeignKey
ALTER TABLE "Decoration" DROP CONSTRAINT "Decoration_farmId_fkey";

-- DropForeignKey
ALTER TABLE "Photography" DROP CONSTRAINT "Photography_farmId_fkey";

-- AddForeignKey
ALTER TABLE "Photography" ADD CONSTRAINT "Photography_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoration" ADD CONSTRAINT "Decoration_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
