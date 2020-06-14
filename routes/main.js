var express = require('express');
var router = express.Router();
let Course=require('../models/course');
let Post=require('../models/post');
let User=require('../models/user');
const bcrypt = require('bcryptjs');
let Comment=require('../models/comment');
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
                const filename = file.originalname;
                //const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                  //  metadata: metadata?metadata:null
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

const upload2 = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            //req.flash('danger', 'Only images are allowed as file types!');
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true);
    }
}).single('pic');

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
                                global.gfs.files.find().toArray(function (err,files) {
                                    if(err) console.log(err);
                                    else
                                    {
                                        //console.log(files);
                                        User.find(function (err, users) {
                                            if(err) console.log(err);
                                            else
                                                res.render('posts', {files: files,post: post, course:course, current_course:course1[0], user:req.user, users:users, purpose:'view'});

                                        })
                                        //return;
                                    }
                                })

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
        p.authorid=req.user.username;
        p.no_of_comments=0;
        p.topic = req.body.topic;
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
                        req.files.forEach(function (fileobj) {
                            p.fileField.push(fileobj.id);
                        })

                        p.save(function(err2){
                            if(err2){
                                console.log(err2);
                            }
                            else{

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
          //  console.log(arrUnique);
            Course.find({course_id:req.params.id},{},function(err1,course1) {
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                } else {
                    console.log(course1);
                    Course.find({sem_id:course1[0].sem_id},{},function(err2,course){
                        if (err2) {
                            console.log('No such entry');
                            return;
                        }
                        else{
                            global.gfs.files.find().toArray(function (err, files) {
                                if(err) console.log(err);
                                else{
                                    User.find(function (err, users) {
                                        if(err) console.log(err);

                                        else{
                                            if(req.body.searchBy==='')
                                            {
                                                res.redirect('/main/course/'+req.params.id+'/view');
                                            }

                                            else
                                            {
                                                res.render('posts', {post: arrUnique, course:course, current_course:course1[0], user:req.user, users:users, files:files, purpose:'search'});
                                            }
                                        }

                                    })
                                }


                            })
                        }
                    });
                }
            });


        }
    })
});
router.get('/profile', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user);
    global.gfs.files.find().toArray(function (err, files) {
        if(err) console.log(err);
        else
            res.render('showProfile',{url:'main',user:req.user,viewer:'me',files:files});
    })

});
router.get('/:id/profile', ensureAuthenticated, function (req,res,next) {
        //console.log(req.user);
        global.gfs.files.find().toArray(function (err, files) {
            if(err) console.log(err);
            else
                res.render('showProfile',{url:'main/'+req.params.id,user:req.user,viewer:'me',files:files});
        })

});

router.get('/course/:id/view/profile', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user);
    global.gfs.files.find().toArray(function (err, files) {
        if(err) console.log(err);
        else
            res.render('showProfile',{url:'main/course/'+req.params.id+'/view',user:req.user,viewer:'me',files:files});
    })

});


router.post('/editProfile', ensureAuthenticated, function (req, res, next) {
    var original=req.user.username;
    var updated=req.body.username;
    if(req.body.name!=='') {
        req.user.name = req.body.name;
        Post.find({authorid:req.user.username},{},function(err,post){
            if(err){
                return;
            }
            else{
                post.forEach(function (item) {
                    item.author = req.body.name;
                    item.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                })
            }
        })
        Comment.find({authorid:req.user.username},{},function(err,post){
            if(err){
                return;
            }
            else{
                post.forEach(function (item) {
                    item.author = req.body.name;
                    item.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                })
            }
        })
    }

    if(req.body.email!=='') {
        req.user.email = req.body.email;
    }

    if(req.body.username!=='') {
        var username=req.user.username;
        User.find({username:req.body.username},{},function (err,user) {
            console.log(user.length);
            if(err){
                console.log(err);
            }
            else if(user.length==0){
                console.log('here');
                Post.find({authorid:username},{},function(err,post){
                    console.log('this is'+post);
                    if(err){
                        return;
                    }
                    else{
                        post.forEach(function (item) {
                            console.log(post);
                            item.authorid= req.body.username;
                            item.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        })
                    }
                })

                Comment.find({authorid:username},{},function(err,post){
                    console.log('this is'+post);
                    if(err){
                        return;
                    }
                    else{
                        post.forEach(function (item) {
                            console.log(post);
                            item.authorid= req.body.username;
                            item.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        })
                    }
                })
            }
        })
    }
    if(req.body.password!==''){
        if(req.body.password.length>=8){
            req.user.password=req.body.password;
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.user.password, salt, function (err, hash) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.user.password = hash;
                        if(req.body.username!==''){
                            User.find({username:req.body.username},{},function (err,user) {
                                if(user.length==0)
                                {
                                    req.user.username=updated;
                                    console.log(user);
                                    req.user.save(function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else{
                                            req.flash('success', 'Successfully Updated Profile!');
                                            res.redirect('/main/profile');
                                        }
                                    })
                                }
                                else{
                                    req.user.save(function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else{
                                            console.log(req.user.username);
                                            req.flash('danger', 'Username not Available.');
                                            req.flash('success', 'Other Details Updated!');
                                            res.redirect('/main/profile');
                                        }
                                    })
                                }
                            });
                        }

                        else
                        {
                            req.user.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                                else{
                                    req.flash('success', 'Successfully Updated Profile!');
                                    res.redirect('/main/profile');
                                }
                            })
                        }
                    }
                });
            });
        }
        else{
            if(req.body.username!==''){
                User.find({username:req.body.username},{},function (err,user) {
                    if(user.length==0)
                    {
                        req.user.username=updated;
                        console.log(user);
                        req.user.save(function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else{
                                req.flash('danger', 'Password must contain minimum 8 characters');
                                req.flash('success', 'Other Details Updated!');
                                res.redirect('/main/profile');
                            }
                        })
                    }
                    else{
                        req.user.save(function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else{
                                console.log(req.user.username);
                                req.flash('danger', 'Password must contain minimum 8 characters');
                                req.flash('success', 'Other Details Updated!');
                                res.redirect('/main/profile');
                            }
                        })
                    }
                });
            }

            else
            {
                req.user.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else{
                        req.flash('danger', 'Password must contain minimum 8 characters');
                        req.flash('success', 'Other Details Updated!');
                        res.redirect('/main/profile');
                    }
                })
            }
        }
    }

    else
    {
        if(req.body.username!==''){
            User.find({username:req.body.username},{},function (err,user) {
                if(user.length==0)
                {
                    req.user.username=updated;
                    console.log(user);
                    req.user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        else{
                            req.flash('success', 'Successfully Updated Profile!');
                            res.redirect('/main/profile');
                        }
                    })
                }
                else{
                    req.user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        else{
                            console.log(req.user.username);
                            req.flash('danger', 'Username not Available!');
                            req.flash('success', 'Other Details Updated!');
                            res.redirect('/main/profile');
                        }
                    })
                }
            });
        }

        else
        {
            req.user.save(function (err) {
                if (err) {
                    console.log(err);
                }
                else{
                    req.flash('success', 'Successfully Updated Profile!');
                    res.redirect('/main/profile');
                }
            })
        }
    }
})

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


router.get('/profile/myposts', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.find({authorid:req.user.username},{},function(err,post){
        console.log(post);
        if(err){
            return;
        }
        else{
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else{
                    User.find(function (err, users) {
                        if(err) console.log(err);
                        else
                        {
                            res.render('showMyPosts',{user:req.user,post:post,title:'My Posts',viewer:'me', files:files, users:users});
                        }
                    })

                }
            })

           // return;
        }
    })
});
router.get('/profile/myposts/:id/edit', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.findById(req.params.id,{},function(err,post){
        console.log(post);
        if(err){
            console.log(err);
            return;
        }
        else{
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else res.render('editPost',{post:post,title:'Edit Post', files:files});
            })

          //  return;
        }
    })
});
router.post('/profile/myposts/:id/edit', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.findById(req.params.id,{},function(err,post){
        post.topic = req.body.topic;
        post.content=req.body.content;
        post.tag=req.body.tags.split(',');
        if(err){
            return;
        }
        else{
            post.save(function(e){
                if(e){
                    console.log(e);
                }
                req.flash('success','Changes saved!');
                res.redirect('/main/profile/myposts/');
                return;
            })
        }
    })
});
router.get('/profile/myposts/:id/delete', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
   /* let temp = Post.find(function (value) {
        return value._id.toString()===req.params.id;
    })*/
   // let temp2=temp.fileField;
    Post.find({_id:req.params.id}, function (err, post) {
        if(err) console.log(err);
        else {
            console.log(post);
           /* let temp=[];
            temp=post.fileField;*/
            //console.log(temp);
            post[0].fileField.forEach(function (filetemp) {
                gfs.remove({_id: filetemp._id, root: 'uploads'}, function (err, gridStore) {
                    if (err) console.log(err);
                })
            })
        }
    })
    Post.remove({_id:req.params.id},function(err){
        if(err){
            console.log(err);
            return;
        }
        else{
            let user=req.user;
            user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
            user.posts_liked.splice(user.posts_liked.indexOf(req.params.id),1);
            user.posts_disliked.splice(user.posts_disliked.indexOf(req.params.id),1);
            User.update({_id:req.user._id},user,function(err){
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/main/profile/myposts');

                }
            })
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
router.get('/:id/bookmark', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_bookmarked.indexOf(req.params.id) === -1)
        {
            console.log('here');
            user.posts_bookmarked.push(req.params.id);
        }

        else
        {
            user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
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
router.get('/profile/bookmarks', ensureAuthenticated, function (req,res) {
    //console.log(req.user.username);
    var arr=[];
    Post.find(function(err,post){
        post.forEach(function(item){
            req.user.posts_bookmarked.forEach(function(item1){
                    if(item1==item._id)
                    arr.push(item);
                })
            })
        global.gfs.files.find().toArray(function (err, files) {
            if(err) console.log(err);
            else
            {
                User.find(function (err, users) {
                    if(err) console.log(err);
                    else
                    {
                        res.render('showMyPosts',{user:req.user,viewer:'me',post:arr,title:'Favourite Posts', users:users, files:files});
                    }
                })
            }

        })

        return;
        })
});

router.get('/profile/bookmarks/:id/delete', ensureAuthenticated, function (req,res) {
    let user=req.user;
    user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
    User.update({_id:req.user._id},user,function(err){
        if (err) {
            console.log(err);
        } else {
            res.redirect('/main/profile/bookmarks');
        }
    })
});

router.get('/:id/viewAuthor', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else
                    res.render('showProfile',{url:'main/'+req.params.id+'/viewAuthor',user:user[0], viewer:'other', files:files});
            })
           // res.render('showProfile',{user:user[0], viewer:'other'});
        }
    })
});

router.get('/course/:id1/view/:id2/viewAuthor', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id2},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else
                    res.render('showProfile',{url:'main/course/'+req.params.id1+'/view',user:user[0], viewer:'other', files:files});
            })
            // res.render('showProfile',{user:user[0], viewer:'other'});
        }
    })
});
router.get('/profile/bookmarks/:id/viewAuthor', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else
                    res.render('showProfile',{url:'main/profile/bookmarks',user:user[0], viewer:'other', files:files});
            })
            // res.render('showProfile',{user:user[0], viewer:'other'});
        }
    })
});

router.get('/:id1/comments/:id2/viewAuthor', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id2},function (err,user) {
        console.log(user[0]);
        if(err)
        {
            console.log(err);
        }
        else {
            global.gfs.files.find().toArray(function (err, files) {
                if(err) console.log(err);
                else
                    res.render('showProfile',{url:'main/'+req.params.id1+'/comments',user:user[0], viewer:'other', files:files});
            })
            // res.render('showProfile',{user:user[0], viewer:'other'});
        }
    })
});


router.get('/:id/AllPosts', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            Post.find({authorid:user[0].username},{},function(err,post){
                console.log(post);
                if(err){
                    return;
                }
                else{
                    global.gfs.files.find().toArray(function (err,files) {
                        if(err) console.log(err);
                        else
                        {
                            User.find(function (err,users) {
                                if(err) console.log(err);
                                else
                                {
                                    res.render('showMyPosts',{user:user[0],post:post,title:'All Posts by '+user[0].name,viewer:'other', files:files, users:users});
                                }

                            })
                        }

                    })

                    return;
                }
            })
        }
    })
});
router.get('/:id/comments', ensureAuthenticated, function (req,res) {
    Comment.find({post_id: req.params.id},{},function(err,comments){
        Post.find({_id:req.params.id},{},function(err1,post){
            if(err1){
                console.log(err1)
            }
            else{

                global.gfs.files.find().toArray(function (err, files) {
                    if(err) console.log(err);
                    else{
                        User.find(function (err, users) {
                            if(err) console.log(err);
                            else
                            {
                                res.render('comments',{user:req.user,courseid:post[0].course_id,postid:req.params.id,user:req.user,comments:comments,files:files, users:users});
                            }
                        })

                    }
                })
            }

        })
    })
});

router.post('/:id/post', ensureAuthenticated, function (req,res) {
    let c=new Comment();
    c.post_id=req.params.id;
    c.no_of_likes=0;
    c.no_of_dislikes=0;
    c.authorid=req.user.username;
    c.author=req.user.name;
    c.content=req.body.content;
    Post.find({_id:req.params.id},{},function(err,post) {
        if (err) {
            console.log(err)
        } else {
            post[0].no_of_comments += 1;
            post[0].save(function (err1) {
                if (err1) {
                    console.log(err1);
                } else {
                    c.save(function (err2) {
                        if (err2) {
                            console.log(err2);
                        } else {
                            res.redirect('/main/' + req.params.id + '/comments');
                        }
                    })
                }
            })
        }
    })

});

router.get('/:id/commentLike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Comment.findById(req.params.id,function(err,post) {
        if (user.comments_liked.indexOf(req.params.id) === -1)
        {
            post.no_of_likes = post.no_of_likes + 1;
            user.comments_liked.push(req.params.id);
        }

        if (user.comments_disliked.indexOf(req.params.id) !== -1)
        {
            post.no_of_dislikes = post.no_of_dislikes - 1;
            user.comments_disliked.splice(user.comments_disliked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (e) {
                console.log(e);
            } else {
                Comment.update({_id: req.params.id}, post, function (err1) {
                    if (err1) {
                        console.log(err1);
                    } else {
                        res.redirect('/main/' + post.post_id + '/comments');
                    }
                })
            }
        })
    })
});

router.get('/:id/commentDislike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Comment.findById(req.params.id,function(err,post) {
        if (user.comments_disliked.indexOf(req.params.id) === -1)
        {
            post.no_of_dislikes = post.no_of_dislikes + 1;
            user.comments_disliked.push(req.params.id);
        }

        if (user.comments_liked.indexOf(req.params.id) !== -1)
        {
            post.no_of_likes = post.no_of_likes - 1;
            user.comments_liked.splice(user.comments_liked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Comment.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/' + post.post_id + '/comments');
                    }
                })
            }
        })

    })
})

router.post('/profile/myposts/:id/edit/:fileid/delete', function (req,res) {
    gfs.remove({_id: req.params.fileid, root: 'uploads'}, function (err, gridStore) {
        if (err) console.log(err);
    })
    Post.find({_id:req.params.id},function (err, post) {
        if(err){ console.log(err); return;}
        post[0].fileField.splice(post[0].fileField.indexOf(req.params.fileid),1);
        Post.update({_id:req.params.id},post[0],function (err) {
            if(err) console.log(err);
            else{
                req.flash('success','File removed!')
                res.redirect('/main/profile/myposts/'+req.params.id+'/edit');}
                //res.redirect('/');
        })
    })
})

router.post('/profile/myposts/:id/edit/addfiles', upload.array('files', 50), ensureAuthenticated, function (req,res) {
    Post.find({_id:req.params.id}, function (err, post) {
        if(err) console.log(err);
        else
        {
            //console.log(req.files.size);
            req.files.forEach(function (file) {
                console.log("yo");
                console.log(file.id);
                post[0].fileField.push(file.id);
            })
            Post.update({_id:req.params.id},post[0],function (err) {
                if(err) console.log(err);
                else{
                    req.flash('success','Files added!')
                    res.redirect('/main/profile/myposts/'+req.params.id+'/edit');}
                //res.redirect('/');
            })
        }
    })
})

router.post('/editProfile/removepic', ensureAuthenticated, function (req, res) {
    global.gfs.files.find().toArray(function (err, files) {
        if(err) console.log(err);
        else
        {
            files.forEach(function (file) {
                if(file._id.toString === req.user.pic)
                {
                    gfs.remove({_id: file._id, root: 'uploads'}, function (err, gridStore) {
                        if (err) console.log(err);
                    })
                }
            })
            req.user.pic=null;
            User.update({_id:req.user._id},req.user,function (err) {
                if(err) console.log(err);
                res.redirect('/main/profile');
            })
        }
    })
})

router.post('/editProfile/updatepic', ensureAuthenticated, function (req,res) {
    upload2(req, res, function (err) {
        if (err) {
            req.flash('danger', 'Only images are allowed as file types!');
            return res.redirect('/main/profile');
        } else {
            global.gfs.files.find().toArray(function (err, files) {
                files.forEach(function (file) {
                    if (file._id === req.user.pic) {
                        gfs.remove({_id: file._id, root: 'uploads'}, function (err, gridStore) {
                            if (err) console.log(err);
                        })
                    }
                })
            })

            req.user.pic = req.file.id;
            User.update({_id: req.user._id}, req.user, function (err) {
                if (err) console.log(err);
                res.redirect('/main/profile');
            })
        }
    })

})
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            req.flash('danger', 'Not logged in!');
            res.redirect('/login');
        }
    }

    router.get('/image/:filename', function (req, res) {
        gfs.files.findOne({filename: req.params.filename}, function (err, file) {
            if (!file || file.length === 0) {
                return res.status(404).json({
                    err: 'No file exists'
                })
            }

            //check if image
            if (file.contentType === 'image/jpeg' || file.contentType === 'image/jpg' || file.contentType === 'image/png') {
                //read output to browser
                const readStream = gfs.createReadStream(file.filename);
                readStream.pipe(res);
            } else {
                return res.status(404).json({
                    err: 'Not an image'
                })
            }
        })


    })

    router.get('/video/:filename', function (req, res) {
        gfs.files.findOne({filename: req.params.filename}, function (err, file) {
            if (!file || file.length === 0) {
                return res.status(404).json({
                    err: 'No file exists'
                })
            }

            //check if image
            if (file.contentType === 'video/mp4' || file.contentType === 'video/ogg' || file.contentType === 'video/webm') {
                //read output to browser
                const readStream = gfs.createReadStream(file.filename);
                readStream.pipe(res);
            } else {
                return res.status(404).json({
                    err: 'Not a video'
                })
            }
        })


    })

    router.get('/document/:filename', function (req, res) {
        gfs.files.findOne({filename: req.params.filename}, function (err, file) {
            if (!file || file.length === 0) {
                return res.status(404).json({
                    err: 'No file exists'
                })
            }

            //check if image
            if (file.contentType === 'application/pdf' || file.contentType === 'application/octet-stream' || file.contentType === 'text/plain' || file.contentType === 'application/x-zip-compressed') {
                //read output to browser
                const readStream = gfs.createReadStream(file.filename);
                readStream.pipe(res);
            } else {
                return res.status(404).json({
                    err: 'Not a video'
                })
            }
        })


    })

module.exports = router;