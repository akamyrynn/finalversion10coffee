-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE admin_role AS ENUM ('ADMIN', 'MANAGER');
CREATE TYPE order_status AS ENUM (
  'waiting',
  'confirmed',
  'invoice_sent',
  'paid',
  'in_production',
  'ready',
  'shipped',
  'delivered',
  'cancelled'
);
CREATE TYPE delivery_method AS ENUM ('self_pickup', 'cdek', 'cap_2000');
CREATE TYPE product_type AS ENUM ('coffee', 'tea', 'accessory');
CREATE TYPE sticker_type AS ENUM ('new', 'month_discount', 'popular');
CREATE TYPE notification_type AS ENUM ('order_update', 'news', 'product_restock');
CREATE TYPE promo_discount_type AS ENUM ('percentage', 'fixed_amount');

-- ============================================================
-- CLIENT PROFILES
-- ============================================================

CREATE TABLE client_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADMIN PROFILES
-- ============================================================

CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'MANAGER',
  invited_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADMIN INVITATIONS
-- ============================================================

CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'MANAGER',
  invited_by UUID NOT NULL REFERENCES admin_profiles(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMPANIES / ORGANIZATIONS
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inn TEXT NOT NULL,
  kpp TEXT,
  ogrn TEXT,
  legal_address TEXT,
  actual_address TEXT,
  bank_name TEXT,
  bik TEXT,
  correspondent_account TEXT,
  settlement_account TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CATEGORIES (nested tree)
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  product_type product_type NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  depth INTEGER NOT NULL DEFAULT 0,
  path TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  product_type product_type NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_images TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  stickers sticker_type[] DEFAULT '{}',

  -- Coffee-specific
  roaster TEXT,
  roast_level TEXT,
  region TEXT,
  processing_method TEXT,
  growing_height TEXT,
  q_grader_rating NUMERIC(3,1),

  -- Tea-specific
  brewing_instructions JSONB,

  -- Coffee brewing methods
  brewing_methods JSONB,

  -- Attached files
  attached_files JSONB,

  -- Media
  images TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sort ON products(sort_order);
CREATE INDEX idx_products_visible ON products(is_visible) WHERE is_visible = true;

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  weight_grams INTEGER,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  grind_options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ============================================================
-- PROMO CODES (created before orders for FK reference)
-- ============================================================

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type promo_discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  is_single_use BOOLEAN DEFAULT false,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  restricted_to_email TEXT,
  restricted_to_client_id UUID REFERENCES client_profiles(id),
  min_order_amount NUMERIC(10,2),
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_promo_code ON promo_codes(code);
CREATE INDEX idx_promo_active ON promo_codes(is_active) WHERE is_active = true;

-- ============================================================
-- CART ITEMS
-- ============================================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  grind_option TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, variant_id, grind_option)
);

CREATE INDEX idx_cart_client ON cart_items(client_id);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  client_id UUID NOT NULL REFERENCES client_profiles(id),
  company_id UUID REFERENCES companies(id),
  status order_status NOT NULL DEFAULT 'waiting',
  delivery_method delivery_method NOT NULL,
  delivery_address TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  delivery_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  total_weight_grams INTEGER DEFAULT 0,
  promo_code_id UUID REFERENCES promo_codes(id),
  comment TEXT,
  admin_notes TEXT,
  cdek_tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  grind_option TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  weight_grams INTEGER
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- PROMO CODE USAGES
-- ============================================================

CREATE TABLE promo_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  client_id UUID NOT NULL REFERENCES client_profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, client_id)
);

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, product_id)
);

CREATE INDEX idx_favorites_client ON favorites(client_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_client ON notifications(client_id);
CREATE INDEX idx_notifications_unread ON notifications(client_id, is_read) WHERE is_read = false;

-- ============================================================
-- NEWS
-- ============================================================

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_news_published ON news(is_published, published_at DESC);

-- ============================================================
-- CLIENT SETTINGS
-- ============================================================

CREATE TABLE client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES client_profiles(id) ON DELETE CASCADE,
  quick_comments TEXT[] DEFAULT '{}',
  default_company_id UUID REFERENCES companies(id),
  default_delivery_method delivery_method,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_history ON order_status_history(order_id);

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    INSERT INTO client_profiles (id, email, full_name, phone)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'phone'
    );
    INSERT INTO client_settings (client_id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'admin' THEN
    INSERT INTO admin_profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE((NEW.raw_user_meta_data->>'admin_role')::admin_role, 'MANAGER')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Updated at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
