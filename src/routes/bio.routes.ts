import { Router } from "express";
import { getBio, updateBio } from "../controllers/bio.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", getBio);
router.put("/", requireAuth, updateBio);

export default router;
