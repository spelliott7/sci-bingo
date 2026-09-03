import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SeedSong = {
  sourceId: number;
  name: string;
  isCover: boolean;
  playCount: number;
};

async function seedSongs() {
  const filePath = path.join(__dirname, "seed-data", "sci-songs.json");
  const songs: SeedSong[] = JSON.parse(readFileSync(filePath, "utf8"));

  console.log(`Seeding ${songs.length} songs...`);

  for (const song of songs) {
    await prisma.song.upsert({
      where: { sourceId: song.sourceId },
      update: {
        name: song.name,
        isCover: song.isCover,
        playCount: song.playCount,
      },
      create: {
        sourceId: song.sourceId,
        name: song.name,
        isCover: song.isCover,
        playCount: song.playCount,
      },
    });
  }

  console.log("Songs seeded.");
}

async function seedAdmin() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!username || !password) {
    console.log(
      "ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD not set — skipping admin seed. " +
        "Set them in .env and re-run `npm run prisma:seed` to create an admin login.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "ADMIN" },
    create: {
      username,
      email: `${username}@sci-bingo.local`,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin account ready: "${username}"`);
}

async function main() {
  await seedSongs();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
