/*
  Warnings:

  - You are about to drop the column `age` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `ageMinutes` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeenAt` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "age",
DROP COLUMN "ageMinutes",
DROP COLUMN "lastSeenAt";
