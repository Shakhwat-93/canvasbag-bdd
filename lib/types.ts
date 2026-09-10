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

export type LandingPageComponent = {
  type: "hero" | "product_showcase" | "benefits" | "reviews" | "faq" | "checkout";
  settings: Record<string, any>;
};

export type LandingPage = {
  id: string; // Slug
  slug?: string;
  title: string;
  custom_domain?: string | null;
  gtm_id?: string | null;
  ga4_id?: string | null;
  pixel_id?: string | null;
  template?: string;
  custom_css?: string | null;
  components?: LandingPageComponent[];
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