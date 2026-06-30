import { Request, Response, NextFunction } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { s3, S3_BUCKET, S3_REGION } from "../lib/s3";
import { prisma } from "../lib/prisma";

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, data: null, message: "No file provided" });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `construct-scenery/${randomUUID()}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

    const media = await prisma.mediaFile.create({
      data: {
        url,
        publicId: key,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.json({
      success: true,
      data: { url: media.url, publicId: media.publicId, id: media.id },
      message: "Image uploaded successfully",
    });
  } catch (err) {
    next(err);
  }
}
