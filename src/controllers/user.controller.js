import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


import dotenv from "dotenv";
dotenv.config()



const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)

        const accessToken  =   user.generateAccessToken()

        console.log("accessToken", accessToken);
        const refreshToken  = await user.generateRefreshToken()
        console.log("refreshToken", refreshToken);

        user.refreshToken = refreshToken
 
        await user.save({validateBeforeSave: false}) // To bypass the token validation in order to update the refreshToken
        
        return{accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went Wrong while generating refresh and access tokens")
    }
}


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

    // console.log("req files:" , req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log("local file path:",avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log("local cover path:",coverImageLocalPath);
    if(!avatarLocalPath || !coverImageLocalPath){
        throw new ApiError(400,'Avatar and CoverImage is required')
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log("avatar image",avatar);

    if(!avatar || !coverImage ){
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

const loginUser = asyncHandler(async (req ,res)=>{

    const {email , username , password} = req.body
    if (!email && !username){
        throw new ApiError(400, "email or username is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(401,"User Doesn't Exist")
    }

    const isPasswordValid  = await user.checkPassword(password)
    console.log(isPasswordValid);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password")
    }

    const {refreshToken , accessToken} =  await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken", refreshToken , options)
    .json(
        new ApiResponse(200 , {user:loggedInUser , accessToken , refreshToken} , "User Logged In SuccessFully")
    )
})

const logoutUser = asyncHandler(async (req , res)=> {
    User.findByIdAndUpdate(req.user._id , 
        {
            $set:{
            refreshToken:undefined
            }
        }, {new:true}
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
        .clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(new ApiResponse(200, {} , "User Logged Out"))

})


// a particular endpoint for frontend to refresh the user again
const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Refresh Token")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401 , "Invalid Refresh Token")
        }
        
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401 , "Refresh Token Expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(201)
            .cookie("accessToken" , accessToken , options )
            .cookie("refreshToken" , refreshToken , options)
            .json(new ApiResponse(200 , {accessToken , refreshToken} , "Access Token Refreshed SuccessFully"))
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body
    const user  = await User.findById(req.user?._id)

    const isPasswordValid = await user.checkPassword(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(401 , "Old Password incorrect")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res.status(201).json(new ApiResponse(201 , {},"Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req,res)=> {
    return res.status(201).json(new ApiResponse(200 , req.user , "current user fetch successfully"))
})


const updateAccountDetails = asyncHandler(async (req,res)=>{

    const {fullName , email} = req.body

    if(!fullName || !email){
        throw new ApiError(401 , "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id , {
        $set:{
            fullName ,
            email
        }
    } , {new:true}).select("-password -refreshToken") //we are using new:true so that we can get updated data from mongoDB

    return res.status(200).json(new ApiResponse(201 , user ,  "Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(res,res)=>{
    const avatarLocalPath = req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"No Avatar Uploaded ")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar.url){
        throw new ApiError(400,"Error While Uploading Avatar ")
    }

    const user  = User.findByIdAndUpdate(req.user?._id , {$set:{avatar:avatar.url}} , {new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200 , user , "Avatar Image Updated SuccessFully"))

})

const updateUserCoverImage = asyncHandler(async(res,res)=>{
    const coverImageLocalPath = req.files?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"No Cover Image Uploaded ")
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url){
        throw new ApiError(400,"Error While Uploading Cover Image ")
    }

    const user  = User.findByIdAndUpdate(req.user?._id , {$set:{coverImage:coverImage.url}} , {new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200 , user , "Cover Image Updated SuccessFully"))
})

export {registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword ,getCurrentUser ,updateAccountDetails ,updateUserAvatar , updateUserCoverImage}