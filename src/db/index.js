import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectToDB =  async()=>{
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Db is connected on " + connection.connection.host);
    } catch (error) {
        console.log("mongoose connection error"+error.message);
        process.exit(1)
    }
}

