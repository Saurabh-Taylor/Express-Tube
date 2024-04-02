import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken  = user.generateAccessToken()
        const refreshToken  = user.generateRefreshToken()

        user.refreshToken = refreshToken
 
        await user.save({validateBeforeSave: false}) // To bypass the token validation in order to update the refreshToken
        
        return{accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went Wrong while generating refresh and access tokens")
    }
}

 +954
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
    if (!email || !username){
        throw new ApiError(400, "email or username is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(401,"User Doesn't Exist")
    }

    const isPasswordValid  = await user.checkPassword(password)
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

export {registerUser , loginUser , logoutUser}