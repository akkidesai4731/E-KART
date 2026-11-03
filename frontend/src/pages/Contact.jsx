import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Clock, MessageCircle, Zap } from "lucide-react";

export default function Contact() {
  // Replace these sample details with your real information.
  const contact = {
    email: "support@ekart.example",
    phone: "+91 2345634534",
    address: "05 / Sakharam Nagar Complex, Thane, Maharashtra, India",
    hours: "Monday – Saturday: 9:00 AM – 6:00 PM",
  };

  return (
    <main className="mx-auto max-w-6xl cursor-default px-5 py-12 sm:py-16">
      {/* Page heading */}
      <section className="mb-12 text-center">
        <p className="text-xs font-extrabold tracking-[0.25em] text-red-600">
          CONTACT E-KART
        </p>

        <h1 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-5xl">
          How can we help?
        </h1>

        <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-600">
          Have a question about a product, order, delivery, or payment? Get in
          touch with our team. We are happy to help you.
        </p>
      </section>

      {/* Contact information */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Email */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Mail size={24} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Email us</h2>

          <p className="mt-2 leading-7 text-gray-600">
            Send us your questions and customer support requests.
          </p>

          <a
            href={`mailto:${contact.email}`}
            className="mt-4 inline-block cursor-pointer break-all font-semibold text-red-600 hover:text-red-700"
          >
            {contact.email}
          </a>
        </div>

        {/* Phone */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Phone size={24} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Call us</h2>

          <p className="mt-2 leading-7 text-gray-600">
            Contact us for help with your orders and products.
          </p>

          <a
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
            className="mt-4 inline-block cursor-pointer font-semibold text-red-600 hover:text-red-700"
          >
            {contact.phone}
          </a>
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <MapPin size={24} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Our address</h2>

          <p className="mt-2 leading-7 text-gray-600">
            Visit our business location or use the address below to find us.
          </p>

          <p className="mt-4 leading-7 font-medium text-gray-800">
            {contact.address}
          </p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block cursor-pointer font-semibold text-red-600 hover:text-red-700"
          >
            Get directions →
          </a>
        </div>

        {/* Working hours */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Clock size={24} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Business hours</h2>

          <p className="mt-2 leading-7 text-gray-600">
            Our usual customer support availability.
          </p>

          <p className="mt-4 font-semibold leading-7 text-gray-800">
            {contact.hours}
          </p>
        </div>
      </section>

      {/* Additional help */}
      <section className="mt-10 rounded-2xl bg-gray-950 px-6 py-10 text-center text-white sm:px-10">
        <div className="flex justify-center">
          <Zap size={30} className="text-red-500" />
        </div>

        <h2 className="mt-4 text-2xl font-bold">
          Thank you for choosing E-Kart
        </h2>

        <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-300">
          We appreciate your trust and look forward to helping you with your
          electronics shopping.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/shop"
            className="cursor-pointer rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Shop products
          </Link>

          <a
            href={`mailto:${contact.email}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            <MessageCircle size={18} />
            Email support
          </a>
        </div>
      </section>
    </main>
  );
}
