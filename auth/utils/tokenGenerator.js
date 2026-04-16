import jwt from "jsonwebtoken";
import User from "../models/users.models.js";

const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

const accessTokenGenerator = async (userId) => {
 try {
     if (!userId) {
       throw new Error("user data not received");
     }
   
     const user = await User.findById(userId).populate("role");
   
  
     const roleNames = user.role.map((r) => r.name);
   
     const accessToken = jwt.sign(
       {
         userId: user._id,
         role: roleNames,
         isActive: user.isActive,
       },
       privateKey,
       {
         algorithm: "RS256",
         expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
       },
     );
   
     if (!accessToken) {
       throw new Error("no access token generated");
     }
   
     return accessToken;
 } catch (error) {
    console.log(error)
    return;
 }
};

const refreshTokenGenerator = async (userId) => {
  try {
    
      if (!userId) {
      throw new Error("user data not received");
    }
  
    const refreshToken = jwt.sign(
      {
        userId:userId
      },
      privateKey,
      { algorithm: "RS256", expiresIn:process.env.REFRESH_TOKEN_EXPIRY
       },
    );
  
    if (!refreshToken) {
      throw new Error("no access token generated");
    }
  
    return refreshToken;
  } catch (error) {
     console.log(error)
     return;
  }
};

export { accessTokenGenerator, refreshTokenGenerator };
