import { z } from "zod";

const columnSchema = z.object({
  title: z.string(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string()
  })),
});

export const footerSchema = z.object({
  brandName: z.string().min(1),
  tagline: z.string().min(1),
  columns: z.array(columnSchema),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  vimeo: z.string().optional(),
});
