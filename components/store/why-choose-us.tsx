import React from "react";
import { Truck, ShieldCheck, RefreshCw, Award, Headphones, Banknote } from "lucide-react";

export function WhyChooseUs() {
  const features = [
    {
      icon: Award,
      title: "১০০% প্রিমিয়াম কোয়ালিটি",
      description: "টেকসই ক্যানভাস ও জেনুইন লেদার ট্রিম ফিনিশিং সহ প্রতিটি ব্যাগ দীর্ঘস্থায়ী ব্যবহারের জন্য তৈরি।",
    },
    {
      icon: Truck,
      title: "সারা দেশে হোম ডেলিভারি",
      description: "ঢাকা সিটির ভেতরে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৩-৪ দিনে দ্রুত হোম ডেলিভারি সুবিধা।",
    },
    {
      icon: Banknote,
      title: "ক্যাশ অন ডেলিভারি (COD)",
      description: "কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার করুন। পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানের কাছে মূল্য পরিশোধ করুন।",
    },
    {
      icon: RefreshCw,
      title: "সহজ রিটার্ন পলিসি",
      description: "পণ্য পছন্দ না হলে বা কোনো সমস্যা থাকলে ৭ দিনের মধ্যে সহজ রিটার্ন ও রিপ্লেসমেন্ট সুবিধা।",
    },
    {
      icon: Headphones,
      title: "২৪/৭ কাস্টমার সাপোর্ট",
      description: "অর্ডার সংক্রান্ত যেকোনো তথ্য বা সহায়তার জন্য আমাদের সাপোর্ট টিম সর্বদা আপনার পাশে রয়েছে।",
    },
    {
      icon: ShieldCheck,
      title: "সুরক্ষিত কেনাকাটা",
      description: "বিশ্বস্ত ও নির্ভরযোগ্য অনলাইন শপিং অভিজ্ঞতা যেখানে আপনার তথ্যের সম্পূর্ণ গোপনীয়তা নিশ্চিত।",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider bg-[#fff3ef] px-3.5 py-1 rounded-full border border-[#ff6b35]/15">
            WHY CHOOSE US
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-3 tracking-tight">
            Why Choose CanvasBag?
          </h2>
          <p className="text-[#6b7280] mt-2 max-w-xl mx-auto text-sm md:text-base">
            প্রিমিয়াম কোয়ালিটি ব্যাগ ও বিশ্বস্ত গ্রাহক সেবায় হাজারো সন্তুষ্ট ক্রেতার প্রথম পছন্দ CanvasBag।
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="group flex gap-4 p-5 rounded-2xl border border-[#e5e7eb] hover:border-[#ff6b35] hover:shadow-md transition-all duration-200 bg-white"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#fff3ef] group-hover:bg-[#ff6b35] flex items-center justify-center text-[#ff6b35] group-hover:text-white transition-colors duration-200 shadow-xs">
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#111827] text-base mb-1 group-hover:text-[#ff6b35] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
