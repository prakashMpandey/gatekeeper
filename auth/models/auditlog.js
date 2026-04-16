import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  userId: String,
  action: String,   
  resource: String,  
  path: String,      
  statusCode: Number, 
  timestamp: { type: Date, default: Date.now }
});

const AuditLog= mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;