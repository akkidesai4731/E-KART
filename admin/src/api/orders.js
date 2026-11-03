import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        setOrders(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Order Number</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="p-3">{order.orderNumber}</td>
                <td className="p-3">
                  <div>{order.customer.name}</div>
                  <div className="text-gray-500">{order.customer.email}</div>
                </td>
                <td className="p-3">{order.items.length}</td>
                <td className="p-3">
                  ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </td>
                <td className="p-3">{order.orderStatus}</td>
                <td className="p-3">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
