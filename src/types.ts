export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'user' | 'admin' | 'super_admin';
  name: string;
  is_verified?: boolean;
  verification_code?: string;
  google_id?: string;
  otp_expires_at?: string;
  avatar_url?: string;
  reset_code?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  meta_title: string;
  meta_description: string;
  image_url: string;
  views: number;
  is_seo_page: boolean;
  created_at: string;
  content: string;
  formula: string;
  example: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  parent_type: 'category' | 'article' | 'app';
  parent_id: string; // ID or Slug
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updated_at: string;
}

export interface ConversionLog {
  id: number;
  type: string;
  from_unit: string;
  to_unit: string;
  from_value: number;
  to_value: number;
  created_at: string;
}

export interface VisitorLog {
  id: number;
  ip: string;
  user_agent: string;
  path: string;
  visited_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_title: string;
  meta_description: string;
  logo_url: string;
  google_analytics_id: string;
  ads: {
    header: string;
    sidebar: string;
    between_content: string;
    footer: string;
  };
  dark_mode_enabled: boolean;
  default_lang: 'en' | 'es' | 'ur';
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

export interface DatabaseState {
  users: User[];
  categories: Category[];
  articles: Article[];
  faqs: FAQ[];
  exchange_rates: ExchangeRates;
  conversions: ConversionLog[];
  visitors: VisitorLog[];
  settings: SiteSettings;
}
