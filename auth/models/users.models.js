import mongoose,{Schema} from "mongoose"
import bcrypt from "bcryptjs"
import Role from "./roles.models.js"

const userSchema=new Schema({
    email:{
        type:String,
        lowercase:true,
        unique:true
    },
    password:{type:String},
    isActive:{
        type:Boolean,
        default:true
    },
    role:[
        {
            type:Schema.Types.ObjectId,
            ref:"Role"
        }
    ]
},{timestamps:true})


  userSchema.pre("save", async function(){
        if(!this.isModified("password")) return ;

        
            this.password= await bcrypt.hash(this.password,10)
         

    })

    userSchema.methods.verifyPassword=async function(password){

        const result=await bcrypt.compare(password,this.password);
        return result;
    }

const User=mongoose.model("User",userSchema)

export default User;