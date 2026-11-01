import { Chip } from "@mui/material";
import { ORDER_STATUS } from "../utils/orderFormat";

// Chip hiển thị trạng thái đơn với nhãn tiếng Việt và màu tương ứng
export default function OrderStatusChip({ status }) {
  const info = ORDER_STATUS[status] || { label: status, color: "default" };
  return <Chip size="small" label={info.label} color={info.color} />;
}