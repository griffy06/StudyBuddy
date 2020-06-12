const mongoose = require('mongoose');

const CommentSchema = mongoose.Schema({
    post_id:{
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
});

const Comment = module.exports = mongoose.model('Comment', CommentSchema);