const mongoose = require('mongoose');

//user schema
const UserSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    posts_liked:{
        type:Array,
        required:false
    },
    posts_disliked:{
        type:Array,
        required:false
    },
    posts_bookmarked:{
        type:Array,
        required:false
    },
    comments_liked:{
        type:Array,
        required:false
    },
    comments_disliked:{
        type:Array,
        required:false
    },
    pic:{
        type:String,
        required:false
    }
});

const User = module.exports = mongoose.model('User', UserSchema);