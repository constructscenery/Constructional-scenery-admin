import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

async function insertTestimonialAtOrder(order: number) {
  await prisma.testimonial.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });
}

async function moveTestimonialToOrder(id: number, previousOrder: number, nextOrder: number) {
  if (previousOrder === nextOrder) return;

  if (nextOrder < previousOrder) {
    await prisma.testimonial.updateMany({
      where: { id: { not: id }, order: { gte: nextOrder, lt: previousOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await prisma.testimonial.updateMany({
    where: { id: { not: id }, order: { gt: previousOrder, lte: nextOrder } },
    data: { order: { decrement: 1 } },
  });
}

export async function getTestimonials(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
    res.json({ success: true, data: testimonials, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    if (payload.order !== undefined) {
      await insertTestimonialAtOrder(Number(payload.order));
    }
    const testimonial = await prisma.testimonial.create({ data: payload });
    res.status(201).json({ success: true, data: testimonial, message: "Testimonial created" });
  } catch (err) {
    next(err);
  }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    if (payload.order !== undefined) {
      const existing = await prisma.testimonial.findUnique({ where: { id } });
      if (existing && existing.order !== Number(payload.order)) {
        await moveTestimonialToOrder(id, existing.order, Number(payload.order));
      }
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: payload,
    });
    res.json({ success: true, data: testimonial, message: "Testimonial updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.testimonial.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, data: null, message: "Testimonial deleted" });
  } catch (err) {
    next(err);
  }
}
