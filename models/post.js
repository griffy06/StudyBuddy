const mongoose = require('mongoose');

//user schema
const PostSchema = mongoose.Schema({
    course_id:{
      type:String,
      required:true
    },
    sem_id:{
        type:String,
        required:true
    },

    author:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    no_of_likes:{
        type:Number,
        required:true
    },
    no_of_dislikes:{
        type:Number,
        required:true
    },
    authorid:{
        type:String,
        required:true
    },
    tag:{
        type: Array,
        required: true
    },
    fileField:{
        type: Array,
        required:false
    }
});

const Post = module.exports = mongoose.model('Post', PostSchema);