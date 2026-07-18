import { z } from "zod";

const worldFactSchema = z.object({
  label: z.string(),
  value: z.string(),
  order: z.number().int().default(0),
});

const worldCreditSchema = z.object({
  role: z.string(),
  name: z.string(),
  order: z.number().int().default(0),
});

const worldProcessSchema = z.object({
  title: z.string(),
  body: z.string(),
  imageUrl: z.string(),
  order: z.number().int().default(0),
});

const worldResultSchema = z.object({
  value: z.string(),
  label: z.string(),
  order: z.number().int().default(0),
});

export const worldSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  year: z.string().min(1),
  tags: z.array(z.string()).min(1),
  category: z.string().min(1),
  heroImage: z.string().min(1),
  vimeoId: z.string().min(1),
  intro: z.string().min(1),
  gallery: z.array(z.object({ url: z.string(), order: z.number().int().default(0) })).optional().default([]),
  facts: z.array(worldFactSchema).optional().default([]),
  credits: z.array(worldCreditSchema).optional().default([]),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const worldUpdateSchema = worldSchema.partial();
