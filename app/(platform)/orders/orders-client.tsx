"use client";

import type { OpenOrder } from "@/lib/core/domain/trade/order";
import { OpenOrdersList } from "@/components/orders/open-orders-list";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import OrdersLoading from "./loading";

interface OpenOrdersVM {
  orders: OpenOrder[];
}

/**
 * Client-rendered open-orders screen. Data is fetched in the browser from
 * `/api/orders` (server-side BFF), which proxies GET /v1/orders?status=open.
 */
export function OrdersClient() {
  const { data, error, loading, reload } =
    useClientData<OpenOrdersVM>("/api/orders");

  if (loading) return <OrdersLoading />;
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری سفارش‌های باز ناموفق بود."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <OpenOrdersList initialOrders={data.orders} />
    </div>
  );
}
