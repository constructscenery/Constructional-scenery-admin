/**
 * One-shot migration: download all Cloudinary-hosted images from the DB,
 * upload them to S3, and update every record with the new S3 URL.
 *
 * Safe to re-run — already-migrated URLs (s3.amazonaws.com) are skipped.
 *
 * Run:
 *   npx tsx prisma/migrate-to-s3.ts
 */
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import path from "path";

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

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function isCloudinary(url: string | null | undefined): url is string {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

// Derive a stable S3 key from the Cloudinary URL so re-runs produce the same key.
// e.g. https://res.cloudinary.com/dvzkh1nal/image/upload/v123/construct-scenery/project-1.jpg
//   → construct-scenery/project-1.jpg
function keyFromCloudinaryUrl(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (match) return match[1];
  // Fallback: use the last path segment with a uuid prefix
  const ext = path.extname(new URL(url).pathname).toLowerCase() || ".jpg";
  return `construct-scenery/migrated-${Date.now()}${ext}`;
}

async function uploadToS3(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const key = keyFromCloudinaryUrl(url);
  const ext = path.extname(key).toLowerCase();

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: MIME[ext] ?? "image/jpeg",
    })
  );

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

// Cache so duplicate URLs (same image used in multiple records) only upload once
const cache = new Map<string, string>();

async function migrate(cloudUrl: string): Promise<string> {
  if (cache.has(cloudUrl)) return cache.get(cloudUrl)!;
  const s3Url = await uploadToS3(cloudUrl);
  cache.set(cloudUrl, s3Url);
  return s3Url;
}

async function main() {
  if (!S3_BUCKET || !S3_REGION) {
    console.error("✗ AWS_S3_BUCKET and AWS_REGION must be set in .env");
    process.exit(1);
  }

  console.log(`Migrating Cloudinary images → s3://${S3_BUCKET}\n`);
  let total = 0;
  let skipped = 0;

  // ── Projects ────────────────────────────────────────────────────────────────
  const projects = await prisma.project.findMany();
  for (const p of projects) {
    if (!isCloudinary(p.imageUrl)) { skipped++; continue; }
    try {
      const url = await migrate(p.imageUrl);
      await prisma.project.update({ where: { id: p.id }, data: { imageUrl: url } });
      console.log(`  ✓ Project "${p.name}" → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ Project "${p.name}":`, e); }
  }

  // ── Worlds — heroImage ───────────────────────────────────────────────────────
  const worlds = await prisma.world.findMany();
  for (const w of worlds) {
    if (!isCloudinary(w.heroImage)) { skipped++; continue; }
    try {
      const url = await migrate(w.heroImage);
      await prisma.world.update({ where: { id: w.id }, data: { heroImage: url } });
      console.log(`  ✓ World "${w.title}" heroImage → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ World "${w.title}" heroImage:`, e); }
  }

  // ── WorldImage (gallery) ────────────────────────────────────────────────────
  const galleryRows = await prisma.worldImage.findMany();
  for (const img of galleryRows) {
    if (!isCloudinary(img.url)) { skipped++; continue; }
    try {
      const url = await migrate(img.url);
      await prisma.worldImage.update({ where: { id: img.id }, data: { url } });
      console.log(`  ✓ WorldImage #${img.id} → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ WorldImage #${img.id}:`, e); }
  }

  // ── WorldProcess ────────────────────────────────────────────────────────────
  const processRows = await prisma.worldProcess.findMany();
  for (const step of processRows) {
    if (!isCloudinary(step.imageUrl)) { skipped++; continue; }
    try {
      const url = await migrate(step.imageUrl);
      await prisma.worldProcess.update({ where: { id: step.id }, data: { imageUrl: url } });
      console.log(`  ✓ WorldProcess "${step.title}" → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ WorldProcess "${step.title}":`, e); }
  }

  // ── About section ────────────────────────────────────────────────────────────
  const about = await prisma.aboutSection.findFirst();
  if (about && isCloudinary(about.imageUrl)) {
    try {
      const url = await migrate(about.imageUrl);
      await prisma.aboutSection.update({ where: { id: about.id }, data: { imageUrl: url } });
      console.log(`  ✓ AboutSection → ${url}`);
      total++;
    } catch (e) { console.error("  ✗ AboutSection:", e); }
  } else { skipped++; }

  // ── Sustainability section ───────────────────────────────────────────────────
  const sust = await prisma.sustainabilitySection.findFirst();
  if (sust && isCloudinary(sust.imageUrl)) {
    try {
      const url = await migrate(sust.imageUrl);
      await prisma.sustainabilitySection.update({ where: { id: sust.id }, data: { imageUrl: url } });
      console.log(`  ✓ SustainabilitySection → ${url}`);
      total++;
    } catch (e) { console.error("  ✗ SustainabilitySection:", e); }
  } else { skipped++; }

  // ── Hero section videoPoster ─────────────────────────────────────────────────
  const hero = await prisma.heroSection.findFirst();
  if (hero && isCloudinary(hero.videoPoster)) {
    try {
      const url = await migrate(hero.videoPoster!);
      await prisma.heroSection.update({ where: { id: hero.id }, data: { videoPoster: url } });
      console.log(`  ✓ HeroSection.videoPoster → ${url}`);
      total++;
    } catch (e) { console.error("  ✗ HeroSection.videoPoster:", e); }
  } else { skipped++; }

  // ── Testimonials ─────────────────────────────────────────────────────────────
  const testimonials = await prisma.testimonial.findMany();
  for (const t of testimonials) {
    if (!isCloudinary(t.imageUrl)) { skipped++; continue; }
    try {
      const url = await migrate(t.imageUrl);
      await prisma.testimonial.update({ where: { id: t.id }, data: { imageUrl: url } });
      console.log(`  ✓ Testimonial "${t.name}" → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ Testimonial "${t.name}":`, e); }
  }

  // ── Logos ────────────────────────────────────────────────────────────────────
  const logos = await prisma.logo.findMany();
  for (const l of logos) {
    if (!isCloudinary(l.imageUrl)) { skipped++; continue; }
    try {
      const url = await migrate(l.imageUrl!);
      await prisma.logo.update({ where: { id: l.id }, data: { imageUrl: url } });
      console.log(`  ✓ Logo "${l.name}" → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ Logo "${l.name}":`, e); }
  }

  // ── MediaFile (existing Cloudinary uploads tracked in media library) ──────────
  const mediaFiles = await prisma.mediaFile.findMany();
  for (const m of mediaFiles) {
    if (!isCloudinary(m.url)) { skipped++; continue; }
    try {
      const url = await migrate(m.url);
      const key = keyFromCloudinaryUrl(m.url);
      await prisma.mediaFile.update({ where: { id: m.id }, data: { url, publicId: key } });
      console.log(`  ✓ MediaFile #${m.id} → ${url}`);
      total++;
    } catch (e) { console.error(`  ✗ MediaFile #${m.id}:`, e); }
  }

  console.log(`\n✅ Done. ${total} records migrated, ${skipped} already on S3 or non-Cloudinary (skipped).`);
}

main()
  .catch((e) => {
    console.error("\n✗ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
