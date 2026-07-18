import { z } from "zod";

const trustStatSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const heroSchema = z.object({
  eyebrow: z.string().min(1),
  headline: z.string().min(1),
  rotatingItems: z.array(z.string()).min(1),
  bodyText: z.string().min(1),
  cta1Label: z.string().min(1),
  cta1Href: z.string().min(1),
  cta2Label: z.string().min(1),
  cta2Href: z.string().min(1),
  mediaType: z.enum(["video", "image"]).default("video"),
  videoUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  heroImageUrl: z.string().optional(),
  trustStats: z.array(trustStatSchema).min(1),
});

