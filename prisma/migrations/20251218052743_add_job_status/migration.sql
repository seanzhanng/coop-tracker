/*
  Warnings:

  - You are about to drop the column `applied` on the `Job` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'APPLIED', 'INTERVIEWING', 'REJECTED', 'OFFER');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "applied",
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'OPEN';
