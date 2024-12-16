const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PostSchema = new Schema({
    title:{
        type: String,
        require: true
    },
    body:{
        type: String,
        require: true
    },
    images: [{
        type: String // Lưu trữ URL hoặc đường dẫn file của ảnh
    }],
    videos: [{
        type: String // Lưu trữ URL hoặc đường dẫn file của video
    }],
    author: {
        type: Schema.Types.ObjectId,  // Tham chiếu đến User
        ref: 'User',
        required: true,  // Mỗi bài viết phải có một người tạo
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default:Date.now
    }
});
PostSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Post', PostSchema);