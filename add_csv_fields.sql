-- CSV出力関連フィールドを商品テーブルに追加
-- Supabase SQL Editorで実行してください

-- CSV出力フラグを追加
ALTER TABLE flea_market_research_products 
ADD COLUMN IF NOT EXISTS csv_exported BOOLEAN DEFAULT FALSE;

-- CSV出力日時を追加
ALTER TABLE flea_market_research_products 
ADD COLUMN IF NOT EXISTS csv_exported_at TIMESTAMP WITH TIME ZONE;

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_csv_exported 
ON flea_market_research_products(csv_exported);

CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_csv_exported_at 
ON flea_market_research_products(csv_exported_at);

-- 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'flea_market_research_products' 
AND column_name IN ('csv_exported', 'csv_exported_at')
ORDER BY column_name;