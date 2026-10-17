import mongoose from "mongoose";

// Hàm kết nối tới MongoDB, gọi một lần khi server khởi động
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error.message);
    process.exit(1); // Dừng server nếu không kết nối được database
  }
};

export default connectDB;