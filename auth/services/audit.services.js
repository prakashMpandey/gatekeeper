
import { Worker } from "bullmq";
import AuditLog from "../models/auditlog.js";

export const AuditWorker = () => {
  const worker = new Worker("audit-logs", async (job) => {

      console.log("helllo")
    const { userId, action, resource, path, statusCode } = job.data;
    
  
    await AuditLog.create({ userId, action, resource, path, statusCode });
    
    console.log(`[Audit Saved]: ${action} on ${resource} by ${userId}`);
  }, {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT,db:process.env.SHARED_DB }
  });

  worker.on("failed", (job, err) => console.log(`Job ${job.id} failed: ${err.message}`));
};