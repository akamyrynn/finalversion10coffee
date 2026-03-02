-- ============================================================
-- SEED: Categories from 10coffee catalog
-- ============================================================

-- КОФЕ: root categories
INSERT INTO categories (id, parent_id, name, slug, product_type, sort_order, depth, path) VALUES
  ('c0000001-0000-0000-0000-000000000001', NULL, 'Декафы и лоукафы', 'decaf-low-caf', 'coffee', 1, 0, 'decaf-low-caf'),
  ('c0000001-0000-0000-0000-000000000002', NULL, 'Кофе для молочных напитков', 'coffee-milk', 'coffee', 2, 0, 'coffee-milk'),
  ('c0000001-0000-0000-0000-000000000003', NULL, 'Кофе для эспрессо', 'coffee-espresso', 'coffee', 3, 0, 'coffee-espresso'),
  ('c0000001-0000-0000-0000-000000000004', NULL, 'Кофе для фильтра', 'coffee-filter', 'coffee', 4, 0, 'coffee-filter'),
  ('c0000001-0000-0000-0000-000000000005', NULL, 'Limited Edition', 'limited-edition', 'coffee', 5, 0, 'limited-edition'),
  ('c0000001-0000-0000-0000-000000000006', NULL, 'Капсулы', 'capsules', 'coffee', 6, 0, 'capsules'),
  ('c0000001-0000-0000-0000-000000000007', NULL, 'Дрип-кофе', 'drip-coffee', 'coffee', 7, 0, 'drip-coffee'),
  ('c0000001-0000-0000-0000-000000000008', NULL, 'Напитки в банках', 'canned-drinks', 'coffee', 8, 0, 'canned-drinks'),
  ('c0000001-0000-0000-0000-000000000009', NULL, 'Кофейный концентрат', 'coffee-concentrate', 'coffee', 9, 0, 'coffee-concentrate'),
  ('c0000001-0000-0000-0000-000000000010', NULL, 'Растворимый спешелти', 'instant-specialty', 'coffee', 10, 0, 'instant-specialty');

-- КОФЕ: subcategories
INSERT INTO categories (id, parent_id, name, slug, product_type, sort_order, depth, path) VALUES
  -- Кофе для молочных напитков
  ('c0000002-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 'Смеси для молочных напитков', 'milk-blends', 'coffee', 1, 1, 'coffee-milk/milk-blends'),

  -- Кофе для эспрессо
  ('c0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', 'Смеси для эспрессо', 'espresso-blends', 'coffee', 1, 1, 'coffee-espresso/espresso-blends'),
  ('c0000002-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 'Моносорта для эспрессо', 'espresso-single-origin', 'coffee', 2, 1, 'coffee-espresso/espresso-single-origin'),
  ('c0000002-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000003', 'Микролоты для эспрессо', 'espresso-micro-lots', 'coffee', 3, 1, 'coffee-espresso/espresso-micro-lots'),

  -- Кофе для фильтра
  ('c0000002-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000004', 'Смеси для фильтра', 'filter-blends', 'coffee', 1, 1, 'coffee-filter/filter-blends'),
  ('c0000002-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000004', 'Моносорта для фильтра', 'filter-single-origin', 'coffee', 2, 1, 'coffee-filter/filter-single-origin'),
  ('c0000002-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000004', 'Микролоты для фильтра', 'filter-micro-lots', 'coffee', 3, 1, 'coffee-filter/filter-micro-lots'),

  -- Капсулы
  ('c0000002-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000006', 'Nespresso 10 шт', 'nespresso-10', 'coffee', 1, 1, 'capsules/nespresso-10'),
  ('c0000002-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000006', 'Nespresso 40 шт', 'nespresso-40', 'coffee', 2, 1, 'capsules/nespresso-40'),
  ('c0000002-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000006', 'Наборы капсул Nespresso', 'nespresso-sets', 'coffee', 3, 1, 'capsules/nespresso-sets'),

  -- Дрип-кофе
  ('c0000002-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000007', 'Микролоты в дрипах 10 шт', 'drip-micro-lots-10', 'coffee', 1, 1, 'drip-coffee/drip-micro-lots-10'),
  ('c0000002-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000007', 'Дрипы 10 шт', 'drip-10', 'coffee', 2, 1, 'drip-coffee/drip-10'),
  ('c0000002-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000007', 'Дрипы 30 шт', 'drip-30', 'coffee', 3, 1, 'drip-coffee/drip-30'),
  ('c0000002-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000007', 'Дрипы 50 шт', 'drip-50', 'coffee', 4, 1, 'drip-coffee/drip-50'),
  ('c0000002-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000007', 'Наборы дрипов', 'drip-sets', 'coffee', 5, 1, 'drip-coffee/drip-sets'),

  -- Напитки в банках
  ('c0000002-0000-0000-0000-000000000016', 'c0000001-0000-0000-0000-000000000008', '4 шт', 'canned-4pack', 'coffee', 1, 1, 'canned-drinks/canned-4pack'),

  -- Кофейный концентрат
  ('c0000002-0000-0000-0000-000000000017', 'c0000001-0000-0000-0000-000000000009', '3 л', 'concentrate-3l', 'coffee', 1, 1, 'coffee-concentrate/concentrate-3l'),

  -- Растворимый спешелти
  ('c0000002-0000-0000-0000-000000000018', 'c0000001-0000-0000-0000-000000000010', '9 шт', 'instant-9pack', 'coffee', 1, 1, 'instant-specialty/instant-9pack');

-- ЧАЙ: root categories
INSERT INTO categories (id, parent_id, name, slug, product_type, sort_order, depth, path) VALUES
  ('c0000003-0000-0000-0000-000000000001', NULL, 'Каскара', 'cascara', 'tea', 1, 0, 'cascara'),
  ('c0000003-0000-0000-0000-000000000002', NULL, 'Спешелти чай', 'specialty-tea', 'tea', 2, 0, 'specialty-tea'),
  ('c0000003-0000-0000-0000-000000000003', NULL, 'Чёрный чай', 'black-tea', 'tea', 3, 0, 'black-tea'),
  ('c0000003-0000-0000-0000-000000000004', NULL, 'Зелёный чай', 'green-tea', 'tea', 4, 0, 'green-tea'),
  ('c0000003-0000-0000-0000-000000000005', NULL, 'Улун', 'oolong', 'tea', 5, 0, 'oolong'),
  ('c0000003-0000-0000-0000-000000000006', NULL, 'Чёрный чай с добавками', 'black-tea-additives', 'tea', 6, 0, 'black-tea-additives'),
  ('c0000003-0000-0000-0000-000000000007', NULL, 'Зелёный чай с добавками', 'green-tea-additives', 'tea', 7, 0, 'green-tea-additives'),
  ('c0000003-0000-0000-0000-000000000008', NULL, 'Фруктовый чай', 'fruit-tea', 'tea', 8, 0, 'fruit-tea'),
  ('c0000003-0000-0000-0000-000000000009', NULL, 'Травяные смеси', 'herbal-mixes', 'tea', 9, 0, 'herbal-mixes'),
  ('c0000003-0000-0000-0000-000000000010', NULL, 'Пуэр', 'puerh', 'tea', 10, 0, 'puerh');

-- АКСЕССУАРЫ: root
INSERT INTO categories (id, parent_id, name, slug, product_type, sort_order, depth, path) VALUES
  ('c0000004-0000-0000-0000-000000000001', NULL, 'Аксессуары', 'accessories', 'accessory', 1, 0, 'accessories');
