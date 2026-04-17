import { Router } from "express";
import { register,toggleUserStatus,login,refresh,logout,getCurrentUser, getUsers } from "../controllers/users.controllers.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getLogs } from "../controllers/logs.controllers.js";
import authorize from "../middlewares/permissions.middleware.js";
const router=Router()


router.post("/login",login)   // login user
router.post("/register",register)  // register user 
router.post("/refresh",refresh)  // refresh token 
router.post("/logout",verifyJWT,logout) // logout the user  
router.post("/status",verifyJWT,toggleUserStatus) // change the status 
router.get("/me",verifyJWT,getCurrentUser); // return the current user
router.get("/logs",verifyJWT,authorize("logs","read"),getLogs); // return the logs
router.get("/users",verifyJWT,authorize("users","read"),getUsers ); // return the users

export default router
