-- テーブル名変更のロールバックSQL
-- 問題が発生した場合に元の名前に戻します

-- =============================================================================
-- 1. 現在の状況確認
-- =============================================================================

-- 現在のテーブル確認
SELECT 
    table_name,
    'CURRENT' as status
FROM information_schema.tables 
WHERE table_name IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY table_name;

-- =============================================================================
-- 2. テーブル名をロールバック
-- =============================================================================

-- NGキーワードテーブルを元の名前に戻す
ALTER TABLE flea_market_research_ng_keywords RENAME TO ng_keywords;

-- NG出品者テーブルを元の名前に戻す
ALTER TABLE flea_market_research_ng_sellers RENAME TO ng_sellers;

-- =============================================================================
-- 3. インデックス名をロールバック
-- =============================================================================

-- 新しいインデックスを削除
DROP INDEX IF EXISTS idx_flea_market_research_ng_keywords_keyword;
DROP INDEX IF EXISTS idx_flea_market_research_ng_sellers_platform_seller;

-- 元のインデックスを再作成
CREATE INDEX idx_ng_keywords_keyword ON ng_keywords(keyword);
CREATE INDEX idx_ng_sellers_platform_seller ON ng_sellers(platform, seller_id);

-- =============================================================================
-- 4. ロールバック後の確認
-- =============================================================================

-- 元の名前に戻ったことを確認
SELECT 
    table_name,
    'ROLLED_BACK' as status
FROM information_schema.tables 
WHERE table_name IN ('ng_keywords', 'ng_sellers')
ORDER BY table_name;

-- データが保持されているか確認
SELECT 'ng_keywords' as table_name, COUNT(*) as count FROM ng_keywords
UNION ALL
SELECT 'ng_sellers' as table_name, COUNT(*) as count FROM ng_sellers;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================

SELECT 
    'ロールバック完了' as status,
    'テーブル名が元に戻されました' as message,
    CURRENT_TIMESTAMP as completed_at;