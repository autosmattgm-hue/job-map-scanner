import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { requireUser } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/errors.js";
import { authSchemas } from "../utils/schemas.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(authSchemas.register), asyncHandler(register));
authRouter.post("/login", validateBody(authSchemas.login), asyncHandler(login));
authRouter.get("/me", requireUser, asyncHandler(me));
