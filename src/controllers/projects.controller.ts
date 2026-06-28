import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function ensureWorldExists(slug: string, project: {
  name: string; services: string; year: string; type: string; imageUrl: string;
}) {
  const existing = await prisma.world.findUnique({ where: { slug } });
  if (!existing) {
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
    const project = await prisma.project.create({ data: req.body });

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
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: req.body,
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
    await prisma.project.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Project deleted" });
  } catch (err) {
    next(err);
  }
}
