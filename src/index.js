import { connectToDB } from "./db/index.js";

import { app } from "./app.js";

import dotenv from "dotenv";
dotenv.config()


connectToDB()
.then(()=>{
    app.listen(process.env.PORT || 3001, () => console.log("Server is running on port", process.env.PORT))
})  
.catch((err)=> console.log("Mongo Db Connection failed",err.message))


