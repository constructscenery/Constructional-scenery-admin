import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertServiceAtOrder(order: number) {
  await prisma.service.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveServiceToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.service.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.service.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

export async function getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: services, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    if (payload.order !== undefined) {
      await insertServiceAtOrder(Number(payload.order));
    }
    const service = await prisma.service.create({ data: payload });
    res.status(201).json({ success: true, data: service, message: "Service created" });
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    if (payload.order !== undefined) {
      const existing = await prisma.service.findUnique({ where: { id } });
      if (existing && existing.order !== Number(payload.order)) {
        await moveServiceToOrder(id, existing.order, Number(payload.order));
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: payload,
    });
    res.json({ success: true, data: service, message: "Service updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.service.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Service deleted" });
  } catch (err) {
    next(err);
  }
}
