-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "hasReply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inReplyTo" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "replyDate" TIMESTAMP(3),
ADD COLUMN     "threadId" TEXT;

-- CreateTable
CREATE TABLE "EmailReply" (
    "id" SERIAL NOT NULL,
    "originalMessageId" TEXT NOT NULL,
    "replyMessageId" TEXT NOT NULL,
    "contactId" INTEGER NOT NULL,
    "replyContent" TEXT NOT NULL,
    "replyDate" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailReply_pkey" PRIMARY KEY ("id")
);
