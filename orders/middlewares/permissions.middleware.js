import { sharedRedisClient } from "../db/redis.js";

const authorize = (resource,action) => {
  
    return async (req, res, next) => {
        const reqPermisson=`${resource}:${action}`
       
       if(!req.user || !req.user.role)
       {
        return res.status(401).json({"message":"unauthorized"});
       }
       
       // check the roles 
       for (const el of req.user.role) {

        // if the role has the req permissions
           const hasAccess = await sharedRedisClient.sIsMember(`role:perms:${el}`, reqPermisson);
           if (hasAccess) return next();
       }
        
        return res.status(403).json({"message":"forbidden"})

  };
};

export default authorize