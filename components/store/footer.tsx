import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import type { Category, SiteSettings } from "@/lib/types";

interface FooterProps {
  categories?: Category[];
  settings?: SiteSettings;
}

export function Footer({ categories = [], settings = {} }: FooterProps) {
  const phone = settings.phone || settings.whatsappNumber || "01942212267";
  const displayPhone = phone.startsWith("+88") ? phone : `+88${phone.startsWith("0") ? phone : "0" + phone}`;
  const facebookUrl = settings.facebookUrl || "https://www.facebook.com/canvas.bangladesh";

  return (
    <footer className="bg-white text-gray-600 border-t border-[#e5e7eb] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Social */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <Image
                src="/brand/logo.webp"
                alt="CanvasBag Logo"
                width={36}
                height={36}
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                unoptimized
              />
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors">
                Canvas<span className="text-[#ff6b35]">Bag</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4 text-gray-500">
              বাংলাদেশের বিশ্বস্ত ক্যানভাস ব্যাগ শপ। সেরা মানের পণ্য, সর্বোত্তম দাম এবং দ্রুততম ক্যাশ অন ডেলিভারি।
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-[#1877F2] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-pulse-badge"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-[#FF0000] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gradient-to-tr from-[#FFB200] via-[#FF007A] to-[#7A00FF] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">ক্যাটাগরি</h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="hover:text-[#ff6b35] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="hover:text-[#ff6b35] transition-colors font-medium">
                  সকল পণ্য দেখুন
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">গ্রাহক সেবা</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/track" className="hover:text-[#ff6b35] transition-colors">
                  অর্ডার ট্র্যাক করুন
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#ff6b35] transition-colors">
                  শপিং কার্ট
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-[#ff6b35] transition-colors">
                  ক্যাশ অন ডেলিভারি চেকআউট
                </Link>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">রিটার্ন ও রিফান্ড পলিসি</span>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">প্রাইভেসি পলিসি</span>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">শর্তাবলী</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Payment Badges */}
          <div>
            <h3 className="text-gray-900 font-bold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#ff6b35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 font-semibold">{displayPhone}</p>
                  <p className="text-xs text-gray-400">সকাল ১০টা — রাত ৯টা</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#ff6b35] mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:contact.canvasbag@gmail.com"
                  className="hover:text-[#ff6b35] transition-colors"
                >
                  contact.canvasbag@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#ff6b35] mt-0.5 flex-shrink-0" />
                <span>ধানমন্ডি, ঢাকা, বাংলাদেশ।</span>
              </li>
            </ul>

            {/* Payment Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium shadow-2xs">
                💳 bKash
              </span>
              <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium shadow-2xs">
                💚 Nagad
              </span>
              <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium shadow-2xs">
                💜 Rocket
              </span>
              <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-gray-600 font-medium shadow-2xs">
                💵 ক্যাশ অন ডেলিভারি
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer Copyright */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© ২০২৬ CanvasBag. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <Link href="/" className="text-[#ff6b35] font-semibold hover:underline">
              CanvasBag
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
