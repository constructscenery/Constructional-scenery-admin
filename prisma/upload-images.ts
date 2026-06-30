import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET!;
const S3_REGION = process.env.AWS_REGION!;

const prisma = new PrismaClient();

const ASSETS_DIR = path.join(__dirname, "../../scenic-builds-elevated/src/assets");

const IMAGES = [
  "project-1.jpg",
  "project-2.jpg",
  "project-3.jpg",
  "project-4.jpg",
  "project-5.jpg",
  "project-6.jpg",
  "project-7.jpg",
  "project-8.jpg",
  "about-craft.jpg",
  "sustainability.jpg",
  "hero-set.jpg",
];

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function uploadFile(filename: string): Promise<string> {
  const filePath = path.join(ASSETS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const key = `construct-scenery/${path.basename(filename, ext)}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fs.readFileSync(filePath),
      ContentType: MIME[ext] ?? "application/octet-stream",
    })
  );

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

async function main() {
  console.log("Uploading images to S3...\n");

  const urlMap: Record<string, string> = {};

  for (const filename of IMAGES) {
    const assetKey = `/assets/${filename}`;
    const filePath = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ SKIP ${filename} — file not found at ${filePath}`);
      continue;
    }

    try {
      const s3Url = await uploadFile(filename);
      urlMap[assetKey] = s3Url;
      console.log(`  ✓ ${filename}`);
      console.log(`    → ${s3Url}`);
    } catch (err) {
      console.error(`  ✗ ${filename} — upload failed:`, err);
    }
  }

  console.log(`\nUploaded ${Object.keys(urlMap).length}/${IMAGES.length} images. Updating database...\n`);

  // ── Projects ──────────────────────────────────────────────────────────────────
  const projects = await prisma.project.findMany();
  let updated = 0;
  for (const p of projects) {
    const newUrl = urlMap[p.imageUrl];
    if (newUrl) {
      await prisma.project.update({ where: { id: p.id }, data: { imageUrl: newUrl } });
      updated++;
    }
  }
  console.log(`  ✓ Projects: ${updated}/${projects.length} updated`);

  // ── Worlds — heroImage ────────────────────────────────────────────────────────
  const worlds = await prisma.world.findMany();
  updated = 0;
  for (const w of worlds) {
    const newUrl = urlMap[w.heroImage];
    if (newUrl) {
      await prisma.world.update({ where: { id: w.id }, data: { heroImage: newUrl } });
      updated++;
    }
  }
  console.log(`  ✓ Worlds heroImage: ${updated}/${worlds.length} updated`);

  // ── WorldImage (gallery rows) ─────────────────────────────────────────────────
  const galleryRows = await prisma.worldImage.findMany();
  updated = 0;
  for (const img of galleryRows) {
    const newUrl = urlMap[img.url];
    if (newUrl) {
      await prisma.worldImage.update({ where: { id: img.id }, data: { url: newUrl } });
      updated++;
    }
  }
  console.log(`  ✓ World gallery images: ${updated}/${galleryRows.length} updated`);

  // ── WorldProcess — imageUrl ───────────────────────────────────────────────────
  const processRows = await prisma.worldProcess.findMany();
  updated = 0;
  for (const step of processRows) {
    if (!step.imageUrl) continue;
    const newUrl = urlMap[step.imageUrl];
    if (newUrl) {
      await prisma.worldProcess.update({ where: { id: step.id }, data: { imageUrl: newUrl } });
      updated++;
    }
  }
  console.log(`  ✓ World process steps: ${updated}/${processRows.length} updated`);

  // ── About section ─────────────────────────────────────────────────────────────
  const about = await prisma.aboutSection.findFirst();
  if (about) {
    const newUrl = urlMap[about.imageUrl];
    if (newUrl) {
      await prisma.aboutSection.update({ where: { id: about.id }, data: { imageUrl: newUrl } });
      console.log("  ✓ About section imageUrl updated");
    } else {
      console.log("  – About section: imageUrl already an S3 URL or not in map");
    }
  }

  // ── Sustainability section ────────────────────────────────────────────────────
  const sust = await prisma.sustainabilitySection.findFirst();
  if (sust) {
    const newUrl = urlMap[sust.imageUrl];
    if (newUrl) {
      await prisma.sustainabilitySection.update({ where: { id: sust.id }, data: { imageUrl: newUrl } });
      console.log("  ✓ Sustainability section imageUrl updated");
    } else {
      console.log("  – Sustainability section: imageUrl already an S3 URL or not in map");
    }
  }

  // ── Hero section — videoPoster ────────────────────────────────────────────────
  const hero = await prisma.heroSection.findFirst();
  if (hero && hero.videoPoster) {
    const newUrl = urlMap[hero.videoPoster];
    if (newUrl) {
      await prisma.heroSection.update({ where: { id: hero.id }, data: { videoPoster: newUrl } });
      console.log("  ✓ Hero section videoPoster updated");
    } else {
      console.log("  – Hero section: videoPoster already an S3 URL or not in map");
    }
  }

  console.log("\n✅ Done. All /assets/* paths in the database have been replaced with S3 URLs.");
}

main()
  .catch((e) => {
    console.error("\n✗ Script failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
