const User = require('../models/User');

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy user ID từ JWT hoặc session
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Gửi thông tin user cùng avatar URL
        res.json({
            username: user.username,
            avatarUrl: user.avatarUrl, // URL được tạo từ phương thức ảo
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
