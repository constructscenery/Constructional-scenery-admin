import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const worldInclude = {
  gallery: { orderBy: { order: "asc" as const } },
  facts: { orderBy: { order: "asc" as const } },
  credits: { orderBy: { order: "asc" as const } },
  process: { orderBy: { order: "asc" as const } },
  results: { orderBy: { order: "asc" as const } },
};

export async function getWorlds(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worlds = await prisma.world.findMany({
      include: worldInclude,
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: worlds, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function getWorldBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const param = String(req.params.slug);
    const isNumericId = /^\d+$/.test(param);

    const world = await prisma.world.findUnique({
      where: isNumericId ? { id: Number(param) } : { slug: param },
      include: worldInclude,
    });

    if (!world) {
      res.status(404).json({ success: false, data: null, message: "World not found" });
      return;
    }

    res.json({ success: true, data: world, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function createWorld(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { gallery, facts, credits, process, results, ...rest } = req.body;

    const world = await prisma.world.create({
      data: {
        ...rest,
        ...(gallery !== undefined ? { gallery: { create: gallery } } : {}),
        ...(facts !== undefined ? { facts: { create: facts } } : {}),
        ...(credits !== undefined ? { credits: { create: credits } } : {}),
        ...(process !== undefined ? { process: { create: process } } : {}),
        ...(results !== undefined ? { results: { create: results } } : {}),
      },
      include: worldInclude,
    });

    res.status(201).json({ success: true, data: world, message: "World created" });
  } catch (err) {
    next(err);
  }
}

export async function updateWorld(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { gallery, facts, credits, process, results, ...rest } = req.body;

    const existing = await prisma.world.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      res.status(404).json({ success: false, data: null, message: "World not found" });
      return;
    }

    const previousSlug = existing.slug;
    const nextSlug = typeof rest.slug === "string" ? rest.slug : previousSlug;

    // Delete and recreate relations when provided
    await prisma.$transaction(async (tx) => {
      if (gallery !== undefined) {
        await tx.worldImage.deleteMany({ where: { worldId: existing.id } });
      }
      if (facts !== undefined) {
        await tx.worldFact.deleteMany({ where: { worldId: existing.id } });
      }
      if (credits !== undefined) {
        await tx.worldCredit.deleteMany({ where: { worldId: existing.id } });
      }
      if (process !== undefined) {
        await tx.worldProcess.deleteMany({ where: { worldId: existing.id } });
      }
      if (results !== undefined) {
        await tx.worldResult.deleteMany({ where: { worldId: existing.id } });
      }

      await tx.world.update({
        where: { id: existing.id },
        data: {
          ...rest,
          ...(gallery !== undefined ? { gallery: { create: gallery } } : {}),
          ...(facts !== undefined ? { facts: { create: facts } } : {}),
          ...(credits !== undefined ? { credits: { create: credits } } : {}),
          ...(process !== undefined ? { process: { create: process } } : {}),
          ...(results !== undefined ? { results: { create: results } } : {}),
        },
      });
    });

    if (previousSlug !== nextSlug) {
      const linkedProject = await prisma.project.findFirst({
        where: { OR: [{ slug: previousSlug }, { slug: nextSlug }] },
      });

      if (linkedProject) {
        await prisma.project.update({
          where: { id: linkedProject.id },
          data: { slug: nextSlug },
        });
      }
    }

    const updated = await prisma.world.findUnique({
      where: { id: existing.id },
      include: worldInclude,
    });

    res.json({ success: true, data: updated, message: "World updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorld(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.world.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      res.status(404).json({ success: false, data: null, message: "World not found" });
      return;
    }

    const linkedProject = await prisma.project.findFirst({ where: { slug: existing.slug } });
    if (linkedProject) {
      await prisma.project.update({
        where: { id: linkedProject.id },
        data: { slug: null },
      });
    }

    await prisma.world.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "World deleted" });
  } catch (err) {
    next(err);
  }
}
