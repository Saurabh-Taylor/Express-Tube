import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";




const registerUser =asyncHandler( async (req, res) =>{
    const {username , fullName , email , password} = req.body
    if([username , fullName , email , password].some((field)=>field?.trim( )==="")){
        throw new ApiError(400,"Please provide all fields" );
    };

    const existedUser = await User.findOne({
        $or:[{ username } , { email }]
    })

    if(existedUser){
        throw new ApiError(409 , "user already exists")
    }

    console.log("req files:" , req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log("local file path:",avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("local cover path:",coverImageLocalPath);
    console.log("before cloudinary");
    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar is required')
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("after");

    console.log("avatar image",avatar);

    if(!avatar ){
        throw new ApiError(401 , "avatar and coverImage is required ")
    }

    const user = await User.create({
        fullName, 
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase() 
    })

    const  createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500,"Server Error while registering a user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser , "User registered Successfully" ))

})

export {registerUser}