-- NGテーブル名を統一するためのマイグレーションSQL
-- 実行前にデータのバックアップを取ってください

-- 1. テーブル名を変更
ALTER TABLE ng_keywords RENAME TO flea_market_research_ng_keywords;
ALTER TABLE ng_sellers RENAME TO flea_market_research_ng_sellers;

-- 2. インデックス名も変更
DROP INDEX IF EXISTS idx_ng_keywords_keyword;
DROP INDEX IF EXISTS idx_ng_sellers_platform_seller;

-- 新しいインデックスを作成
CREATE INDEX IF NOT EXISTS idx_flea_market_research_ng_keywords_keyword 
ON flea_market_research_ng_keywords(keyword);

CREATE INDEX IF NOT EXISTS idx_flea_market_research_ng_sellers_platform_seller 
ON flea_market_research_ng_sellers(platform, seller_id);

-- 3. 変更結果を確認
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name LIKE '%flea_market_research%ng%' 
ORDER BY table_name;

-- 4. データ件数を確認
SELECT 
    'flea_market_research_ng_keywords' as table_name,
    COUNT(*) as count
FROM flea_market_research_ng_keywords
UNION ALL
SELECT 
    'flea_market_research_ng_sellers' as table_name,
    COUNT(*) as count
FROM flea_market_research_ng_sellers;