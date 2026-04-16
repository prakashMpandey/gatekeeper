import User from "../models/users.models.js";
import Role from "../models/roles.models.js";
import Permission from "../models/permissions.models.js";
import { SuccessResponse, ErrorResponse } from "../utils/ApiResponse.js";
import { sharedRedisClient } from "../db/redis.js";

const createNewRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json(new ErrorResponse(400, "name or description is missing"));
    }
    const existingRole=await Role.findOne({name:name});

    if (existingRole)
    {
        return res.status(400).json(new ErrorResponse(400, "role already exists"));
    }
    const role = await Role.create({ name, description });
    return res.status(201).json(new SuccessResponse(201, role, "role created"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
};
const addRoleToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json(new ErrorResponse(400, "userId or roleId is missing"));
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ErrorResponse(404, "User not found"));
    }
    if (!user.role) user.role = [];
    if (!user.role.includes(roleId)) {
      user.role.push(roleId);
      await user.save();
    }
    return res.status(200).json(new SuccessResponse(200, [],"Role added successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
};
const getRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json(new ErrorResponse(404, "Role not found"));
    }
    return res.status(200).json(new SuccessResponse(200, role));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new  ErrorResponse(500, "Internal server error"));
  }
};
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({},{"__v":0}).populate("permissions","-__v");
    return res.status(200).json(new SuccessResponse(200, roles));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
}
const removeRoleFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json(new ErrorResponse(400, "userId or roleId is missing"));
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ErrorResponse(404, "User not found"));
    }
    if (!user.role) user.role = [];

    if(!user.role.includes(roleId)) return res.status(404).json(new ErrorResponse(404,"role already deleted"))
    user.role = user.role.filter(r => r.toString() !== roleId);
    await user.save();
    return res.status(200).json(new SuccessResponse(200, [], "Role removed successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
};
const addPermissionToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    let { permissions } = req.body; 

    // 1. Basic Validation
    if (!roleId || !permissions || (Array.isArray(permissions) && permissions.length === 0)) {
      return res.status(400).json(new ErrorResponse(400, "Role ID or permissions array is missing"));
    }

    // Array check normalization
    const permsToAdd = Array.isArray(permissions) ? permissions : [permissions];

    // 2. Atomic Update in MongoDB (Using $addToSet avoids duplicates automatically)
    // Isse tujhe pehle role find karke filter karne ki zaroorat nahi padegi
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: { $each: permsToAdd } } },
      { returnDocument: true, runValidators: false }
    ).populate("permissions")

    if (!updatedRole) {
      return res.status(404).json(new ErrorResponse(404, "Role not found"));
    }

    const permNames=updatedRole.permissions.map(p=>`${p.resource}:${p.action}`)

    console.log(permNames)
    const redisKey = `role:perms:${updatedRole.name}`;
    
    if (permNames.length > 0) {
      await sharedRedisClient.sAdd(redisKey, permNames);
    }
  
    return res.status(200).json(
        new SuccessResponse(200, updatedRole, "Permissions synced to DB and Redis")
    );

  } catch (error) {
    console.error("RBAC Sync Error:", error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error during sync"));
  }
};

export {createNewRole,addRoleToUser,addPermissionToRole,getRole,getRoles,removeRoleFromUser}