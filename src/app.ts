import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import heroRoutes from "./routes/hero.routes";
import logosRoutes from "./routes/logos.routes";
import aboutRoutes from "./routes/about.routes";
import servicesRoutes from "./routes/services.routes";
import projectsRoutes from "./routes/projects.routes";
import processRoutes from "./routes/process.routes";
import testimonialsRoutes from "./routes/testimonials.routes";
import sustainabilityRoutes from "./routes/sustainability.routes";
import contactRoutes from "./routes/contact.routes";
import footerRoutes from "./routes/footer.routes";
import worldsRoutes from "./routes/worlds.routes";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/logos", logosRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/process", processRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/sustainability", sustainabilityRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/footer", footerRoutes);
app.use("/api/worlds", worldsRoutes);

app.use(errorHandler);

export default app;
