import { Router } from "express";
import {
  getWorlds,
  getWorldBySlug,
  createWorld,
  updateWorld,
  deleteWorld,
} from "../controllers/worlds.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { worldSchema, worldUpdateSchema } from "../schemas/world.schema";

const router = Router();

router.get("/", getWorlds);
router.get("/:slug", getWorldBySlug);
router.post("/", requireAuth, validate(worldSchema), createWorld);
router.put("/:id", requireAuth, validate(worldUpdateSchema), updateWorld);
router.delete("/:id", requireAuth, deleteWorld);

export default router;
