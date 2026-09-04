/*
  Warnings:

  - You are about to drop the column `winnerCardId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `winnerEntryId` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_winnerCardId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_winnerEntryId_fkey";

-- DropIndex
DROP INDEX "Game_winnerCardId_key";

-- DropIndex
DROP INDEX "Game_winnerEntryId_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "winnerCardId",
DROP COLUMN "winnerEntryId",
ADD COLUMN     "winnerCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "winnerEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
