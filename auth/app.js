import express, { urlencoded } from "express"
import connectDB from "./db/mongo.js"
import { ErrorResponse } from "./utils/ApiResponse.js"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { redisClient } from "./db/redis.js"
import { loadRolesIntoCache } from "./utils/cacheWarming.js"
dotenv.config()
const app=express()

app.use(express.urlencoded({"extended":true}))
app.use(express.json())
app.use(cookieParser())


app.get("/health",(req,res)=>{
    console.log("server is healthy")
})



import userRouter from "./routes/users.routes.js"
import roleRouter from "./routes/roles.routes.js"
import permissionRouter from "./routes/permissions.routes.js"
import { AuditWorker } from "./services/audit.services.js"


app.use("/auth",userRouter)
app.use("/auth/roles",roleRouter)
app.use("/auth/permissions",permissionRouter);




AuditWorker();
console.log("audit server started")
connectDB().then(async()=>{
    await loadRolesIntoCache();
    app.listen(3000,()=>{
        console.log("server is running on port 3000")
})
}).catch((err)=>{
    console.log(err)
    return ErrorResponse(500,"internal server error")
})





