require('dotenv').config();

const express = require('express');
const flash = require('connect-flash');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    }),
}));

// Static files
app.use(express.static('public'));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Local helpers
app.locals.isActiveRoute = isActiveRoute;
// Cấu hình flash message
app.use(flash());  // Thêm middleware flash vào

// Chuyển thông báo flash vào locals để sử dụng trong EJS
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Cấu hình body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', require('./server/routes/main')); // Route cho login/register
app.use('/', require('./server/routes/admin')); // Route cho admin

// Khởi động server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});


