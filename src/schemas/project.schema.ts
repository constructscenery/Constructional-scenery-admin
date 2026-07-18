import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  services: z.string().min(1),
  year: z.string().min(1),
  slug: z.string().optional(),
  imageUrl: z.string().min(1),
  span: z.string().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  worldId: z.number().int().nullable().optional(),
});
