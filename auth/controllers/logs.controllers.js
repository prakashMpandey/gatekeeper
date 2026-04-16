import AuditLog from "../models/auditlog.js";

const getLogs=async(req,res)=>{
    const logs=await AuditLog.find({});

    return res.status(200).json({"data":logs,"message":"audit logs fetched successfully"})
}
export {getLogs};