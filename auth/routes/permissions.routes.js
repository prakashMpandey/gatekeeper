import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { addPermission,getAllPermissions } from "../controllers/permissions.controllers.js";
const router=Router();


router.get("/",verifyJWT,getAllPermissions);
router.post("/",verifyJWT,addPermission);


export default router;
