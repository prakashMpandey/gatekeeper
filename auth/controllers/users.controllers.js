import User from "../models/users.models.js"
import { accessTokenGenerator,refreshTokenGenerator } from "../utils/tokenGenerator.js";
import { SuccessResponse,ErrorResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { redisClient as redis,sharedRedisClient  } from "../db/redis.js";
import { access, readFileSync } from 'node:fs';




const register = async (req, res) => {
  try {
    const { email, username, password } = req?.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "all  fields are required" });
    }
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "user already exists" });
    }

    const newUser = await User.create({
      email: email,
      username: username,
      password: password
    });

   
    if (!newUser) {
      return res.status(500).json({ message: "user cannot be created" });
    }

    return res.status(201).json({ message: "user created successfully" });
  } 
  catch (error) {
    console.log(error)
    return res.status(500).json({"status":500, "message":"something went wrong"});
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email || password)) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "sorry user does not exists" });
    }

    if (!user.isActive){
      return res.status(401).json({message:"user is not active"})
    }
    
    const isPasswordCorrect = await user.verifyPassword(password)

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "invalid credentials" });
    }

    const accessToken = await accessTokenGenerator(user._id);
    const refreshToken = await refreshTokenGenerator(user._id);



    if (!accessToken || !refreshToken) {
      throw new Error("refresh token or access token not generated");
    }

    await redis.SETEX( `refresh:${user._id}`,604800,refreshToken)
    

    console.log(accessToken,refreshToken)
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
          secure: true,
          httpOnly: true,
          maxAge: 15*60*1000 ,
    })
      .cookie("refreshToken", refreshToken, {
          secure: true,
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60*1000
    })
      .json(new SuccessResponse(200, {"userId":user.id,"accessToken":accessToken}, "user logged in successfully"));
  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: "something went wrong" });
  }
};
const refresh=async(req,res)=>{
try {
    console.log("hello")
    const userToken=req?.cookies?.refreshToken || req.body?.refreshToken

    if (!userToken){
      console.log("no user token");
      return res.status(400)
    }
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

    const decodedToken=jwt.verify(userToken,privateKey,{algorithms:'RS256'})
    if (!decodedToken) return res.status(400);

    
  
    const userId=decodedToken.userId;

    const savedToken=await redis.get(`refresh:${userId}`)
  
    if (userToken!==savedToken)
    {
      return res.status(400).json({"message":"please log in again"})
    }
  
  
    const accessToken=await accessTokenGenerator(userId);
    const refreshToken=await refreshTokenGenerator(userId);


    if(!accessToken || !refreshToken)
    {
      return res.status(500).json({"message":"access token or refresh toekn not genrated"})
    }
    const options= {
          secure: true,
          httpOnly: true,
          maxAge: 24*60*60*1000,
        }
        console.log(userId);

        await redis.SETEX( `refresh:${userId}`,604800,refreshToken)  // 7 days
        
    return res
            .status(200)
            .cookie("accessToken", accessToken,options)
            .cookie("refreshToken", refreshToken, options)
            .json({"message":"token generated","accessToken":accessToken})
            
} catch (error) {
  console.log(error)
  return res.status(500).json({"message":"internal server error"})
}
}
const logout = async (req, res) => {
  const user = req.user;
  console.log(user,req.cookies);
  const accessToken = req.cookies?.accessToken;
  if (!user || !accessToken) {
    throw new Error("user not logged in");
  }

  const decodedToken = jwt.decode(accessToken);

  if (decodedToken?.exp > Date.now() / 1000) {
    let leftOutTime = Math.ceil(decodedToken?.exp - Date.now() / 1000);

    await User.findByIdAndUpdate(
      decodedToken?.id,
      { refreshToken: null }
    );

    await sharedRedisClient.set(accessToken, "blackedout", {
      expiration: { type: "EX", value: leftOutTime },
    });
  }

  await redis.del(`refresh:{decodedToken.userId}`);

  return res
    .status(200)
    .clearCookie("refreshToken", { httpOnly: true, secure: true })
    .clearCookie("accessToken", { httpOnly: true, secure: true })
    .json({ message: "user logged out successfully" });
};
const getCurrentUser=async(req,res)=>{

  const user=await User.findById(req.user.userId,'-password ')

  return res.status(200).json({"data":user,"message":"user fetched successfully"});
}
const toggleUserStatus=async(req,res)=>{
try {
    const {userId}=req.body;
  
    const user=await User.findByIdAndUpdate(userId).select("-password -v");
  
    if (!user)
    {
      return res.status(404).json({"message":"user does not exists"}) 
    }
  
    user.isActive=!user.isActive;
    await user.save();
  
    return res.status(200).json({"message":"user status changed"})
} catch (error) {
  return res.status(500).json({"message":"internal server error"})
}
}

const getUsers=async(req,res)=>{
  const users=await User.find({});

  return res.status(200).json({"message":"users fetched successfully","data":users})
}

export {register,login,refresh,logout,getCurrentUser,toggleUserStatus}