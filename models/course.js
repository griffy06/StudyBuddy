const mongoose = require('mongoose');

//user schema
const CourseSchema = new mongoose.Schema({
    sem_id:{
        type:String,
        required:true
    },
    course_id:{
        type:String,
        required:true
    },
    course_name:{
        type:String,
        required:true
    },
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;