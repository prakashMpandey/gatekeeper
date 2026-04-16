import { Router } from "express";
import { register,toggleUserStatus,login,refresh,logout,getCurrentUser } from "../controllers/users.controllers.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getLogs } from "../controllers/logs.controllers.js";
import authorize from "../middlewares/permissions.middleware.js";
const router=Router()


router.post("/login",login)
router.post("/register",register)
router.post("/refresh",refresh)
router.post("/logout",verifyJWT,logout)
router.post("/status",verifyJWT,toggleUserStatus)
router.get("/me",verifyJWT,getCurrentUser);
router.get("/logs",verifyJWT,authorize("logs","read"),getLogs);
router.get("/users",verifyJWT,authorize("users","read"),getLogs);

export default router
