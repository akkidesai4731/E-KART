import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/layout/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import ProductForm from "./components/products/ProductForm.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Categories from "./pages/Categories.jsx";
import Banners from "./pages/Banners.jsx";
import Customers from "./pages/Customers.jsx";
import Settings from "./pages/Settings.jsx";
import EditProduct from "./pages/EditProduct.jsx";
import Inventory from "./pages/Inventory.jsx";
import AddProduct from "./pages/AddProduct.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />

        <Route path="products" element={<Products />} />

        {/* New product form with images and specifications */}
        <Route path="products/new" element={<AddProduct />} />
        <Route path="add-product" element={<AddProduct />} />

        {/* Existing edit routes */}
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<EditProduct />} />

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="categories" element={<Categories />} />
        <Route path="banners" element={<Banners />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="inventory" element={<Inventory />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
