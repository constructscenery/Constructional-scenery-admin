import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertSustainabilityItemAtOrder(order: number) {
  await prisma.sustainabilityItem.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveSustainabilityItemToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.sustainabilityItem.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.sustainabilityItem.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

export async function getSustainability(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const section = await prisma.sustainabilitySection.findFirst({
      include: { items: { orderBy: { order: "asc" } } },
    });
    res.json({ success: true, data: section, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function upsertSustainability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.sustainabilitySection.findFirst();

    const section = existing
      ? await prisma.sustainabilitySection.update({
          where: { id: existing.id },
          data: req.body,
          include: { items: { orderBy: { order: "asc" } } },
        })
      : await prisma.sustainabilitySection.create({
          data: req.body,
          include: { items: { orderBy: { order: "asc" } } },
        });

    res.json({ success: true, data: section, message: "Sustainability section updated" });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const section = await prisma.sustainabilitySection.findFirst();
    if (!section) {
      res.status(404).json({ success: false, data: null, message: "Sustainability section not found" });
      return;
    }
    const payload = req.body;
    if (payload.order !== undefined) {
      await insertSustainabilityItemAtOrder(Number(payload.order));
    }
    const item = await prisma.sustainabilityItem.create({
      data: { ...payload, sectionId: section.id },
    });
    res.status(201).json({ success: true, data: item, message: "Item created" });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    if (payload.order !== undefined) {
      const existing = await prisma.sustainabilityItem.findUnique({ where: { id } });
      if (existing && existing.order !== Number(payload.order)) {
        await moveSustainabilityItemToOrder(id, existing.order, Number(payload.order));
      }
    }

    const item = await prisma.sustainabilityItem.update({
      where: { id },
      data: payload,
    });
    res.json({ success: true, data: item, message: "Item updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.sustainabilityItem.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Item deleted" });
  } catch (err) {
    next(err);
  }
}
