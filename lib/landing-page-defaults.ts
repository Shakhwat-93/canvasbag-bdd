import type {
  Product,
  LandingPage,
  LandingPageSectionConfig,
  LandingPageTemplateId,
  LandingPageProductOverride,
  SiteSettings,
} from "@/lib/types";

export const CANVASBAG_BRAND = {
  name: "CanvasBag",
  fullName: "CanvasBag Bangladesh",
  tagline: "বাংলাদেশের বিশ্বস্ত ক্যানভাস ব্যাগ শপ। সেরা মানের পণ্য, সর্বোত্তম দাম এবং দ্রুততম ক্যাশ অন ডেলিভারি।",
  logoUrl: "/brand/logo.webp",
  phone: "01942212267",
  whatsapp: "01942212267",
  email: "contact.canvasbag@gmail.com",
  address: "ধানমন্ডি, ঢাকা, বাংলাদেশ।",
  hours: "সকাল ১০টা — রাত ৯টা",
  facebookUrl: "https://www.facebook.com/canvas.bangladesh",
  messengerUrl: "https://m.me/canvas.bangladesh",
};

export const DEFAULT_LANDING_PAGE_SECTIONS: LandingPageSectionConfig[] = [
  { id: "sec_top_marquee", type: "top_marquee", enabled: true, title: "Top Announcement Marquee" },
  { id: "sec_navbar", type: "navbar", enabled: true, title: "Sticky Top Navigation" },
  { id: "sec_hero", type: "hero", enabled: true, title: "Hero Spotlight & Quick Offer" },
  { id: "sec_urgency_timer", type: "urgency_timer", enabled: true, title: "Urgency Countdown & Stock Bar" },
  { id: "sec_pain_points", type: "pain_points", enabled: true, title: "Pain Points & Problem Agitation" },
  { id: "sec_solution_spotlight", type: "solution_spotlight", enabled: true, title: "Product Spotlight & Technical Solution" },
  { id: "sec_trust_strip", type: "trust_strip", enabled: true, title: "Trust & Service Guarantees" },
  { id: "sec_benefits", type: "benefits", enabled: true, title: "Key Benefits Grid" },
  { id: "sec_target_audience", type: "target_audience", enabled: true, title: "Target Audience (Who Is This For)" },
  { id: "sec_features", type: "features", enabled: true, title: "Visual Feature Breakdown" },
  { id: "sec_gallery", type: "gallery", enabled: true, title: "Photo Showcase Gallery" },
  { id: "sec_specs", type: "specs", enabled: true, title: "Specifications Table" },
  { id: "sec_urgent_notice", type: "urgent_notice", enabled: true, title: "Urgent Warning Reminder Banner" },
  { id: "sec_reviews", type: "reviews", enabled: true, title: "Customer Reviews & Social Proof" },
  { id: "sec_faq", type: "faq", enabled: true, title: "Frequently Asked Questions" },
  { id: "sec_order_form", type: "order_form", enabled: true, title: "Cash On Delivery Order Form" },
  { id: "sec_footer", type: "footer", enabled: true, title: "Page Footer & Brand Information" },
];

export function generateUniqueSlug(base: string, existingSlugs: string[] = []): string {
  let clean = String(base || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!clean) clean = "special-offer";

  const lowerExisting = existingSlugs.map((s) => s.toLowerCase());

  if (!lowerExisting.includes(clean)) {
    return clean;
  }

  let counter = 2;
  while (lowerExisting.includes(`${clean}-${counter}`)) {
    counter++;
  }
  return `${clean}-${counter}`;
}

export function createDefaultLandingPageFromProduct(
  product?: Product,
  template: LandingPageTemplateId = "high_converting",
  existingSlugs: string[] = []
): Partial<LandingPage> {
  const primaryImage =
    (product?.images?.[0] as any)?.url ||
    (typeof product?.images?.[0] === "string" ? product?.images?.[0] : null) ||
    product?.image ||
    product?.imageUrl ||
    "/brand/logo.webp";

  const galleryImages = (product?.images || [])
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean) as string[];

  const defaultBenefits = product?.benefits && product.benefits.length > 0
    ? product.benefits.map((b) => ({
        title: typeof b === "string" ? b : (b as any).title || "প্রিমিয়াম কোয়ালিটি",
        description: "দীর্ঘস্থায়ী ফ্যাব্রিক ও মজবুত ফিনিশিং নিশ্চিত করে সর্বোচ্চ আরাম ও স্থায়িত্ব।",
        icon: "ShieldCheck",
      }))
    : [
        {
          title: "প্রিমিয়াম ওয়াটারপ্রুফ মেটেরিয়াল",
          description: "উচ্চমানের ওয়াটার-রেজিস্ট্যান্ট ক্যানভাস যা যেকোনো আবহাওয়ায় ভেতরের জিনিস সুরক্ষিত রাখে।",
          icon: "Droplets",
        },
        {
          title: "স্মার্ট অর্গানাইজার কম্পার্টমেন্ট",
          description: "ল্যাপটপ, গ্যাজেট, জামাকাপড় ও জরুরি কাগজপত্রের জন্য পৃথক প্যাডেড সেফটি পকেট।",
          icon: "Layers",
        },
        {
          title: "হেভি-ডিউটি মেটাল জিপার",
          description: "সহজে নষ্ট না হওয়া স্মুথ ও টেকসই মেটালিক রানার যা বছরের পর বছর নতুনের মতো থাকে।",
          icon: "CheckCircle",
        },
        {
          title: "এরগনোমিক ব্যাক ও শোল্ডার স্ট্র্যাপ",
          description: "শ্বাসপ্রশ্বাসযোগ্য সফট কুশন ব্যাক প্যাড যা দীর্ঘ সময় বহনেও পিঠে ব্যথা হতে দেয় না।",
          icon: "Feather",
        },
      ];

  const defaultSpecs = product?.specs && product.specs.length > 0
    ? product.specs.map((s) => {
        if (typeof s === "string") {
          const parts = s.split(":");
          return {
            key: parts[0]?.trim() || "ফিচার",
            value: parts.slice(1).join(":")?.trim() || s,
          };
        }
        return { key: s.key || "ফিচার", value: s.value || "" };
      })
    : [
        { key: "ব্র্যান্ড", value: "CanvasBag Bangladesh" },
        { key: "মেটেরিয়াল", value: "প্রিমিয়াম হাই-ডেনসিটি ক্যানভাস ও জেনুইন লেদার ট্রিম" },
        { key: "ডাইমেনশন", value: "১৮\" x ১২\" x ৬.৫\" ইঞ্চি (পারফেক্ট ট্রাভেল সাইজ)" },
        { key: "কম্পার্টমেন্ট", value: "১টি মেইন কম্পার্টমেন্ট + ১৫.৬\" ল্যাপটপ স্লট + ৪টি কুইক এক্সেস পকেট" },
        { key: "ওয়াটার রেসিস্ট্যান্স", value: "হালকা ও মাঝারি বৃষ্টি প্রতিরোধে শতভাগ সক্ষম" },
        { key: "ওয়ারেন্টি", value: "৭ দিনের ইজি রিপ্লেসমেন্ট গ্যারান্টি" },
      ];

  const defaultReviews = product?.reviews && product.reviews.length > 0
    ? product.reviews.map((r) => ({
        author: r.author || "সম্মানিত ক্রেতা",
        rating: r.rating || 5,
        text: r.comment || "ব্যাগের কোয়ালিটি অসাধারণ! যেমন ছবিতে দেখেছি তেমনই পেয়েছি।",
        date: r.date || "সম্প্রতি ভেরিফাইড অর্ডার",
        verified: true,
      }))
    : [
        {
          author: "তানভীর আহমেদ (ঢাকা)",
          rating: 5,
          text: "অর্ডার করার ২ দিনের মধ্যেই ডেলিভারি পেয়েছি। কাপড় এবং সেলাইয়ের ফিনিশিং অনেক প্রিমিয়াম। ট্রাভেলের জন্য পারফেক্ট!",
          date: "২ দিন আগে",
          verified: true,
        },
        {
          author: "মাহমুদুল হাসান (চট্টগ্রাম)",
          rating: 5,
          text: "অফিস এবং ট্যুর দুই কাজেই ব্যবহার করছি। ভেতরের ল্যাপটপ চেম্বারটা বেশ সুরক্ষিত। ডেলিভারি ম্যানের সামনে দেখে পেমেন্ট করেছি।",
          date: "১ সপ্তাহ আগে",
          verified: true,
        },
        {
          author: "ফারহানা ইয়াসমিন (সিলেট)",
          rating: 5,
          text: "কালারটা বাস্তবে আরও সুন্দর! মেটেরিয়াল বেশ হেভি এবং জিপারগুলো খুব স্মুথ। ১০০% রেকমেন্ডেড।",
          date: "১০ দিন আগে",
          verified: true,
        },
      ];

  const defaultFaqs = [
    {
      question: "আমি কি পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারব?",
      answer: "হ্যাঁ, অবশ্যই! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে মূল্য পরিশোধ করতে পারবেন।",
    },
    {
      question: "ডেলিভারি পেতে কতদিন সময় লাগে?",
      answer: "ঢাকার ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২ থেকে ৩ কার্যদিবসের মধ্যে আপনার ঠিকানায় ডেলিভারি পৌঁছে যাবে।",
    },
    {
      question: "ব্যাগে কোনো সমস্যা থাকলে পরিবর্তনের সুযোগ আছে কি?",
      answer: "পণ্য হাতে পাওয়ার পর কোনো ত্রুটি দেখা দিলে আমাদের ৭ দিনের ফ্রি রিপ্লেসমেন্ট পলিসি রয়েছে। তাৎক্ষণিক আমাদের হটলাইন বা হোয়াটসঅ্যাপে যোগাযোগ করলেই সমাধান পাবেন।",
    },
    {
      question: "অর্ডার করার পর কীভাবে কনফার্মেশন পাব?",
      answer: "অর্ডার সম্পন্ন করার সাথে সাথে আমাদের কাস্টমার সাপোর্ট টিম থেকে ফোন বা এসএমএস এর মাধ্যমে আপনার অর্ডারটি কনফার্ম করা হবে।",
    },
  ];

  const defaultPainPoints = [
    {
      title: "কিছুদিন পরেই জিপার নষ্ট বা চেইন ফেটে যাওয়া",
      description: "কমদামী ব্যাগে নিম্নমানের প্লাস্টিক জিপার থাকায় কিছুদিন ব্যবহারের পরেই রানার ভেঙে যায় বা চেইন আটকে যায়।",
    },
    {
      title: "কাঁধে ও পিঠে অতিরিক্ত ব্যথার সৃষ্টি",
      description: "সঠিক কুশনিং ও এর্গোনমিক ব্যালেন্স না থাকায় ভারী জিনিস বহনে কাঁধে অতিরিক্ত চাপ পড়ে এবং তীব্র ব্যথার সৃষ্টি হয়।",
    },
    {
      title: "বৃষ্টির পানিতে ল্যাপটপ বা কাপড় ভিজে নষ্ট হওয়া",
      description: "সাধারণ ফ্যাব্রিক পানি প্রতিরোধ করতে পারে না, ফলে অপ্রত্যাশিত বৃষ্টিতে ভেতরের মূল্যবান ইলেকট্রনিক্স ক্ষতিগ্রস্ত হয়।",
    },
    {
      title: "অফিস বা মিটিংয়ে আনপ্রফেশনাল ও সস্তা লুক",
      description: "সাধারণ ব্যাগ দেখতে অগোছালো ও খেলো মনে হয়, যা আপনার ব্যক্তিত্ব ও পেশাদার ভাবমূর্তিকে ম্লান করে দেয়।",
    },
    {
      title: "ফ্যাব্রিকের কালার ফেড হয়ে কুৎসিত আকার ধারণ করা",
      description: "কমদামী কাপড়ে সামান্য ধুলোবালি বা রোদে রঙ জ্বলে যায় এবং অল্পদিনেই পুরনো ও বিবর্ণ দেখায়।",
    },
    {
      title: "কম্পার্টমেন্টের অভাবে এলোমেলো জিনিসপত্র খোঁজার ঝামেলা",
      description: "নির্দিষ্ট পকেট না থাকায় চাবি, ফোন, পাওয়ারব্যাংক বা জরুরি কাগজ খুঁজে পেতে বারবার হয়রানির শিকার হতে হয়।",
    },
  ];

  const defaultTargetAudience = [
    {
      title: "চাকরিজীবী ও কর্পোরেট প্রফেশনাল",
      description: "অফিস ল্যাপটপ, ডকুমেন্টস ও প্রয়োজনীয় জিনিস গুছিয়ে প্রফেশনাল লুকে বহন করার জন্য সেরা।",
      icon: "Briefcase",
    },
    {
      title: "ইউনিভার্সিটি ও কলেজ শিক্ষার্থী",
      description: "বই-খাতা, ট্যাব ও গ্যাজেট নিয়ে সারাদিন ক্যাম্পাসে স্বাচ্ছন্দ্যে ঘুরে বেড়ানোর জন্য পারফেক্ট।",
      icon: "GraduationCap",
    },
    {
      title: "দৈনন্দিন ট্রাভেলার ও ব্যাকপ্যাকার",
      description: "১-২ দিনের শর্ট ট্যুর বা যেকোনো ভ্রমণে প্রয়োজনীয় জামাকাপড় ও গিয়ার সহজে বহনে উপযোগী।",
      icon: "Plane",
    },
    {
      title: "বাইকার ও নিয়মিত রাইডার",
      description: "বাতাস ও বৃষ্টির ধকল সামলে পিঠে শক্তভাবে এঁটে থাকে, ফলে রাইডিংয়ের সময় থাকে শতভাগ আরামদায়ক।",
      icon: "Bike",
    },
    {
      title: "প্রিয়জনকে উপহার দেওয়ার সেরা চয়েস",
      description: "রুচিশীল ও প্রিমিয়াম উপহার হিসেবে জন্মদিন, উৎসব বা বিশেষ দিনে প্রিয়জনকে সারপ্রাইজ দিন।",
      icon: "Gift",
    },
  ];

  const basePrice = product?.price || 1850;
  const comparePrice = product?.compareAtPrice || (product?.price ? Math.round(product.price * 1.35) : 2450);

  const defaultBundles = [
    {
      id: "bundle-1",
      title: "১টি ব্যাগ (রেগুলার অফার)",
      subtitle: "রেগুলার ডিসকাউন্টে ১টি প্রিমিয়াম ব্যাগ",
      quantity: 1,
      price: basePrice,
      compare_at_price: comparePrice,
      is_popular: false,
      free_delivery: false,
    },
    {
      id: "bundle-2",
      title: "২টি ব্যাগ (🔥 বেস্ট ভ্যালু প্যাকেজ)",
      subtitle: "সারাদেশে ডেলিভারি চার্জ একদম ফ্রি + মেগা সেভিংস!",
      quantity: 2,
      price: Math.round(basePrice * 1.85),
      compare_at_price: comparePrice * 2,
      is_popular: true,
      free_delivery: true,
    },
  ];

  const rawBaseSlug = product?.slug
    ? `${product.slug}-offer`
    : product?.name
    ? `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-offer`
    : `offer-${Date.now().toString().slice(-6)}`;

  const slug = generateUniqueSlug(rawBaseSlug, existingSlugs);

  return {
    id: slug,
    slug,
    title: product?.name ? `${product.name} — এক্সক্লুসিভ অফার` : "প্রিমিয়াম ক্যানভাস ব্যাগ — মেগা অফার",
    status: "published",
    product_id: product?.id,
    template,
    custom_domain: "",
    subdomain: "",
    meta_title: product?.name ? `${product.name} | CanvasBag Special Deal` : "CanvasBag Official Special Offer",
    meta_description: "প্রিমিয়াম কোয়ালিটির ক্যানভাস ব্যাগ এখন সীমিত সময়ের মেগা ডিসকাউন্টে। ক্যাশ অন ডেলিভারি সারাদেশে।",
    og_image: primaryImage,
    canonical_url: `/lp/${slug}`,
    product_override: {
      name: product?.name || "প্রিমিয়াম ক্যানভাস ট্রাভেল ব্যাগ",
      headline: product?.name || "প্রিমিয়াম ক্যানভাস ট্রাভেল ব্যাগ",
      subheadline: product?.shortDescription || "দৈনন্দিন অফিস, ভ্রমণ ও ক্লাসের জন্য এক ব্যাগেই সব সমাধান। টেকসই ফ্যাব্রিক ও রাজকীয় লুক।",
      hook_headline: "দৈনন্দিন অফিস, ভ্রমণ কিংবা আউটিংয়ে সাধারণ ব্যাগের ভারে ক্লান্ত?",
      quote_highlight: "“প্রিমিয়াম ওয়াটারপ্রুফ ক্যানভাস ফ্যাব্রিক ও এর্গোনমিক ডিজাইন — যা আপনার কাঁধের চাপ কমিয়ে দেবে এবং দেবে এক অনন্য প্রিমিয়াম লুক”",
      badge: "🔥 সীমিত সময়ের মেগা অফার • ৩৫% ছাড়",
      price: basePrice,
      compare_at_price: comparePrice,
      hero_image: primaryImage,
      dimensions_image: galleryImages[1] || primaryImage,
      gallery_images: galleryImages.length > 0 ? galleryImages : [primaryImage],
      description: product?.description || "প্রিমিয়াম ক্যানভাস ও জেনুইন লেদার ট্রিমের সমন্বয়ে তৈরি অনন্য একটি ব্যাগ।",
      story: product?.story || "প্রতিটি ক্যানভাস ব্যাগ সূক্ষ্ম কারুকার্য ও শতভাগ নিখুঁত ফিনিশিংয়ের মাধ্যমে তৈরি। স্টাইলিশ লুকের সাথে সর্বোচ্চ ধারণক্ষমতা ও টেকসই মানের এক অনন্য মেলবন্ধন।",
      variants: product?.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price || product.price,
            image: v.image || primaryImage,
            in_stock: true,
          }))
        : [
            { id: "black", name: "রয়্যাল ব্ল্যাক (Classic Black)", price: basePrice, image: primaryImage, in_stock: true },
            { id: "olive", name: "মিলিটারি অলিভ (Military Olive)", price: basePrice, image: primaryImage, in_stock: true },
            { id: "khaki", name: "ভিন্টেজ খাকি (Vintage Khaki)", price: basePrice, image: primaryImage, in_stock: true },
          ],
      bundles: defaultBundles,
      pain_points: defaultPainPoints,
      target_audience: defaultTargetAudience,
      solution_title: "কেন আমাদের এই ব্যাগটি অন্যদের চেয়ে সেরা?",
      solution_description: "CanvasBag তৈরি করেছে খাঁটি প্রিমিয়াম ক্যানভাস ফ্যাব্রিক ও আধুনিক এর্গোনমিক প্রযুক্তির সমন্বয়ে, যা ওজনে হালকা অথচ শতভাগ মজবুত ও দীর্ঘস্থায়ী।",
      solution_points: [
        "উচ্চমানের ওয়াটারপ্রুফ কোটিং যা বৃষ্টিতে সবকিছু সুরক্ষিত রাখে",
        "১৫.৬\" ডেডিকেটেড প্যাডেড ল্যাপটপ চেম্বার",
        "স্মুথ মেটাল জিপার রানার যা দীর্ঘস্থায়ী সার্ভিস দেয়",
        "শ্বাসপ্রশ্বাসযোগ্য সফট কুশন ব্যাক প্যাড — ব্যথামুক্ত দীর্ঘ ভ্রমণ",
      ],
      urgent_notice: {
        title: "একটি কথা মনে রাখবেন...",
        message: "বাজারে সস্তা নকল কপির ভিড়ে কোয়ালিটি নিয়ে আপোষ করবেন না। একটি ভালো ব্যাগ আপনার রুচি ও ব্যক্তিত্বের পরিচয় দেয় এবং বছরের পর বছর নিশ্চিন্তে সার্ভিস প্রদান করে।",
        button_text: "👉 সরাসরি এখনই অর্ডার নিশ্চিত করুন",
      },
      countdown_minutes: 45,
      stock_left: 9,
      benefits: defaultBenefits,
      features: [
        { title: "১৫.৬\" ল্যাপটপ স্লট", description: "শক-অ্যাবজরবিং ফোম লাইনিং যা ল্যাপটপ রাখে সুরক্ষিত।" },
        { title: "হিডেন অ্যান্টি-থেফট পকেট", description: "মূল্যবান পাসপোর্ট ও মানিব্যাগ নিরাপদে রাখার পেছনের গোপন পকেট।" },
        { title: "ওয়াটার বোটল পকেট", description: "দুই পাশে ছাতা ও পানির বোতল রাখার উপযোগী পকেট।" },
        { title: "লাগেজ ট্রলি স্ট্র্যাপ", description: "ট্রাভেলিংয়ের সময় ট্রলি ব্যাগের সাথে সহজেই আটকে নেওয়ার সুবিধা।" },
      ],
      specs: defaultSpecs,
      reviews: defaultReviews,
      faqs: defaultFaqs,
      marquee_text: "⚡ সীমিত সময়ের বিশেষ অফার • সারাদেশে ক্যাশ অন ডেলিভারি • পণ্য দেখে মূল্য পরিশোধের সুযোগ ⚡",
      urgency_text: "স্টক সীমিত! অফারটি শেষ হওয়ার আগেই আপনার পছন্দের কালারটি সিলেক্ট করে অর্ডার কনফার্ম করুন।",
      cta_text: "সরাসরি অর্ডার করতে এখানে ক্লিক করুন",
      cta_subtext: "ক্যাশ অন ডেলিভারি • দেখে মূল্য পরিশোধ করুন",
      shipping_notice: "হোম ডেলিভারি সারাদেশে। কোনো অগ্রিম পেমেন্ট ছাড়া পণ্য হাতে পেয়ে চেক করে টাকা দিন।",
      phone: CANVASBAG_BRAND.phone,
      whatsapp: CANVASBAG_BRAND.whatsapp,
    },
    sections: DEFAULT_LANDING_PAGE_SECTIONS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function safeImageSrc(src: any, fallback: string = "/brand/logo.webp"): string {
  let target = src;
  if (target && typeof target === "object" && typeof target.url === "string") {
    target = target.url;
  }
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return fallback;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function resolveLandingPageProductData(
  landingPage: LandingPage,
  catalogProducts: Product[] = [],
  settings?: SiteSettings
) {
  const baseProduct = catalogProducts.find((p) => p.id === landingPage.product_id) || catalogProducts[0];
  const override = landingPage.product_override || {};

  const name = override.name || baseProduct?.name || landingPage.title;
  const headline = override.headline || name;
  const subheadline = override.subheadline || baseProduct?.shortDescription || "";
  const price = override.price ?? baseProduct?.price ?? 0;
  const compareAtPrice = override.compare_at_price ?? baseProduct?.compareAtPrice ?? (price ? Math.round(price * 1.3) : 0);
  const badge = override.badge || baseProduct?.badge || "🔥 সীমিত সময়ের স্পেশাল অফার";

  const rawPrimary =
    override.hero_image ||
    (baseProduct?.images?.[0] as any)?.url ||
    (typeof baseProduct?.images?.[0] === "string" ? baseProduct?.images?.[0] : null) ||
    baseProduct?.image ||
    baseProduct?.imageUrl ||
    "/brand/logo.webp";

  const primaryImage = safeImageSrc(rawPrimary);

  const rawGallery =
    override.gallery_images && override.gallery_images.length > 0
      ? override.gallery_images
      : (baseProduct?.images || []).map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean) as string[];

  const galleryImages = rawGallery
    .map((img) => safeImageSrc(img))
    .filter(Boolean);

  const rawVariants =
    override.variants && override.variants.length > 0
      ? override.variants
      : baseProduct?.variants && baseProduct.variants.length > 0
      ? baseProduct.variants
      : [{ id: "std", name: "Standard", price, image: primaryImage, in_stock: true }];

  const variants = rawVariants.map((v) => ({
    id: v.id,
    name: v.name,
    price: v.price || price,
    image: safeImageSrc(v.image, primaryImage),
    in_stock: true,
  }));

  const benefits = override.benefits && override.benefits.length > 0
    ? override.benefits
    : (baseProduct?.benefits || []).map((b) => ({
        title: typeof b === "string" ? b : (b as any).title,
        description: "",
      }));

  const specs = override.specs && override.specs.length > 0
    ? override.specs
    : (baseProduct?.specs || []).map((s) => {
        if (typeof s === "string") {
          const parts = s.split(":");
          return { key: parts[0]?.trim() || "", value: parts.slice(1).join(":")?.trim() || s };
        }
        return { key: s.key || "", value: s.value || "" };
      });

  const reviews = override.reviews && override.reviews.length > 0
    ? override.reviews
    : (baseProduct?.reviews || []).map((r) => ({
        author: r.author,
        rating: r.rating,
        text: r.comment,
        date: r.date,
        verified: true,
      }));

  const faqs = override.faqs && override.faqs.length > 0 ? override.faqs : [];

  const hookHeadline =
    override.hook_headline ||
    headline ||
    "দৈনন্দিন অফিস, ভ্রমণ কিংবা আউটিংয়ে সাধারণ ব্যাগের ভারে ক্লান্ত?";

  const quoteHighlight =
    override.quote_highlight ||
    "“প্রিমিয়াম ওয়াটারপ্রুফ ক্যানভাস ফ্যাব্রিক ও এর্গোনমিক ডিজাইন — যা আপনার কাঁধের চাপ কমিয়ে দেবে এবং দেবে এক অনন্য প্রিমিয়াম লুক”";

  const painPoints =
    override.pain_points && override.pain_points.length > 0
      ? override.pain_points
      : [
          {
            title: "কিছুদিন পরেই জিপার নষ্ট বা চেইন ফেটে যাওয়া",
            description: "কমদামী ব্যাগে নিম্নমানের প্লাস্টিক জিপার থাকায় কিছুদিন ব্যবহারের পরেই রানার ভেঙে যায় বা চেইন আটকে যায়।",
          },
          {
            title: "কাঁধে ও পিঠে অতিরিক্ত ব্যথার সৃষ্টি",
            description: "সঠিক কুশনিং ও এর্গোনমিক ব্যালেন্স না থাকায় ভারী জিনিস বহনে কাঁধে অতিরিক্ত চাপ পড়ে এবং তীব্র ব্যথার সৃষ্টি হয়।",
          },
          {
            title: "বৃষ্টির পানিতে ল্যাপটপ বা কাপড় ভিজে নষ্ট হওয়া",
            description: "সাধারণ ফ্যাব্রিক পানি প্রতিরোধ করতে পারে না, ফলে অপ্রত্যাশিত বৃষ্টিতে ভেতরের মূল্যবান ইলেকট্রনিক্স ক্ষতিগ্রস্ত হয়।",
          },
          {
            title: "অফিস বা মিটিংয়ে আনপ্রফেশনাল ও সস্তা লুক",
            description: "সাধারণ ব্যাগ দেখতে অগোছালো ও খেলো মনে হয়, যা আপনার ব্যক্তিত্ব ও পেশাদার ভাবমূর্তিকে ম্লান করে দেয়।",
          },
          {
            title: "ফ্যাব্রিকের কালার ফেড হয়ে কুৎসিত আকার ধারণ করা",
            description: "কমদামী কাপড়ে সামান্য ধুলোবালি বা রোদে রঙ জ্বলে যায় এবং অল্পদিনেই পুরনো ও বিবর্ণ দেখায়।",
          },
          {
            title: "কম্পার্টমেন্টের অভাবে এলোমেলো জিনিসপত্র খোঁজার ঝামেলা",
            description: "নির্দিষ্ট পকেট না থাকায় চাবি, ফোন, পাওয়ারব্যাংক বা জরুরি কাগজ খুঁজে পেতে বারবার হয়রানির শিকার হতে হয়।",
          },
        ];

  const targetAudience =
    override.target_audience && override.target_audience.length > 0
      ? override.target_audience
      : [
          {
            title: "চাকরিজীবী ও কর্পোরেট প্রফেশনাল",
            description: "অফিস ল্যাপটপ, ডকুমেন্টস ও প্রয়োজনীয় জিনিস গুছিয়ে প্রফেশনাল লুকে বহন করার জন্য সেরা।",
            icon: "Briefcase",
          },
          {
            title: "ইউনিভার্সিটি ও কলেজ শিক্ষার্থী",
            description: "বই-খাতা, ট্যাব ও গ্যাজেট নিয়ে সারাদিন ক্যাম্পাসে স্বাচ্ছন্দ্যে ঘুরে বেড়ানোর জন্য পারফেক্ট।",
            icon: "GraduationCap",
          },
          {
            title: "দৈনন্দিন ট্রাভেলার ও ব্যাকপ্যাকার",
            description: "১-২ দিনের শর্ট ট্যুর বা যেকোনো ভ্রমণে প্রয়োজনীয় জামাকাপড় ও গিয়ার সহজে বহনে উপযোগী।",
            icon: "Plane",
          },
          {
            title: "বাইকার ও নিয়মিত রাইডার",
            description: "বাতাস ও বৃষ্টির ধকল সামলে পিঠে শক্তভাবে এঁটে থাকে, ফলে রাইডিংয়ের সময় থাকে শতভাগ আরামদায়ক।",
            icon: "Bike",
          },
          {
            title: "প্রিয়জনকে উপহার দেওয়ার সেরা চয়েস",
            description: "রুচিশীল ও প্রিমিয়াম উপহার হিসেবে জন্মদিন, উৎসব বা বিশেষ দিনে প্রিয়জনকে সারপ্রাইজ দিন।",
            icon: "Gift",
          },
        ];

  const bundles =
    override.bundles && override.bundles.length > 0
      ? override.bundles
      : [
          {
            id: "bundle-1",
            title: "১টি ব্যাগ (রেগুলার অফার)",
            subtitle: "রেগুলার অফার প্রাইস",
            quantity: 1,
            price: price,
            compare_at_price: compareAtPrice,
            is_popular: false,
            free_delivery: false,
          },
          {
            id: "bundle-2",
            title: "২টি ব্যাগ (🔥 বেস্ট ভ্যালু প্যাকেজ)",
            subtitle: "সারাদেশে ডেলিভারি চার্জ একদম ফ্রি + মেগা সেভিংস!",
            quantity: 2,
            price: Math.round(price * 1.85),
            compare_at_price: compareAtPrice * 2,
            is_popular: true,
            free_delivery: true,
          },
        ];

  const solutionTitle =
    override.solution_title || "কেন আমাদের এই ব্যাগটি অন্যদের চেয়ে সেরা?";

  const solutionDescription =
    override.solution_description ||
    "CanvasBag তৈরি করেছে খাঁটি প্রিমিয়াম ক্যানভাস ফ্যাব্রিক ও আধুনিক এর্গোনমিক প্রযুক্তির সমন্বয়ে, যা ওজনে হালকা অথচ শতভাগ মজবুত ও দীর্ঘস্থায়ী।";

  const solutionPoints =
    override.solution_points && override.solution_points.length > 0
      ? override.solution_points
      : [
          "উচ্চমানের ওয়াটারপ্রুফ কোটিং যা বৃষ্টিতে সবকিছু সুরক্ষিত রাখে",
          "১৫.৬\" ডেডিকেটেড প্যাডেড ল্যাপটপ চেম্বার",
          "স্মুথ মেটাল জিপার রানার যা দীর্ঘস্থায়ী সার্ভিস দেয়",
          "শ্বাসপ্রশ্বাসযোগ্য সফট কুশন ব্যাক প্যাড — ব্যথামুক্ত দীর্ঘ ভ্রমণ",
        ];

  const dimensionsImage = safeImageSrc(
    override.dimensions_image || galleryImages[1] || primaryImage
  );

  const urgentNotice = override.urgent_notice || {
    title: "একটি কথা মনে রাখবেন...",
    message:
      "বাজারে সস্তা নকল কপির ভিড়ে কোয়ালিটি নিয়ে আপোষ করবেন না। একটি ভালো ব্যাগ আপনার রুচি ও ব্যক্তিত্বের পরিচয় দেয় এবং বছরের পর বছর নিশ্চিন্তে সার্ভিস প্রদান করে।",
    button_text: "👉 সরাসরি এখনই অর্ডার নিশ্চিত করুন",
  };

  const countdownMinutes = override.countdown_minutes || 45;
  const stockLeft = override.stock_left || 9;

  return {
    baseProduct,
    name,
    headline,
    subheadline,
    hookHeadline,
    quoteHighlight,
    badge,
    price,
    compareAtPrice,
    primaryImage,
    dimensionsImage,
    galleryImages: galleryImages.length > 0 ? galleryImages : [primaryImage],
    description: override.description || baseProduct?.description || "",
    story: override.story || baseProduct?.story || "",
    variants,
    bundles,
    painPoints,
    targetAudience,
    solutionTitle,
    solutionDescription,
    solutionPoints,
    urgentNotice,
    countdownMinutes,
    stockLeft,
    benefits,
    features: override.features || [],
    specs,
    reviews,
    faqs,
    marqueeText: override.marquee_text || "সারাদেশে ক্যাশ অন ডেলিভারি • দেখে মূল্য পরিশোধের সুযোগ",
    urgencyText: override.urgency_text || "স্টক সীমিত! অফার শেষ হওয়ার আগেই অর্ডার করুন।",
    ctaText: override.cta_text || "সরাসরি অর্ডার করতে এখানে ক্লিক করুন",
    ctaSubtext: override.cta_subtext || "ক্যাশ অন ডেলিভারি • দেখে মূল্য পরিশোধ",
    shippingNotice: override.shipping_notice || "হোম ডেলিভারি সারাদেশে। কোনো অগ্রিম পেমেন্ট ছাড়া পণ্য দেখে টাকা দিন।",

    // Brand Contact Details & Identity (Exact match with main website)
    brandName: CANVASBAG_BRAND.name,
    brandFullName: CANVASBAG_BRAND.fullName,
    brandTagline: CANVASBAG_BRAND.tagline,
    logoUrl: settings?.logoUrl || CANVASBAG_BRAND.logoUrl,
    phone:
      override.phone &&
      !override.phone.includes("01700000000") &&
      !override.phone.includes("01712345678") &&
      !override.phone.includes("01XXXXXXXXX")
        ? override.phone
        : settings?.phone || settings?.whatsappNumber || CANVASBAG_BRAND.phone,
    whatsapp:
      override.whatsapp &&
      !override.whatsapp.includes("01700000000") &&
      !override.whatsapp.includes("01712345678") &&
      !override.whatsapp.includes("01XXXXXXXXX")
        ? override.whatsapp
        : settings?.whatsappNumber || settings?.phone || CANVASBAG_BRAND.whatsapp,
    email: CANVASBAG_BRAND.email,
    address: CANVASBAG_BRAND.address,
    hours: CANVASBAG_BRAND.hours,
    facebookUrl: settings?.facebookUrl || CANVASBAG_BRAND.facebookUrl,
    messengerUrl: settings?.messengerUsername
      ? `https://m.me/${settings.messengerUsername}`
      : CANVASBAG_BRAND.messengerUrl,
  };
}
