import mongoose,{Schema,Types} from "mongoose"

const permissionSchema=new Schema({
resource: String ,
action: {
    type:String,
    enum:["read","write","delete"],
    default:"read"
}
})

const Permission=mongoose.model("Permission",permissionSchema)

export default Permission;