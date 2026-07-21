import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const bioSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  links: z.array(
    z.object({
      label: z.string(),
      url: z.string(),
    })
  ).default([]),
});

export const getBio = async (req: Request, res: Response) => {
  try {
    let bio = await prisma.bioSection.findFirst();
    if (!bio) {
      bio = await prisma.bioSection.create({
        data: {
          name: "Name",
          role: "Role",
          description: "Description",
          links: [],
        },
      });
    }
    res.json({ success: true, data: bio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateBio = async (req: Request, res: Response) => {
  try {
    const parsed = bioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Validation error" });
    }

    const first = await prisma.bioSection.findFirst();
    let bio;
    if (first) {
      bio = await prisma.bioSection.update({
        where: { id: first.id },
        data: parsed.data,
      });
    } else {
      bio = await prisma.bioSection.create({ data: parsed.data });
    }

    res.json({ success: true, data: bio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
