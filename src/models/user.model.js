import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema  = new Schema({
    username:{
        type:String,
        required:[true , "username is required"],
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:[true , "email is required"],
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:[true , "username is required"],
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url
        required:[true , "image is required"]
    },
    coverImage:{
        type:String, // cloudinary url
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true , "password is required"]
    },
    refreshToken:{
        type:String
    }
} , {timestamps:true})

userSchema.pre('save' , async function(next){ 
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password , 10) ;
    next()
});

userSchema.methods.checkPassword = async function (password) {
   return await bcrypt.compare(password , this.password);
};


// both are jwt tokens
userSchema.methods.generateAccessToken =  function(){
    const payload = { _id:this._id , email:this.email , username:this.username , fullName:this.fullName  }
    return jwt.sign(payload , process.env.ACCESS_TOKEN_SECRET , {expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}
userSchema.methods.generateRefreshToken = async ()=>{
    const payload = { _id:this._id  }
    return jwt.sign(payload , process.env.REFRESH_TOKEN_SECRET , {expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}


export const User = mongoose.model( 'User', userSchema );