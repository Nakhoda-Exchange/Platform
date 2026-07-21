import type { Metadata } from "next";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = {
  title: "سفارش‌های باز | ناخدا",
};

// Client-rendered: open orders are fetched in the browser via /api/orders.
export default function OrdersPage() {
  return <OrdersClient />;
}
