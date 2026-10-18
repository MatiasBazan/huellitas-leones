-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarMediaId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarMediaId_key" ON "User"("avatarMediaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

