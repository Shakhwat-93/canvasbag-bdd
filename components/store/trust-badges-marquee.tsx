import React from "react";
import { Truck, ShieldCheck, RefreshCw, Award, PhoneCall } from "lucide-react";

export function TrustBadgesMarquee() {
  const badges = [
    {
      icon: Truck,
      title: "ফ্রি ডেলিভারি",
      subtitle: "৳২৫০০+ অর্ডারে",
    },
    {
      icon: ShieldCheck,
      title: "ক্যাশ অন ডেলিভারি",
      subtitle: "পণ্য দেখে পেমেন্ট করুন",
    },
    {
      icon: RefreshCw,
      title: "৭ দিন রিটার্ন",
      subtitle: "সমস্যায় ফেরত নিন",
    },
    {
      icon: Award,
      title: "১০০% অরিজিনাল",
      subtitle: "প্রিমিয়াম কোয়ালিটি গ্যারান্টি",
    },
    {
      icon: PhoneCall,
      title: "সরাসরি সাপোর্ট",
      subtitle: "সকাল ১০টা — রাত ৯টা",
    },
  ];

  return (
    <section className="bg-white border-b border-[#e5e7eb] overflow-hidden py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Left & Right Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="overflow-hidden">
          <div className="animate-marquee-infinite gap-8 md:gap-16">
            {/* Set 1 */}
            {badges.map((b, i) => (
              <div key={`set1-${i}`} className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-[#fff3ef] rounded-xl flex items-center justify-center flex-shrink-0 text-[#ff6b35]">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-[#111827] whitespace-nowrap">
                    {b.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#6b7280] whitespace-nowrap">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            ))}

            {/* Set 2 (for seamless loop) */}
            {badges.map((b, i) => (
              <div key={`set2-${i}`} className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-[#fff3ef] rounded-xl flex items-center justify-center flex-shrink-0 text-[#ff6b35]">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-[#111827] whitespace-nowrap">
                    {b.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#6b7280] whitespace-nowrap">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
