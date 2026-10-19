import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App.jsx";

// Gắn ứng dụng React vào thẻ <div id="root"> trong index.html
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* CssBaseline: xóa lề mặc định của trình duyệt, đặt font chữ thống nhất cho toàn trang */}
    <CssBaseline />
    <App />
  </StrictMode>
);