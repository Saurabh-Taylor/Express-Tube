import { Schema , model } from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        type:String,  //cloudinary url
        required:[true , "video file is required"]
    },
    thumbnail:{
        type:String,  
        required:[true , "Thumbnail is required"]
    },
    title:{
        type:String,  
        required:[true , "title is required"]
    },
    description:{
        type:String,  
        required:[true , "description is required"]
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Number,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref: 'User'
    }
    
}, {timestamps:true})

// we have to use this aggregate package before exporting model

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = model( 'Video', videoSchema) 