import jwt from "jsonwebtoken";
const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
import {redisClient} from "../db/redis.js"

const verifyJWT=async(req,res,next)=>{
 try {
       const accessToken=req.cookies?.accessToken;


       if(!accessToken)
       {
           return res.status(401).json({"message":"invalid access"})
       }

       if(redisClient.get(accessToken)==='blacklisted')
       {
        return res.status(401).json({"message":"unauthorized"})
       }

       const decodedToken=jwt.verify(accessToken,privateKey,{algorithm:'RS256'});
        console.log(decodedToken)
       if(!decodedToken)
       {
           return res.status(401).json({"message":"unauthorized"})
       }
    
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