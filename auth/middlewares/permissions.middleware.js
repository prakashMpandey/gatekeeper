const authorize = (resource,action) => {
  
    return (req, res, next) => {
        const reqPermisson=`${resource}:${action}`
       
       if(!req.user || !req.user.perms)
       {
        return res.status(401).json({"message":"unauthorized"});
       }
       const user_permissions=req.user.perms;

        if (user_permissions.includes(reqPermisson))
        {
            return next()
        }
        return res.status(403).json({"message":"forbidden"})

  };
};

export default authorize