import {v2 as cloudinary} from 'cloudinary';
import dotenv from "dotenv";
dotenv.config()


import fs from "fs";

          
cloudinary.config({ 
  cloud_name: process.env.cloud_name , 
  api_key: process.env.api_key ,
  api_secret: process.env.api_secret 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}

