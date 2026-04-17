import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import cookieParser from "cookie-parser"
import {rateLimit} from "express-rate-limit"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config();
const app=express()

app.use(cors({
    origin: "*",
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


// adding limit to the authentication service
const AuthLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 20, 
	standardHeaders: 'draft-8', 
	legacyHeaders: false,
	ipv6Subnet: 56, 
})

// rate limiting properties for the order service
const orderLimiter = rateLimit({  // 50 request per minute
	windowMs: 60 * 1000, 
	limit: 10, 
	standardHeaders: 'draft-8', 
	legacyHeaders: false,
	ipv6Subnet: 56, 

})

// auth proxy
const authProxy=createProxyMiddleware({
    target:`${process.env.AUTH_SERVICE_URL}/auth`,
    changeOrigin:true,
    xfwd: true,
    logger:console,
})

// order proxy
const orderProxy=createProxyMiddleware({
    target:`${process.env.ORDER_SERVICE_URL}`,
    changeOrigin:true,
    xfwd: true,
    logger:console
})
// check if the api healthy
app.get("/",(req,res)=>{
   return res.status(200).json({"message":"api is healthy"})
})

/// send the authentication routes to auth service
app.use("/auth",AuthLimiter,authProxy)

// send the order routes to order service
app.use("/orders",orderLimiter,orderProxy)

app.listen(process.env.API_GATEWAY_PORT,()=>{
    console.log("api gateway listening on port 4000")
})