import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()



const connectDB= async ()=>{

    try {
        const connection=await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.ORDER_DB}?authSource=admin`);
        console.log("database connection established");
    } catch (error) {

        console.log(error);
        process.exit(1);
        
    }
}

export default connectDB;