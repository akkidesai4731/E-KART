import { Route, Routes, Link, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import AnnouncementBar from "./components/layout/AnnouncementBar";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Hero from "./components/home/Hero";
import CategoryGrid from "./components/home/CategoryGrid";
import FeaturedCarousel from "./components/home/FeaturedCarousel";
import ValueProps from "./components/home/ValueProps";

import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account.jsx";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist.jsx";
import ScrollRestoration from "./components/home/ScrollRestoration.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <Hero />
      <CategoryGrid />
      <FeaturedCarousel />

      <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-gray-950 px-6 py-9 text-white sm:flex-row sm:items-center sm:px-10 sm:py-12">
        <div>
          <p className="text-xs font-bold tracking-widest text-red-400">
            MAKE EVERYDAY BETTER
          </p>

          <h2 className="mt-3 text-3xl font-extrabold">
            Good technology. Better living.
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Find the right electronics for your everyday needs.
          </p>
        </div>

        <Link
          to="/shop"
          className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 hover:bg-gray-100"
        >
          Shop electronics
        </Link>
      </section>

      <ValueProps />
    </main>
  );
}

function NotFound() {
  return (
    <main className="px-5 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>

      <p className="mt-3 text-gray-500">
        The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-4 inline-block rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
      >
        Return home
      </Link>
    </main>
  );
}

function AppRoutes() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <ScrollRestoration />

      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Shopping */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />

        {/* Wishlist */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        {/* Information pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected checkout */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* Customer account */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route path="/profile" element={<Navigate to="/account" replace />} />

        {/* Customer orders */}
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* Keep this route LAST */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppRoutes />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
