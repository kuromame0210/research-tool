-- シンプルなテーブル名変更SQL
-- 既存のテーブルを直接リネームします

-- =============================================================================
-- 1. 実行前の確認
-- =============================================================================

-- 現在のテーブル確認
SELECT 
    table_name,
    COUNT(*) OVER() as total_tables
FROM information_schema.tables 
WHERE table_name IN ('ng_keywords', 'ng_sellers')
ORDER BY table_name;

-- データ件数確認
SELECT 'ng_keywords' as table_name, COUNT(*) as count FROM ng_keywords
UNION ALL
SELECT 'ng_sellers' as table_name, COUNT(*) as count FROM ng_sellers;

-- =============================================================================
-- 2. テーブル名の変更
-- =============================================================================

-- NGキーワードテーブルをリネーム
ALTER TABLE ng_keywords RENAME TO flea_market_research_ng_keywords;

-- NG出品者テーブルをリネーム
ALTER TABLE ng_sellers RENAME TO flea_market_research_ng_sellers;

-- =============================================================================
-- 3. インデックス名の変更
-- =============================================================================

-- 古いインデックスを削除
DROP INDEX IF EXISTS idx_ng_keywords_keyword;
DROP INDEX IF EXISTS idx_ng_sellers_platform_seller;

-- 新しい名前でインデックスを再作成
CREATE INDEX idx_flea_market_research_ng_keywords_keyword 
ON flea_market_research_ng_keywords(keyword);

CREATE INDEX idx_flea_market_research_ng_sellers_platform_seller 
ON flea_market_research_ng_sellers(platform, seller_id);

-- =============================================================================
-- 4. 変更後の確認
-- =============================================================================

-- 新しいテーブル名の確認
SELECT 
    table_name,
    'RENAMED' as status
FROM information_schema.tables 
WHERE table_name IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY table_name;

-- データが保持されているか確認
SELECT 'flea_market_research_ng_keywords' as table_name, COUNT(*) as count 
FROM flea_market_research_ng_keywords
UNION ALL
SELECT 'flea_market_research_ng_sellers' as table_name, COUNT(*) as count 
FROM flea_market_research_ng_sellers;

-- Budweiserキーワードの確認
SELECT 'Budweiser確認' as check_type, keyword
FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';

-- インデックスの確認
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY tablename, indexname;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================

SELECT 
    'テーブル名変更完了' as status,
    'ng_keywords → flea_market_research_ng_keywords' as change1,
    'ng_sellers → flea_market_research_ng_sellers' as change2,
    CURRENT_TIMESTAMP as completed_at;