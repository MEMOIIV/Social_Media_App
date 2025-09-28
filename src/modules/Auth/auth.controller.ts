import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../middleware/validationMiddleware";
import {
  confirmEmailSchema,
  loginSchema,
  signupSchema,
} from "./auth.validation";
const router: Router = Router();

router.post("/signup", validation(signupSchema), authService.signup);
router.post("/login", validation(loginSchema), authService.login);

router.patch(
  "/confirmEmail",
  validation(confirmEmailSchema),
  authService.confirmEmail
);

export default router;
