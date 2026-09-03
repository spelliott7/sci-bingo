-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('BINGO', 'PICK3');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER,
    "name" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "venue" TEXT,
    "showDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayedSong" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayedSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'DRAFT',
    "entryFee" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "winnerCardId" TEXT,
    "winnerEntryId" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameShow" (
    "gameId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,

    CONSTRAINT "GameShow_pkey" PRIMARY KEY ("gameId","showId")
);

-- CreateTable
CREATE TABLE "BingoCard" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BingoCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardSquare" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "songId" INTEGER,

    CONSTRAINT "CardSquare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick3Entry" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pick3Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick3Pick" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,

    CONSTRAINT "Pick3Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountDue" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Song_sourceId_key" ON "Song"("sourceId");

-- CreateIndex
CREATE INDEX "Song_name_idx" ON "Song"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayedSong_showId_songId_key" ON "PlayedSong"("showId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_winnerCardId_key" ON "Game"("winnerCardId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_winnerEntryId_key" ON "Game"("winnerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "BingoCard_gameId_userId_key" ON "BingoCard"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardSquare_cardId_position_key" ON "CardSquare"("cardId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Pick3Entry_gameId_userId_key" ON "Pick3Entry"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick3Pick_entryId_songId_key" ON "Pick3Pick"("entryId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gameId_userId_key" ON "Payment"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "PlayedSong" ADD CONSTRAINT "PlayedSong_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayedSong" ADD CONSTRAINT "PlayedSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerCardId_fkey" FOREIGN KEY ("winnerCardId") REFERENCES "BingoCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "Pick3Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameShow" ADD CONSTRAINT "GameShow_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameShow" ADD CONSTRAINT "GameShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BingoCard" ADD CONSTRAINT "BingoCard_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BingoCard" ADD CONSTRAINT "BingoCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardSquare" ADD CONSTRAINT "CardSquare_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "BingoCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardSquare" ADD CONSTRAINT "CardSquare_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick3Entry" ADD CONSTRAINT "Pick3Entry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick3Entry" ADD CONSTRAINT "Pick3Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick3Pick" ADD CONSTRAINT "Pick3Pick_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Pick3Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick3Pick" ADD CONSTRAINT "Pick3Pick_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
