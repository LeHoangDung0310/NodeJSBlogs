const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

/** GET
 * HOME */ 
router.get('', async (req, res) => {
    try {
        const locals = {
            title: "NodeJs Blog",
            description: "Simple Blog created with NodeJs, Express & MongoDB."
        };

        let perPage = 7;
        let page = parseInt(req.query.page) || 1; // Đảm bảo `page` là số nguyên, mặc định là 1

        // Kiểm tra tham số page (phải là số dương)
        if (page < 1) {
            return res.status(400).send('Số trang không hợp lệ');
        }

        const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * (page - 1)) // Cải thiện logic phân trang
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments(); // Sử dụng countDocuments thay vì count
        const nextPage = page + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('index', { 
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi máy chủ'); // Trả về thông báo lỗi cho người dùng
    }
});
/*router.get('',async(req,res) => {
    const locals = {
     title: "NodeJs Blog",
     description: "Simple Blog created with NodeJs, Express & MongoDB."
    }
    try {
     const data = await Post.find();
     res.render('index',{locals,data});
    } catch (error) {
     console.log(error);
    }
     
 });*/
 
/** GET
 * Post = id */ 
router.get('/post/:id', async (req, res) => {
    try {
        

        // Lấy ID từ tham số URL
        let postId = req.params.id;

        // Tìm bài viết theo ID
        const data = await Post.findById(postId);

        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongoDB.",
            currentRoute:  `/post/${slug}`
        }
        // Nếu không tìm thấy bài viết, trả về lỗi 404
        if (!data) {
            return res.status(404).send('Bài viết không tồn tại');
        }

        // Render view với dữ liệu bài viết
        res.render('post', { locals, data });
    } catch (error) {
        console.log(error);
        res.status(500).send('Lỗi máy chủ');
    }
});

/** POST
 * Post - searchbar */ 
router.post('/search',async(req,res) => {
    try {
        const locals = {
            title: "Search",
            description: "Simple Blog created with NodeJs, Express & MongoDB."
           }
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g,"")
        const data = await Post.find({
            $or:[
                {title:{$regex: new RegExp(searchNoSpecialChar, 'i')}},
                {body:{$regex: new RegExp(searchNoSpecialChar, 'i')}}
            ]
        });
        res.render('search', {
            data,
            locals
        });
        
    } catch (error) {
     console.log(error);
    }
     
 });



 /*function insertPostData(){
    Post.insertMany([
      {
       title:"Building a Blog 6",
       body: "This is the body text 6"
      },
      {
        title:"Building a Blog 7",
        body: "This is the body text 7"
       },
       {
        title:"Building a Blog 8",
        body: "This is the body text 8"
       },
       {
        title:"Building a Blog 9",
        body: "This is the body text 9"
       },
       {
        title:"Building a Blog 10",
        body: "This is the body text 10"
       },
       {
        title:"Building a Blog 11",
        body: "This is the body text 12"
       },
    ])
}
insertPostData();*/
    






router.get('/about',(req,res) => {
    res.render('about',{
         currentRoute:  `/about`
    });
});

module.exports = router;