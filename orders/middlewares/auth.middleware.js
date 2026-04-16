import jwt from "jsonwebtoken";
import { sharedRedisClient } from "../db/redis.js";
const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

const verifyJWT = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!accessToken) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const isBlacked = await sharedRedisClient.get(accessToken);

    if (isBlacked) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const decodedToken = jwt.verify(accessToken, publicKey, {
      algorithm: "RS256",
    });

    if (!decodedToken) {
      return res.status(401).json({ message: "user not authenticated" });
    }

    req.user = {
      userId: decodedToken?.userId,
      isActive: decodedToken?.isActive,
      role: decodedToken?.role,
      perms: decodedToken?.perms,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export default verifyJWT;
