import mongoose,{Schema,Types} from "mongoose"

const orderSchema=new Schema({
    ownerId:{
        type:String
    },
    orderStatus:{
        type:String,
        enum: ['pending','confirmed','delivered','cancelled'],
        default: 'pending'
    },
    total:Number
},{timestamps:true})

const Order=mongoose.model("Order",orderSchema)

export default Order;