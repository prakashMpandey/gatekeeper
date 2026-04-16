import Permission from "../models/permissions.models.js";
import { SuccessResponse,ErrorResponse } from "../utils/ApiResponse.js";
const addPermission = async (req, res) => {
  try {
    const { resource, action } = req.body;
    if (!resource || !action) {
      return res.status(400).json(new ErrorResponse(400, "resource or action is missing"));
    }
    const existingPermission=await Permission.findOne({"resource":resource,"action":action})

    if (existingPermission) return res.status(400).json(new ErrorResponse(400,"permission already exists"))
    const permission = await Permission.create({ resource, action });
    return res.status(201).json(new SuccessResponse(201, permission, "permission created"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
};

const getAllPermissions = async (req, res) => {
  try {
   const permissions=await Permission.find({});
    return res.status(201).json(new SuccessResponse(201, permissions, "permission created"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ErrorResponse(500, "Internal server error"));
  }
};

export {getAllPermissions,addPermission};