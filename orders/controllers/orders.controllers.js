import Order from "../models/orders.models.js";

const createOrder=async(req,res)=>{
   try {
     const {total}=req.body
     await Order.create({ownerId:req.user.userId,total:500})
     return res.json(200,"order created")
   } catch (error) {
    console.log(error);
   }

};
const deleteOrder=async(req,res)=>{
    try {
        const {orderId}=req.params;
    
        if (!orderId)
        {
            return res.status(400).json({
                "message":"order id not found"
            })
        }
    
        const order=await Order.findById(orderId);
        console.log(order)
        if (!order)
        {
        return res.status(404).json({ message: "Order not found" });
        }
    
        // only owner can delete the order
        if (order.ownerId!==req.user.userId)
        {
                return res.status(403).json({ message: "you cannot delete others order" });
        }
    
        await order.deleteOne();
    
      return res.status(200).json({"message":"order deleted"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({"message":"internal server error"})
    }
};
const getAllOrders=async(req,res)=>{
   try {
     const orders=await Order.find({ownerId:req.user.userId});
     return res.status(200).json({"data":orders,"message":"orders fetched successfully"})
 
   } catch (error) {
    console.log(error);
    return res.status(500).json({"message":"internal server error"});
   }
};


export {getAllOrders,deleteOrder,createOrder};