export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string | null;
  parent_id?: string | null;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
  isVisible?: boolean;
  is_visible?: boolean;
  icon?: string;
  seoTitle?: string;
  seo_title?: string;
  seoDescription?: string;
  seo_description?: string;
  productCount?: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  colorCode?: string;
  image?: string;
  price?: number;
  compareAtPrice?: number | null;
  inStock?: boolean;
  in_stock?: boolean;
};

export type ProductImage = {
  id?: string;
  url: string;
  alt?: string;
};

export type ProductReview = {
  id?: string | number;
  product_id?: string;
  product_name?: string;
  name?: string;
  author?: string;
  customer_name?: string;
  rating: number;
  comment?: string;
  quote?: string;
  date?: string;
  location?: string;
  created_at?: string;
  status?: "pending" | "approved";
};
export type Review = ProductReview;

export type Product = {
  id: string;
  name: string;
  db_product_name?: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  categoryId?: string;
  price: number;
  compareAtPrice?: number | null;
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  shortDescription?: string;
  description?: string;
  story?: string;
  benefits?: string[];
  specs?: (string | { key: string; value: string })[];
  image?: string;
  imageUrl?: string;
  images: (string | ProductImage)[];
  variants?: ProductVariant[];
  isBestSeller?: boolean;
  is_best_seller?: boolean;
  isFeatured?: boolean;
  is_featured?: boolean;
  status?: "active" | "inactive" | "draft";
  badge?: string | null;
  additionalCategorySlugs?: string[];
  salesCount?: number;
  created_at?: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  db_product_name?: string;
  image: string;
  price: number;
  compareAtPrice?: number | null;
  variantId: string;
  variantName: string;
  quantity: number;
};

export type SiteSettings = {
  announcementText?: string;
  announcementEnabled?: boolean;
  announcementShowHome?: boolean;
  announcementShowProduct?: boolean;
  announcementShowCategory?: boolean;
  announcementShowShop?: boolean;
  announcementShowCart?: boolean;
  announcementShowCheckout?: boolean;
  heroHeadline?: string;
  heroSubheadline?: string;
  promoTitle?: string;
  promoHeadline?: string;
  promoDescription?: string;
  promoLink?: string;
  promoButtonText?: string;
  logoUrl?: string | null;
  heroBgImage?: string;
  heroSliderImage1?: string | null;
  heroSliderLink1?: string | null;
  heroSliderImage2?: string | null;
  heroSliderLink2?: string | null;
  heroSliderImage3?: string | null;
  heroSliderLink3?: string | null;
  heroSliderImage4?: string | null;
  heroSliderLink4?: string | null;
  heroSliderImage5?: string | null;
  heroSliderLink5?: string | null;
  heroImage1?: string;
  heroImage2?: string;
  heroImage3?: string;
  heroImage4?: string;
  heroImage5?: string;
  heroImage6?: string;
  heroImage7?: string;
  gtmId?: string;
  ga4Id?: string;
  pixelId?: string;
  fbAccessToken?: string;
  fbTestCode?: string;
  whatsappNumber?: string;
  messengerUsername?: string;
  phone?: string;
  facebookUrl?: string;
  duplicateBlockHours?: number;
  heroMobileFourCards?: boolean;
  shippingInsideDhaka?: number | string;
  shippingOutsideDhaka?: number | string;
  themeColor?: string;
  category_product_orders?: Record<string, string[]>;
};

export type LandingPageStatus = "published" | "draft";

export type LandingPageTemplateId = "high_converting" | "modern_luxury" | "editorial_story";

export type LandingPageSectionType =
  | "top_marquee"
  | "navbar"
  | "hero"
  | "urgency_timer"
  | "pain_points"
  | "solution_spotlight"
  | "trust_strip"
  | "benefits"
  | "target_audience"
  | "features"
  | "story"
  | "gallery"
  | "specs"
  | "urgent_notice"
  | "reviews"
  | "faq"
  | "order_form"
  | "footer";

export type LandingPageSectionConfig = {
  id: string;
  type: LandingPageSectionType;
  enabled: boolean;
  title?: string;
  subtitle?: string;
  data?: Record<string, any>;
};

export type LandingPageComponent = {
  type: "hero" | "product_showcase" | "benefits" | "reviews" | "faq" | "checkout";
  settings: Record<string, any>;
};

export type LandingPageProductOverride = {
  name?: string;
  db_product_name?: string;
  headline?: string;
  subheadline?: string;
  hook_headline?: string;
  quote_highlight?: string;
  badge?: string;
  price?: number;
  compare_at_price?: number | null;
  hero_image?: string;
  dimensions_image?: string;
  gallery_images?: string[];
  description?: string;
  story?: string;
  variants?: { id: string; name: string; price?: number; image?: string; in_stock?: boolean }[];
  bundles?: {
    id: string;
    title: string;
    subtitle?: string;
    quantity: number;
    price: number;
    compare_at_price?: number;
    is_popular?: boolean;
    free_delivery?: boolean;
  }[];
  pain_points?: { title: string; description?: string }[];
  target_audience?: { title: string; description?: string; icon?: string }[];
  solution_title?: string;
  solution_description?: string;
  solution_points?: string[];
  urgent_notice?: { title?: string; message?: string; button_text?: string };
  countdown_minutes?: number;
  stock_left?: number;
  benefits?: { title: string; description: string; icon?: string }[];
  features?: { title: string; description: string; image?: string }[];
  specs?: { key: string; value: string }[];
  reviews?: { author: string; rating: number; text: string; date?: string; verified?: boolean }[];
  faqs?: { question: string; answer: string }[];
  marquee_text?: string;
  urgency_text?: string;
  cta_text?: string;
  cta_subtext?: string;
  shipping_notice?: string;
  hero_bullets?: string[];
  return_policy_notice?: string;
  benefits_title?: string;
  benefits_subtitle?: string;
  target_audience_title?: string;
  target_audience_subtitle?: string;
  specs_title?: string;
  specs_subtitle?: string;
  phone?: string;
  whatsapp?: string;
};

export type LandingPage = {
  id: string; // Slug
  slug?: string;
  title: string;
  db_product_name?: string;
  status?: LandingPageStatus;
  product_id?: string;
  template?: LandingPageTemplateId | string;
  custom_domain?: string | null;
  subdomain?: string | null;

  // SEO & OpenGraph
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  canonical_url?: string;

  // Analytics & Pixel IDs
  gtm_id?: string | null;
  ga4_id?: string | null;
  pixel_id?: string | null;

  // Full product overrides & content
  product_override?: LandingPageProductOverride;

  // Section list and ordering
  sections?: LandingPageSectionConfig[];

  // Legacy / fallback components
  components?: LandingPageComponent[];
  custom_css?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LocalOrder = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  note?: string | null;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled" | string;
  payment_method: "cod";
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  attribution?: Record<string, any>;
  created_at: string;
  items?: LocalOrderItem[];
};

export type LocalOrderItem = {
  id?: number;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  unit_price: number;
  quantity: number;
  total: number;
};

export type RemoteOrder = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  product_name: string;
  quantity: number;
  source: string;
  status: string;
  amount: number;
  items: number;
  payment_status: string;
  shipping_zone: string;
  ordered_items: { name: string; price: number; quantity: number }[];
  notes?: string | null;
  traffic_source?: string | null;
  ip_address?: string | null;
  created_at: string;
};

export type SupportMessage = {
  id: number;
  name: string;
  phone: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
  updated_at?: string;
};