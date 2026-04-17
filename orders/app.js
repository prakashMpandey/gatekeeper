import express from "express"
import connectDB from "./db.config.js"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import authorize from "./middlewares/permissions.middleware.js"
import  {createOrder,deleteOrder,getAllOrders} from "./controllers/orders.controllers.js";
import verifyJWT from "./middlewares/auth.middleware.js"
import { auditLogger } from "./middlewares/logger.middleware.js"
import { sharedRedisClient } from "./db/redis.js"
dotenv.config()
const app=express()


app.use(express.urlencoded({"extended":true}))
app.use(express.json())
app.use(cookieParser())


app
.route("/")
.all(verifyJWT)  //v check the authentication
.get(authorize("orders","read"),auditLogger("orders"),getAllOrders)
.post(authorize("orders","write"),authorize("orders","delete"),auditLogger("orders"),createOrder)  // add the logs


app.delete("/:orderId",verifyJWT,authorize("orders","delete"),auditLogger("orders"),deleteOrder)


connectDB()
.then(()=>{
    app.listen(3010,()=>{
        console.log("server is running on port 3010")
        
    })
})
.catch((err)=>{
    console.log(err)
    return;
})




