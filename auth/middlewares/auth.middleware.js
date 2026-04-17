import jwt from "jsonwebtoken";
const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
import {sharedRedisClient} from "../db/redis.js"

const verifyJWT=async(req,res,next)=>{
 try {

        //checks access token in both cookie and authorization header
       const accessToken=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();

       // if no access token in the cookie
       if(!accessToken)
       {
           return res.status(401).json({"message":"unauthorized"})
       }

       // checks if the token is already blacklisted
       const isTokenBlackListed=await sharedRedisClient.get(accessToken);

       // if the token is blacklisted then return 
       if(isTokenBlackListed)
       {
        return res.status(401).json({"message":"unauthorized"})
       }


       // decode the token 
       const decodedToken=jwt.verify(accessToken,privateKey,{algorithm:'RS256'});
        
       // if the token is not decocded return 
       if(!decodedToken)
       {
           return res.status(401).json({"message":"unauthorized"})
       }
    
       // adding user object in the requect object
       req.user={
        userId:decodedToken?.userId,
        isActive:decodedToken?.isActive,
        role:decodedToken?.role
       }
       next();
 } catch (error) {

        return res.status(500).json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
        });

    
 }

}

export default verifyJWT;