import { Link } from "react-router-dom";
import { Mail, MapPin, Zap, Phone, Clock } from "lucide-react";

export default function Footer() {
  // Replace these sample details with your actual business information.
  const contact = {
    email: "support@ekart.com",
    phone: "+91 8411843550",
    address: "05 / Sakharam Nagar Complex, Thane, Maharashtra, India",
    hours: "Monday – Saturday: 9:00 AM – 6:00 PM",
  };

  const linkClass =
    "mb-3 block w-fit cursor-pointer text-sm transition-colors hover:text-red-400";

  return (
    <footer className="mt-20 cursor-default bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <Link
            to="/"
            className="flex w-fit cursor-pointer items-center gap-2 text-2xl font-extrabold text-white"
          >
            <Zap size={24} className="text-red-500" />
            E-<span className="text-red-500">kart</span>
          </Link>

          <p className="mt-4 max-w-xs cursor-default text-sm leading-7 text-gray-400">
            Everyday electronics, useful appliances and technology for your
            home. Quality products, convenient shopping and reliable service.
          </p>
        </div>

        {/* Explore */}
        <div>
          <h3 className="mb-4 cursor-default font-bold text-white">Explore</h3>

          <Link className={linkClass} to="/shop">
            All products
          </Link>

          <Link className={linkClass} to="/shop?category=Mobiles">
            Mobiles
          </Link>

          <Link className={linkClass} to="/shop?category=Kitchen%20Appliances">
            Kitchen appliances
          </Link>

          <Link className={linkClass} to="/cart">
            Shopping cart
          </Link>
        </div>

        {/* Customer links */}
        <div>
          <h3 className="mb-4 cursor-default font-bold text-white">
            Customer Service
          </h3>

          <Link className={linkClass} to="/about">
            About us
          </Link>

          <Link className={linkClass} to="/contact">
            Contact us
          </Link>

          <Link className={linkClass} to="/account">
            My account
          </Link>
        </div>

        {/* Contact details */}
        <div>
          <h3 className="mb-5 cursor-default font-bold text-white">
            Contact Information
          </h3>

          <a
            href={`mailto:${contact.email}`}
            className="mb-4 flex w-fit cursor-pointer items-start gap-3 text-sm hover:text-red-400"
          >
            <Mail size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{contact.email}</span>
          </a>

          <a
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
            className="mb-4 flex w-fit cursor-pointer items-start gap-3 text-sm hover:text-red-400"
          >
            <Phone size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{contact.phone}</span>
          </a>

          <div className="mb-4 flex items-start gap-3 text-sm">
            <MapPin size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="max-w-xs leading-6">{contact.address}</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Clock size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="leading-6">{contact.hours}</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-gray-500">
        <p className="cursor-default">
          © {new Date().getFullYear()} E-kart. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
