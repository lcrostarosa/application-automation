-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "needsFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextMessageGenerated" BOOLEAN NOT NULL DEFAULT false;
