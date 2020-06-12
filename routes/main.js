var express = require('express');
var router = express.Router();
let Course=require('../models/course');
let Post=require('../models/post');
let User=require('../models/user');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const config = require('../config/database');
var path = require('path');
let metadata;

const storage = new GridFsStorage({
    url: config.database,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                    metadata: metadata?metadata:null
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });


router.get('/', ensureAuthenticated, function (req,res,next) {
    res.render('main');
})
router.get('/course/:id/view', ensureAuthenticated, function (req,res,next) {
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
                                res.render('posts', {post: post, course:course, current_course:req.params.id, user:req.user});
                                return;
                            }
                        });
                    }
                });

        }
        });
});

router.get('/course/:id/create', ensureAuthenticated, function (req,res,next) {
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

router.post('/course/:id/create', ensureAuthenticated, upload.array('files',50), function (req,res,next) {
        let p= new Post();
        p.no_of_dislikes=0;
        p.no_of_likes=0;
        p.author=req.user.name;
        p.content=req.body.content;
        p.tag = req.body.tags.split(',');
        Course.find({course_id:req.params.id},{},function(err1,course1){
            if (err1) {
                console.log('No such entry');
                return;
            }
            else {
                Course.find({sem_id: course1[0].sem_id}, {}, function (err, course) {
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
                                metadata = p._id;
                                req.files.forEach(function(file){
                                    file.metadata = req.user.id;
                                    console.log("what");
                                    console.log(file.metadata);
                                })

                                 req.flash('success', 'Post created successfully!');
                                 return res.redirect('/main/course/'+req.params.id+'/view');
                         }
                 });
             }
         });
     }
 });
 });



router.post('/course/:id/view', ensureAuthenticated, function (req,res,next) {
    //console.log(req.body.searchBy);
    console.log('hello');
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
                            res.render('posts', {post: arrUnique, course:course, current_course:req.params.id, user:req.user});
                            return;
                        }
                    });
                }
            });


        }
    })
});
router.get('/profile', ensureAuthenticated, function (req,res,next) {
        console.log(req.user);
        res.render('showProfile',{user:req.user});
});


router.get('/:id', ensureAuthenticated, function (req,res,next) {
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

router.post('/editProfile', ensureAuthenticated, function (req, res, next) {
    if(req.body.name=='') {
        req.user.name = req.user.name;
    }
    else{
        var name=req.user.name;
        req.user.name = req.body.name;
        Post.find({author:name},{},function(err,post){
            console.log('this is'+post);
            if(err){
                return;
            }
            else{
                post.forEach(function (item) {
                    item.author = req.body.name;
                    item.no_of_likes=item.no_of_likes;
                    item.no_of_dislikes=item.no_of_dislikes;
                    item.content=item.content;
                    item.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                })
            }
        })
    }

    if(req.body.email=='') {
        req.user.email = req.user.email;
    }
    else{
        req.user.email = req.body.email;
    }

    if(req.body.username=='') {
        req.user.username = req.user.username;
    }
    else{
        req.user.username = req.body.username;
    }

    if(req.body.password=='') {
        req.user.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                req.flash('success', 'Successfully Updated Profile!');
                res.redirect('/main/editProfile');
            }
        });
    }

    else {
        req.user.password = req.body.password;
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.user.password, salt, function (err, hash) {
                if (err) {
                    console.log(err);
                } else {
                    req.user.password = hash;
                    req.user.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.flash('success', 'Successfully Updated Profile!');
                            res.redirect('/main/editProfile');
                        }
                    });
                }
            });
        });
    }
})

router.get('/profile/myposts', ensureAuthenticated, function (req,res,next) {
    console.log(req.user.name);
    Post.find({author:req.user.name},{},function(err,post){
        console.log(post);
        if(err){
            return;
        }
        else{
            res.render('showMyPosts',{post:post});
            return;
        }
    })
});

router.get('/:id/like', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_liked.indexOf(req.params.id) === -1)
        {
            post.no_of_likes = post.no_of_likes + 1;
            user.posts_liked.push(req.params.id);
        }

        if (user.posts_disliked.indexOf(req.params.id) !== -1)
        {
                post.no_of_dislikes = post.no_of_dislikes - 1;
                user.posts_disliked.splice(user.posts_disliked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Post.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/course/' + post.course_id + '/view');
                    }
                })
            }
        })

    })
});

router.get('/:id/dislike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_disliked.indexOf(req.params.id) === -1)
        {
            post.no_of_dislikes = post.no_of_dislikes + 1;
            user.posts_disliked.push(req.params.id);
        }

        if (user.posts_liked.indexOf(req.params.id) !== -1)
        {
            post.no_of_likes = post.no_of_likes - 1;
            user.posts_liked.splice(user.posts_liked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Post.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/course/' + post.course_id + '/view');
                    }
                })
            }
        })

    })
})

function ensureAuthenticated(req,res,next)
{
    if(req.isAuthenticated()) {
        return next();
    }
    else {
        req.flash('danger','Not logged in!');
        res.redirect('/login');
    }
}

module.exports = router;