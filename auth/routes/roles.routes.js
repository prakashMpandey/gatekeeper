import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import {
	createNewRole,
	addRoleToUser,
	addPermissionToRole,
	getRoles,
	getRole,
	removeRoleFromUser
} from "../controllers/roles.controllers.js";

const router = express.Router();

// Create a new role
router.post("/", verifyJWT, createNewRole);

// Get all roles
router.get("/", verifyJWT, getRoles);

// Get a single role
router.get("/:roleId", verifyJWT, getRole);

// Add a role to a user
router.post("/assign/:userId", verifyJWT,  addRoleToUser);

// Remove a role from a user
router.post("/remove/:userId", verifyJWT, removeRoleFromUser);

// Add permissions to a role
router.post("/:roleId/permissions", verifyJWT, addPermissionToRole);

export default router;
