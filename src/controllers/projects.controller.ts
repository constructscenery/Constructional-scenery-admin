import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertProjectAtOrder(order: number) {
  await prisma.project.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveProjectToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.project.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.project.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

async function ensureWorldExists(slug: string, project: {
  name: string; services: string; year: string; type: string; imageUrl: string;
}) {
  if (!slug) return;

  const existingBySlug = await prisma.world.findUnique({ where: { slug } });
  const existingByTitle = await prisma.world.findMany({ where: { title: project.name } });
  const existing = existingBySlug ?? existingByTitle[0] ?? null;

  if (existing) {
    const duplicateWorlds = existingByTitle.filter((world) => world.id !== existing.id);
    for (const duplicate of duplicateWorlds) {
      await prisma.world.delete({ where: { id: duplicate.id } });
    }

    await prisma.world.update({
      where: { id: existing.id },
      data: {
        slug,
        title: project.name,
        summary: existing.summary ?? "",
        role: project.services,
        year: project.year,
        tags: [project.type],
        category: project.type,
        heroImage: project.imageUrl,
        vimeoId: existing.vimeoId ?? "",
        intro: existing.intro ?? "",
        visible: existing.visible ?? false,
      },
    });
    return;
  }

  await prisma.world.create({
    data: {
      slug,
      title: project.name,
      summary: "",
      role: project.services,
      year: project.year,
      tags: [project.type],
      category: project.type,
      heroImage: project.imageUrl,
      vimeoId: "",
      intro: "",
      visible: false,
    },
  });
}

export async function getProjects(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: projects, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = { ...req.body };
    if (payload.order !== undefined) {
      await insertProjectAtOrder(Number(payload.order));
    }

    if (payload.worldId != null) {
      const linkedWorld = await prisma.world.findUnique({ where: { id: Number(payload.worldId) } });
      if (linkedWorld) {
        await prisma.world.update({ where: { id: linkedWorld.id }, data: { projectId: null } });
      }
    }

    const project = await prisma.project.create({ data: payload });

    if (payload.worldId != null) {
      await prisma.world.update({ where: { id: Number(payload.worldId) }, data: { projectId: project.id } });
    }

    if (project.slug) {
      await ensureWorldExists(project.slug, project);
    }

    res.status(201).json({ success: true, data: project, message: "Project created" });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) {
      res.status(404).json({ success: false, data: null, message: "Project not found" });
      return;
    }

    const payload = { ...req.body };
    if (payload.worldId !== undefined && payload.worldId !== existing.worldId) {
      if (existing.worldId) {
        await prisma.world.update({ where: { id: existing.worldId }, data: { projectId: null } });
      }
      if (payload.worldId != null) {
        const linkedWorld = await prisma.world.findUnique({ where: { id: Number(payload.worldId) } });
        if (linkedWorld) {
          await prisma.world.update({ where: { id: linkedWorld.id }, data: { projectId: Number(req.params.id) } });
        }
      }
    }

    if (payload.order !== undefined) {
      await moveProjectToOrder(existing.id, existing.order, Number(payload.order));
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: payload,
    });

    if (project.slug) {
      await ensureWorldExists(project.slug, project);
    }

    res.json({ success: true, data: project, message: "Project updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
    if (!project) {
      res.status(404).json({ success: false, data: null, message: "Project not found" });
      return;
    }

    if (project.worldId) {
      await prisma.world.update({ where: { id: project.worldId }, data: { projectId: null } });
    }

    if (project.slug) {
      const linkedWorld = await prisma.world.findUnique({ where: { slug: project.slug } });
      if (linkedWorld) {
        await prisma.world.delete({ where: { id: linkedWorld.id } });
      }
    }

    await prisma.project.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Project deleted" });
  } catch (err) {
    next(err);
  }
}
