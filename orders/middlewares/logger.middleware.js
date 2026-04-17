
import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();
const auditQueue = new Queue("audit-logs", {
  connection: { host: process.env.REDIS_HOST || "localhost", port: process.env.REDIS_PORT || 6379,db:process.env.SHARED_DB || 1 }
});

export const auditLogger = (resource) => {
  return (req, res, next) => {

    console.log("middleware hit")
    res.on("finish", async () => {
      try {
        await auditQueue.add("log-action", {
          userId: req.user?.userId || "GUEST",
          action: req.method,
          resource:resource,
          path: req.originalUrl,
          statusCode: res.statusCode,
        }, { 
          attempts: 3, 
          backoff: 5000 
        });
      } catch (err) {
        console.error("Queueing Error:", err);
      }
    });
    next();
  };
};