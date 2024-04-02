import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res) => {
    try {
        const token  = req.cookies?.accessToken || req.header("Authorization").split(" ")[0]
        if(!token){
            throw new ApiError(401, 'Unauthorized Request')
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            // Nextvideo: Discuss about the frontend
    
            throw new ApiError(401,  "Invalid Access")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Token")
    }

})
 

export default verifyJWT