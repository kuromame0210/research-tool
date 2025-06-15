-- テストデータ挿入用SQL
-- Supabase SQL Editorで実行してください

-- 1. テスト商品データ挿入
WITH mercari_platform AS (
  SELECT id FROM flea_market_research_platforms WHERE platform_code = 'mercari' LIMIT 1
)
INSERT INTO flea_market_research_products (
  platform_id, 
  url, 
  title, 
  price, 
  listing_price,
  seller_name,
  product_condition,
  amazon_title,
  amazon_category,
  amazon_status,
  created_at
)
SELECT 
  mp.id,
  vals.url,
  vals.title,
  vals.price,
  vals.listing_price,
  vals.seller_name,
  vals.product_condition,
  vals.amazon_title,
  vals.amazon_category,
  vals.amazon_status,
  NOW() - (vals.days_ago || ' days')::interval
FROM mercari_platform mp,
(VALUES 
  ('https://jp.mercari.com/item/test001', 'iPhone 13 Pro 128GB', 80000, 95000, 'テストユーザー1', 'やや傷や汚れあり', 'iPhone 13 Pro 128GB 美品', 'ホーム&キッチン', 'ready', '1'),
  ('https://jp.mercari.com/item/test002', 'MacBook Air M1', 120000, 145000, 'テストユーザー2', '目立った傷や汚れなし', 'MacBook Air M1 高性能', 'パソコン・周辺機器', 'draft', '2'),
  ('https://jp.mercari.com/item/test003', 'AirPods Pro', 25000, 28000, 'テストユーザー3', '新品、未使用', 'AirPods Pro 正規品', '家電・カメラ', 'ready', '0'),
  ('https://jp.mercari.com/item/test004', 'Nintendo Switch', 35000, 42000, 'テストユーザー4', '目立った傷や汚れなし', 'Nintendo Switch 本体', 'おもちゃ', 'active', '3'),
  ('https://jp.mercari.com/item/test005', 'ブランドバッグ', 45000, 55000, 'テストユーザー5', 'やや傷や汚れあり', 'ルイヴィトン バッグ', 'ファッション', 'uploaded', '1')
) AS vals(url, title, price, listing_price, seller_name, product_condition, amazon_title, amazon_category, amazon_status, days_ago)
ON CONFLICT (url) DO NOTHING;

-- 2. 接続確認クエリ
SELECT 
  'テーブル確認' as check_type,
  COUNT(*) as count
FROM flea_market_research_products

UNION ALL

SELECT 
  'プラットフォーム確認' as check_type,
  COUNT(*) as count  
FROM flea_market_research_platforms

UNION ALL

SELECT 
  'Amazon準備完了' as check_type,
  COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'ready';