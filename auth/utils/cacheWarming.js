import Role from "../models/roles.models.js";
import { sharedRedisClient } from "../db/redis.js"; // Assuming you use the shared client for gateway/orders

export const loadRolesIntoCache = async () => {
    try {
        console.log(" Loading roles and permissions....");
        

        // check the roles 
        const roles = await Role.find({}).populate("permissions");
        
        for (const role of roles) {
            const cacheKey = `role:perms:${role.name}`;
            
            // check the permissions array
            const formattedPermissions = role.permissions.map(p => `${p.resource}:${p.action}`);

            // delete the existing cache
            await sharedRedisClient.del(cacheKey);
            
            // if the permissions exists 
            if (formattedPermissions.length > 0) {

                // add the data in the cache
                await sharedRedisClient.sAdd(cacheKey, formattedPermissions);
            }
        }
        
        console.log(`Cache Warming Complete: ${roles.length} roles loaded into Redis.`);
    } catch (error) {
        console.error("Failed to load roles into cache during startup:", error);
    }
};