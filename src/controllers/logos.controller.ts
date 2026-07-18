import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertLogoAtOrder(order: number) {
  await prisma.logo.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveLogoToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.logo.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.logo.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

export async function getLogos(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const logos = await prisma.logo.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: logos, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function createLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    if (payload.order !== undefined) {
      await insertLogoAtOrder(Number(payload.order));
    }
    const logo = await prisma.logo.create({ data: payload });
    res.status(201).json({ success: true, data: logo, message: "Logo created" });
  } catch (err) {
    next(err);
  }
}

export async function updateLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    if (payload.order !== undefined) {
      const existing = await prisma.logo.findUnique({ where: { id } });
      if (existing && existing.order !== Number(payload.order)) {
        await moveLogoToOrder(id, existing.order, Number(payload.order));
      }
    }

    const logo = await prisma.logo.update({
      where: { id },
      data: payload,
    });
    res.json({ success: true, data: logo, message: "Logo updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.logo.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Logo deleted" });
  } catch (err) {
    next(err);
  }
}

export async function reorderLogos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids } = req.body as { ids: number[] };
    await Promise.all(
      ids.map((id, index) => prisma.logo.update({ where: { id }, data: { order: index } }))
    );
    res.json({ success: true, data: null, message: "Logos reordered" });
  } catch (err) {
    next(err);
  }
}
