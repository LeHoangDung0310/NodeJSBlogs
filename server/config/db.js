const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false); // Giữ lại tùy chọn này
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
    }
};

module.exports = connectDB;
