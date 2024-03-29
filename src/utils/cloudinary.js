import {v2 as cloudinary} from 'cloudinary';

import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.cloud_name , 
  api_key: process.env.api_key ,
  api_secret: process.env.api_secret 
});


export const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response  = await cloudinary.uploader.upload(localFilePath , {resource_type:'auto'})

        console.log("response of cloudinary :",response);
        
        // file has been successfully upload
        console.log("file is uploaded on cloudinary" , response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local file saved
        return null
    }
}

