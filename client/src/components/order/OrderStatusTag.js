import { Tag } from "antd";
import { getOrderStatusMeta } from "@/utils/orderStatus";

export default function OrderStatusTag({ status }) {
    const meta = getOrderStatusMeta(status);
    return <Tag color={meta.color}>{meta.label}</Tag>;
}
