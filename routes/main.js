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
            Course.find({sem_id:post[0].sem_id},{},function(err1,course){
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

router.get('/course/:id/create', function (req,res,next) {
    // console.log('done');
    //let course= Course.find({course_id:req.params.id});
            Course.find({course_id:req.params.id},{},function(err1,course1){
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                }
                else {
                    Course.find({sem_id: course1[0].sem_id}, {}, function (err1, course) {
                        console.log(course);
                        if (err1) {
                            console.log('No such entry');
                            return;
                        } else {
                            res.render('create_post', {course: course, current_course: req.params.id});
                        }
                    });
                }
            });
});

router.post('/course/:id/create', function (req,res,next) {
    // console.log('done');
    //let course= Course.find({course_id:req.params.id});
    let p= new Post();
    p.no_of_dislikes=0;
    p.no_of_likes=0;
    p.author=req.body.author;
    p.content=req.body.content;

    Course.find({course_id:req.params.id},{},function(err1,course1){
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                }
                else {
                    Course.find({sem_id: course1[0].sem_id}, {}, function (err, course) {
                        console.log(course);
                        if (err) {
                            console.log('No such entry');
                            return;
                        } else {
                            p.course_id=req.params.id;
                            p.sem_id=course1[0].sem_id;
                            p.save(function(err2){
                                if(err2){
                                    console.log(err2);
                                }
                            else{
                                res.render('courses', {course: course, sem: course[0].sem_id});
                        }
                    });
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
            //console.log(course);
            res.render('courses', {course: course, sem:req.params.id});
        }
    });
});

module.exports = router;