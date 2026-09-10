"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/types";

interface FloatingContactProps {
  settings?: SiteSettings;
}

export function FloatingContact({ settings = {} }: FloatingContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  let whatsappNumber = (settings.whatsappNumber || "01942212267").replace(/[^0-9]/g, "");
  if (whatsappNumber.length === 11 && whatsappNumber.startsWith("0")) {
    whatsappNumber = "88" + whatsappNumber;
  }
  const messengerUsername = settings.messengerUsername || "canvas.bangladesh";
  const messengerUrl = `https://m.me/${messengerUsername}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("অনুগ্রহ করে সব তথ্য দিন");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("মেসেজটি সফলভাবে পাঠানো হয়েছে!");
        setName("");
        setPhone("");
        setMessage("");
        setIsChatOpen(false);

        // Open WhatsApp with prefilled message
        const waText = `আসসালামু আলাইকুম! আমার নাম ${name}। মোবাইল: ${phone}। আমার বার্তা: ${message}`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}`, "_blank");
      } else {
        toast.error(data.error || "মেসেজ পাঠানো সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Support message error:", err);
      toast.error("সাপোর্ট বার্তা পাঠানো ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-[100] font-poppins select-none flex flex-col items-center"
    >
      {/* Action Menu (Messenger, WhatsApp, Live Chat) */}
      <div
        className={`flex flex-col gap-3.5 mb-4 items-center transition-all duration-300 origin-bottom ${
          isOpen && !isChatOpen
            ? "opacity-100 pointer-events-auto translate-y-0 scale-100"
            : "opacity-0 pointer-events-none translate-y-6 scale-75"
        }`}
      >
        {/* Messenger Option */}
        <div className="relative flex items-center justify-center group">
          <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none whitespace-nowrap z-[110]">
            Messenger
          </span>
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all overflow-hidden cursor-pointer"
            aria-label="Messenger"
          >
            <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="msgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#006AFF" />
                  <stop offset="35%" stopColor="#00A3FF" />
                  <stop offset="70%" stopColor="#9933FF" />
                  <stop offset="100%" stopColor="#FF3399" />
                </linearGradient>
              </defs>
              <path
                d="M18 3C9.716 3 3 9.358 3 17.185c0 4.148 1.88 7.892 4.908 10.457.256.216.416.53.416.864l-.064 2.68c-.032.888.896 1.48 1.68 1.072l3.008-1.56a1.44 1.44 0 01.992-.128c1.32.368 2.704.568 4.06.568 8.284 0 15-6.358 15-14.185C33 9.358 26.284 3 18 3z"
                fill="url(#msgGrad)"
              />
              <path
                d="M9.6 20.8l4.48-7.12a1.44 1.44 0 012.016-.416l3.552 2.664a.72.72 0 00.864 0l4.784-3.648c.64-.488 1.488.24 1.088.944l-4.48 7.12a1.44 1.44 0 01-2.016.416l-3.552-2.664a.72.72 0 00-.864 0l-4.784 3.648c-.64.488-1.488-.24-1.088-.944z"
                fill="#FFFFFF"
              />
            </svg>
          </a>
        </div>

        {/* WhatsApp Option */}
        <div className="relative flex items-center justify-center group">
          <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none whitespace-nowrap z-[110]">
            WhatsApp
          </span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-white overflow-hidden cursor-pointer"
            aria-label="WhatsApp"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.275-.1-.475-.15-.676.15-.2.3-.776.98-.952 1.18-.175.201-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.676-2.084-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.526.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.232-.244-.588-.492-.508-.676-.518-.175-.008-.376-.008-.576-.008-.201 0-.526.075-.802.376-.276.3-1.053 1.029-1.053 2.508 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.377.197 1.896.12.578-.087 1.78-.727 2.031-1.43.251-.702.251-1.304.175-1.43-.075-.125-.276-.2-.577-.35zM12.04 21.785h-.008c-1.755 0-3.476-.472-4.985-1.365l-.358-.212-3.708.972.99-3.614-.233-.371a10.22 10.22 0 01-1.565-5.419c.005-5.647 4.6-10.239 10.25-10.239 2.734 0 5.304 1.066 7.234 3.001 1.93 1.933 2.992 4.505 2.99 7.241-.005 5.648-4.6 10.24-10.245 10.24zM12.04 0C5.397 0 .005 5.392 0 12.036c0 2.122.553 4.195 1.606 6.017L.057 24l6.148-1.613c1.764.962 3.754 1.469 5.828 1.469h.007c6.641 0 12.033-5.393 12.038-12.037.002-3.218-1.25-6.243-3.523-8.519C18.283 1.225 15.26 0 12.04 0z" />
            </svg>
          </a>
        </div>

        {/* Live Chat Option */}
        <div className="relative flex items-center justify-center group">
          <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none whitespace-nowrap z-[110]">
            Live Chat
          </span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsChatOpen(true);
            }}
            className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-white cursor-pointer relative"
            aria-label="Live Chat"
          >
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (isChatOpen) {
            setIsChatOpen(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-14 h-14 rounded-full bg-primary-gradient text-[var(--primary-foreground)] flex items-center justify-center shadow-2xl shadow-[var(--primary)]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer relative border-2 border-white/80"
        aria-label="Support Contact"
      >
        {isOpen || isChatOpen ? (
          <X className="w-6 h-6 transition-all duration-300" />
        ) : (
          <MessageSquare className="w-6.5 h-6.5 transition-all duration-300" />
        )}
      </button>

      {/* Built-in Live Chat Window */}
      <div
        className={`fixed bottom-24 right-5 md:right-6 w-[340px] h-[460px] max-w-[calc(100vw-32px)] bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right z-[110] ${
          isChatOpen
            ? "translate-y-0 opacity-100 pointer-events-auto scale-100"
            : "translate-y-12 opacity-0 pointer-events-none scale-95"
        }`}
      >
        {/* Chat Header */}
        <div className="bg-primary-gradient text-[var(--primary-foreground)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-lg shadow-xs">
              💼
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs tracking-wide leading-none">Canvas Support</h3>
              <span className="text-[9px] font-bold opacity-75 uppercase tracking-widest mt-1 block">Live Chat Agent</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4 no-scrollbar text-xs">
          <div className="flex gap-2.5 items-start max-w-[85%]">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs shrink-0">🤖</div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-xs text-slate-700 leading-relaxed font-semibold">
              আসসালামু আলাইকুম! CanvasBag সাপোর্টে আপনাকে স্বাগতম। নিচে আপনার নাম, মোবাইল নাম্বার এবং প্রশ্নটি লিখে মেসেজ
              পাঠান। আমাদের রিপ্রেজেন্টেটিভ কিছুক্ষণের মধ্যেই সরাসরি যোগাযোগ করবেন।
            </div>
          </div>
        </div>

        {/* Chat Form Input Area */}
        <form onSubmit={handleSupportSubmit} className="p-4 border-t border-slate-100 bg-white space-y-2.5 text-xs">
          <div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন..."
              className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--primary)] bg-slate-50/50 font-semibold text-slate-800"
            />
          </div>
          <div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="মোবাইল নাম্বার (০১XXXXXXXXX)..."
              className="w-full h-9 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--primary)] bg-slate-50/50 font-semibold text-slate-800"
            />
          </div>
          <div>
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="আপনার বার্তাটি লিখুন..."
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--primary)] bg-slate-50/50 font-semibold resize-none text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                পাঠানো হচ্ছে...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                বার্তা পাঠান
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
