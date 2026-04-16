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

const AuthLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 20, 
	standardHeaders: 'draft-8', 
	legacyHeaders: false,
	ipv6Subnet: 56, 
})
const orderLimiter = rateLimit({  // 50 request per minute
	windowMs: 60 * 1000, 
	limit: 10, 
	standardHeaders: 'draft-8', 
	legacyHeaders: false,
	ipv6Subnet: 56, 

})

const authProxy=createProxyMiddleware({
    target:`${process.env.AUTH_SERVICE_URL}/auth`,
    changeOrigin:true,
    xfwd: true,
    logger:console,
})
const orderProxy=createProxyMiddleware({
    target:`${process.env.ORDER_SERVICE_URL}`,
    changeOrigin:true,
    xfwd: true,
    logger:console
})

app.get("/",(req,res)=>{
   return res.status(200).json({"message":"api is healthy"})
})
app.use("/auth",AuthLimiter,authProxy)
app.use("/orders",orderLimiter,orderProxy)

app.listen(process.env.API_GATEWAY_PORT,()=>{
    console.log("api gateway listening on port 4000")
})