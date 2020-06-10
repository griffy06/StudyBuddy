var express = require('express');
var router = express.Router();
let Course=require('../models/course');
let Post=require('../models/post');

router.get('/', function (req,res,next) {
    res.render('main');
})
router.get('/course/:id/view', function (req,res,next) {
    // console.log('done');
    //let course= Course.find({course_id:req.params.id});
        Post.find({course_id:req.params.id},{},function (err, post){
        if(err){
            console.log('No such entry');
            return;
        }
        else {
            Course.find({sem_id:post.sem_id},{},function(err1,course){
                console.log(course);
                if (err1) {
                    console.log('No such entry');
                    return;
                }
                else{
                    res.render('posts', {post: post, course:course, current_course:req.params.id});
                }
            });
        }
        });
});

router.get('/:id', function (req,res,next) {
    console.log(req.params.id);
    Course.find({sem_id:req.params.id},{}, function (err, course) {
        if (err) {
            console.log('No such entry');
            return;
        } else {
            console.log(course);
            res.render('courses', {course: course, sem:req.params.id});
        }
    });
});

module.exports = router;