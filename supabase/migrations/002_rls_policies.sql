-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_profiles WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- CLIENT PROFILES
-- ============================================================

CREATE POLICY "clients_own_profile_select" ON client_profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "clients_own_profile_update" ON client_profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "clients_profile_insert" ON client_profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN PROFILES
-- ============================================================

CREATE POLICY "admins_own_profile_select" ON admin_profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "admins_insert" ON admin_profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_update" ON admin_profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- ADMIN INVITATIONS
-- ============================================================

CREATE POLICY "invitations_admin_all" ON admin_invitations
  FOR ALL USING (is_admin());
CREATE POLICY "invitations_public_select" ON admin_invitations
  FOR SELECT USING (true);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE POLICY "companies_client_select" ON companies
  FOR SELECT USING (client_id = auth.uid() OR is_admin());
CREATE POLICY "companies_client_insert" ON companies
  FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "companies_client_update" ON companies
  FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "companies_client_delete" ON companies
  FOR DELETE USING (client_id = auth.uid());

-- ============================================================
-- CATEGORIES (public read, admin write)
-- ============================================================

CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);
CREATE POLICY "categories_admin_insert" ON categories
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE USING (is_admin());
CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE USING (is_admin());

-- ============================================================
-- PRODUCTS (visible read, admin full)
-- ============================================================

CREATE POLICY "products_read" ON products
  FOR SELECT USING (is_visible = true OR is_admin());
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "products_admin_update" ON products
  FOR UPDATE USING (is_admin());
CREATE POLICY "products_admin_delete" ON products
  FOR DELETE USING (is_admin());

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================

CREATE POLICY "variants_public_read" ON product_variants
  FOR SELECT USING (true);
CREATE POLICY "variants_admin_insert" ON product_variants
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "variants_admin_update" ON product_variants
  FOR UPDATE USING (is_admin());
CREATE POLICY "variants_admin_delete" ON product_variants
  FOR DELETE USING (is_admin());

-- ============================================================
-- CART ITEMS
-- ============================================================

CREATE POLICY "cart_own" ON cart_items
  FOR ALL USING (client_id = auth.uid());

-- ============================================================
-- ORDERS
-- ============================================================

CREATE POLICY "orders_client_select" ON orders
  FOR SELECT USING (client_id = auth.uid() OR is_admin());
CREATE POLICY "orders_client_insert" ON orders
  FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE USING (is_admin());
CREATE POLICY "orders_admin_delete" ON orders
  FOR DELETE USING (
    is_admin() AND EXISTS (
      SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.client_id = auth.uid() OR is_admin())
    )
  );
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- ============================================================
-- PROMO CODES
-- ============================================================

CREATE POLICY "promo_admin_all" ON promo_codes
  FOR ALL USING (is_admin());

-- ============================================================
-- PROMO CODE USAGES
-- ============================================================

CREATE POLICY "promo_usages_client_select" ON promo_code_usages
  FOR SELECT USING (client_id = auth.uid() OR is_admin());
CREATE POLICY "promo_usages_insert" ON promo_code_usages
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (client_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_client_select" ON notifications
  FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "notifications_client_update" ON notifications
  FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- NEWS
-- ============================================================

CREATE POLICY "news_public_read" ON news
  FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "news_admin_all" ON news
  FOR ALL USING (is_admin());

-- ============================================================
-- CLIENT SETTINGS
-- ============================================================

CREATE POLICY "settings_own" ON client_settings
  FOR ALL USING (client_id = auth.uid());
CREATE POLICY "settings_insert" ON client_settings
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================

CREATE POLICY "order_history_select" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND (orders.client_id = auth.uid() OR is_admin())
    )
  );
CREATE POLICY "order_history_admin_insert" ON order_status_history
  FOR INSERT WITH CHECK (is_admin());
