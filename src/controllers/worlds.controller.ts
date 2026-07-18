import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertWorldAtOrder(order: number) {
  await prisma.world.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveWorldToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.world.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.world.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

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
    const payload = { ...rest };

    if (payload.order !== undefined) {
      await insertWorldAtOrder(Number(payload.order));
    }

    if (payload.projectId != null) {
      const linkedProject = await prisma.project.findUnique({ where: { id: Number(payload.projectId) } });
      if (linkedProject) {
        await prisma.project.update({ where: { id: linkedProject.id }, data: { worldId: null } });
      }
    }

    const world = await prisma.world.create({
      data: {
        ...payload,
        ...(gallery !== undefined ? { gallery: { create: gallery } } : {}),
        ...(facts !== undefined ? { facts: { create: facts } } : {}),
        ...(credits !== undefined ? { credits: { create: credits } } : {}),
        ...(process !== undefined ? { process: { create: process } } : {}),
        ...(results !== undefined ? { results: { create: results } } : {}),
      },
      include: worldInclude,
    });

    if (payload.projectId != null) {
      await prisma.project.update({ where: { id: Number(payload.projectId) }, data: { worldId: world.id } });
    }

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

    if (rest.order !== undefined) {
      await moveWorldToOrder(existing.id, existing.order, Number(rest.order));
    }

    if (rest.projectId !== undefined && rest.projectId !== existing.projectId) {
      if (existing.projectId) {
        await prisma.project.update({ where: { id: existing.projectId }, data: { worldId: null } });
      }
      if (rest.projectId != null) {
        const linkedProject = await prisma.project.findUnique({ where: { id: Number(rest.projectId) } });
        if (linkedProject) {
          await prisma.project.update({ where: { id: linkedProject.id }, data: { worldId: existing.id } });
        }
      }
    }

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

    if (existing.projectId) {
      await prisma.project.update({ where: { id: existing.projectId }, data: { worldId: null } });
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
