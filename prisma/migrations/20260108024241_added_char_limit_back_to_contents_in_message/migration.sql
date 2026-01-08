/*
  Warnings:

  - You are about to alter the column `contents` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5000)`.

*/
-- DropForeignKey
ALTER TABLE "EmailReply" DROP CONSTRAINT "EmailReply_sequenceId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sequenceId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "contents" SET DATA TYPE VARCHAR(5000);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailReply" ADD CONSTRAINT "EmailReply_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
