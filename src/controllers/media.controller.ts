import { Request, Response, NextFunction } from "express";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../lib/s3";
import { prisma } from "../lib/prisma";

export async function listMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = await prisma.mediaFile.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: files, message: "OK" });
  } catch (err) {
    next(err);
  }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) {
      res.status(404).json({ success: false, data: null, message: "Not found" });
      return;
    }
    
    await s3.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: file.publicId,
      })
    );

    await prisma.mediaFile.delete({ where: { id } });
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}
