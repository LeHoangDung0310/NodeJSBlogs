const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const upload = require("../config/multerConfig"); // Đường dẫn đến multerConfig

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

// const { getUserProfile } = require('../controllers/userController');

/**
 * Check login
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorize" });
  }
};

// Endpoint lấy thông tin profile của người dùng đã đăng nhập
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    // console.log(user.avatar)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trả về thông tin người dùng bao gồm username và avatar
    res.json({
      username: user.username,
      name: user.name,
      avatar: user.avatar || "/img/default-avatar.jpg", // Nếu không có avatar, sử dụng ảnh mặc định
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin", async (req, res) => {
  try {
    const userId = req.userId;
    // console.log(userId);

    if (!userId) {
      // Chưa đăng nhập: Hiển thị trang login với header_default
      return res.render("admin/index", {
        // layout: 'layout',
        layout: adminLayout,
        locals: {
          isLoggedIn: false,
          title: "Admin Login",
          description: "Login to access the Admin Panel.",
        },
      });
    }

    // Đã đăng nhập: Hiển thị trang admin với header_admin
    const user = await User.findById(userId);

    const locals = {
      title: "Admin Panel",
      description: "Welcome to the Admin Panel.",
    };

    res.render("admin/dashboard", {
      layout: adminLayout,
      locals: {
        isLoggedIn: true, // Truyền đúng giá trị
        title: "Admin Panel",
        description: "Welcome to the Admin Panel.",
      },
      user,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/error");
  }
});

/** POST
 * Admin-Check login */
router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

/** GET
 * Admin-Dashboard
 * */
router.get("/dashboard", authMiddleware, async (req, res) => {
  
  try {
    const user = await User.findById(req.userId);
    const locals = {
      isLoggedIn: true,
      title: "Dashboard",
      description: "Simple Blog created with NodeJs, Express & MongoDB.",
    };

    const data = await Post.find({ author: req.userId });
    res.render("admin/dashboard", {
      locals,
      data,
      layout: adminLayout,
      user,
    });
  } catch (error) {
    console.log(error);
  }
});

/** GET
 * Admin-Create New Post
 * */
router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add Post",
      description: "Simple Blog created with NodeJs, Express & MongoDB.",
    };

    const data = await Post.find();
    res.render("admin/add-post", {
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// POST route to add new post with images and videos
router.post(
  "/add-post",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      const { title, body } = req.body;
      const userId = req.userId;

      // Lấy URL của hình ảnh và video đã upload
      const images = req.files["images"]
        ? req.files["images"].map((file) => `/img/uploads/${file.filename}`)
        : [];
      const videos = req.files["videos"]
        ? req.files["videos"].map((file) => `/img/uploads/${file.filename}`)
        : [];

      // Chèn các URL ảnh và video vào trong body của bài viết (HTML)
      let postBody = body;

      // Chèn hình ảnh vào HTML body
      images.forEach((imageUrl) => {
        postBody = postBody.replace('<img src="', `<img src="${imageUrl}" `);
      });

      // Chèn video vào HTML body
      videos.forEach((videoUrl) => {
        postBody = postBody.replace(
          '<video src="',
          `<video src="${videoUrl}" `
        );
      });

      const newPost = new Post({
        title,
        body: postBody, // Lưu nội dung bài viết (bao gồm ảnh và video)
        images, // Lưu các đường dẫn ảnh
        videos, // Lưu các đường dẫn video
        author: userId
      });

      await newPost.save();
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error while creating post");
    }
  }
);

router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
      description: "Edit your post in the system",
    };

    // Lấy bài viết từ database theo ID
    const data = await Post.findOne({ _id: req.params.id });
    console.log(data.title);
    console.log("adfsdk");

    // Kiểm tra nếu không tìm thấy bài viết
    if (!data) {
      return res.status(404).send("Post not found");
    }

    // Render view và truyền dữ liệu bài viết
    res.render("admin/edit-post", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving post data");
  }
});

router.put(
  "/edit-post/:id",
  upload.none(),
  authMiddleware,
  async (req, res) => {
    try {
      const { title, body } = req.body; // Lấy title và body từ form

      // Kiểm tra dữ liệu có hợp lệ không
      if (!title || !body) {
        return res.status(400).send("Missing title or body");
      }

      // Cập nhật bài viết trong database
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { title, body },
        { new: true }
      );

      if (!updatedPost) {
        return res.status(404).send("Post not found");
      }

      // Chuyển hướng hoặc thông báo thành công
      res.redirect(`/post/${updatedPost._id}`);
    } catch (error) {
      console.log(error);
      res.status(500).send("Error updating post");
    }
  }
);

router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { username, password, name, address } = req.body;
    const avatar = req.file ? "/img/uploads/" + req.file.filename : null;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      username,
      password: hashedPassword, // Nên hash mật khẩu trước khi lưu
      name,
      address,
      avatar,
    });
    await newUser.save();

    // Chuyển hướng về trang đăng nhập hoặc trang khác sau khi đăng ký thành công
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user.");
  }
});

/** DELETE
 * Admin-Delete Post
 * */
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

/** GET
 * Admin-Logout
 * */
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Giả sử bạn đang sử dụng Express.js
// API để hiển thị thông tin chỉnh sửa profile
router.get("/edit-profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId); // Lấy thông tin người dùng từ database
    res.render("edit-profile", { user }); // Render trang edit-profile và truyền dữ liệu người dùng
  } catch (error) {
    console.log(error);
    res.redirect("/dashboard"); // Nếu có lỗi, chuyển hướng về dashboard
  }
});

// API để cập nhật thông tin profile
router.post(
  "/edit-profile",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const updatedData = {
        name: req.body.name,
        address: req.body.address,
        avatar: req.file ? "/img/uploads/" + req.file.filename : undefined, // Nếu có file ảnh, lưu tên file
      };

      // Cập nhật dữ liệu người dùng vào database
      await User.findByIdAndUpdate(req.userId, updatedData);

      res.redirect("/dashboard"); // Chuyển hướng về trang dashboard sau khi cập nhật
    } catch (error) {
      console.log(error);
      res.redirect("/edit-profile"); // Nếu có lỗi, quay lại trang chỉnh sửa profile
    }
  }
);

module.exports = router;
