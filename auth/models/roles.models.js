import mongoose,{Schema,Types} from "mongoose"
import Permission from "./permissions.models.js";
const roleSchema=new Schema({
id:String,
name:{
    type:String,
    unique:true,
    lowercase:true
},
description:{
    type:String,
    lowercase:true,
},
permissions:[
    {
        type:Schema.Types.ObjectId,
        ref:"Permission"
    }
]
})

const Role=mongoose.model("Role",roleSchema)

export default Role;