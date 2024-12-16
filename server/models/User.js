const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,  // Đảm bảo username là duy nhất
    },
    password: {
        type: String,
        required: true,  // Mật khẩu là bắt buộc
    },
    avatar: {
        type: String,
        default: null,  // Đường dẫn tới ảnh avatar, mặc định là null nếu không có avatar
    },
    name: {
        type: String,
        required: true,  // Tên người dùng là bắt buộc
    },
    address: {
        type: String,
        default: '',  // Địa chỉ không bắt buộc, mặc định là một chuỗi rỗng
    },
    posts: [{
        type: Schema.Types.ObjectId,  // Mảng tham chiếu đến các bài viết
        ref: 'Post',  // Tên model tham chiếu
    }]
});

// Phương thức ảo để tạo URL đầy đủ cho avatar
UserSchema.virtual('avatarUrl').get(function () {
    return this.avatar
        ? `/img/uploads/${this.avatar}`
        : '/img/default-avatar.jpg';
});

// Cho phép bao gồm các phương thức ảo khi chuyển đổi sang JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
