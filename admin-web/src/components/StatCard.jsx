import { Paper, Box, Typography } from "@mui/material";

// Thẻ hiển thị 1 con số trên Dashboard
// Props:
//  - title: tên chỉ số, ví dụ "Tổng đơn"
//  - value: con số / chuỗi đã định dạng
//  - icon: biểu tượng MUI, ví dụ <ReceiptLongIcon />
//  - color: màu nền ô biểu tượng (mã màu)
//  - subtitle: dòng chú thích nhỏ (không bắt buộc)
//  - onClick: bấm vào thẻ để chuyển trang (không bắt buộc)
export default function StatCard({ title, value, icon, color, subtitle, onClick }) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: onClick ? "pointer" : "default",
        // Thẻ bấm được thì nổi lên khi rê chuột
        "&:hover": onClick ? { boxShadow: 4 } : {},
      }}
    >
      {/* Ô vuông màu chứa biểu tượng */}
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: color,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}