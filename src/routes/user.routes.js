import {Router} from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(upload.fields([{name:"avatar" , maxCount:1} , {name:"coverImage" ,maxCount:1}]) , registerUser)
router.route("/login").post(loginUser)

// secured Routes
router.route("/logout").get(verifyJWT , logoutUser)
router.route("/refresh-token").get(refreshAccessToken)

export default router

