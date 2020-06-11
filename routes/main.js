var express = require('express');
var router = express.Router();
let Course=require('../models/course');
let Post=require('../models/post');
//let go=require('../app');

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
             Course.find({course_id:req.params.id},{},function(err1,course1) {
                    console.log(course1);
                    if (err1) {
                        console.log('No such entry');
                        return;
                    } else {
                        Course.find({sem_id:course1[0].sem_id},{},function(err2,course){
                            //console.log(course);
                            if (err2) {
                                console.log('No such entry');
                                return;
                            }
                            else{
                                res.render('posts', {post: post, course:course, current_course:req.params.id});
                                return;
                            }
                        });
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
    p.tag = req.body.tags.split(',');

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
                                   return res.redirect('/main/course/'+req.params.id+'/view');
                            }
                    });
                }
            });
        }
    });

});

router.post('/course/:id/view', function (req,res,next) {
    console.log(req.body.searchBy);
    let tags = req.body.searchBy.split(',');
    let arr=[];
    Post.find(function (err,post) {
        if(err) console.log(err);
        else
        {
            post.forEach(function (temp) {
                    tags.forEach(function (tag) {
                            if (temp.tag.indexOf(tag) !== -1) {
                                arr.push(temp);
                            }

                    })
            })
            let arrUnique = [];
            arr.forEach(function (arr_element) {
                if(arrUnique.indexOf(arr_element)===-1)
                    arrUnique.push(arr_element);
            })
            console.log(arrUnique);
            Course.find({course_id:req.params.id},{},function(err1,course1) {
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                } else {
                    Course.find({sem_id:course1[0].sem_id},{},function(err2,course){
                        //console.log(course);
                        if (err2) {
                            console.log('No such entry');
                            return;
                        }
                        else{
                            res.render('posts', {post: arrUnique, course:course, current_course:req.params.id});
                            return;
                        }
                    });
                }
            });


        }
    })
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