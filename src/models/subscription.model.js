import mongoose, { Schema } from "mongoose";

const subscriptionSchema  = new mongoose.Schema({
    // one who is subscribing
    subscribers:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    // one who is getting subscribed
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

} , {timestamps:true})



export  const Subscription = mongoose.model("Subscription",subscriptionSchema)