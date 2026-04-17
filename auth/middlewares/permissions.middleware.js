import { sharedRedisClient } from "../db/redis.js";

const authorize = (resource,action) => {
  
    return async (req, res, next) => {

        // format of permission
        const reqPermisson=`${resource}:${action}`
       

        // check for authentication
       if(!req.user || !req.user.role)
       {
        return res.status(401).json({"message":"unauthorized"});
       }
       
       // checks for roles in the roles array (a user can have many roles)

       for (const el of req.user.role) {

            // validates the permission in the user token
           const hasAccess = await sharedRedisClient.sIsMember(`role:perms:${el}`, reqPermisson);
           if (hasAccess) return next();
       }
        
        return res.status(403).json({"message":"forbidden"})

  };
};

export default authorize