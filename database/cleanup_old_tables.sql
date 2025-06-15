-- 古いNGテーブルのクリーンアップSQL
-- ⚠️ 警告: このSQLは古いテーブルを完全に削除します
-- 実行前に以下を確認してください:
-- 1. 新しいテーブルが正常に動作している
-- 2. アプリケーションが新しいテーブル名で正常に動作している
-- 3. データが正しく移行されている

-- =============================================================================
-- 1. 移行確認
-- =============================================================================

-- データ整合性の最終確認
SELECT 
    'データ確認' as check_type,
    '新テーブル ng_keywords' as table_name,
    COUNT(*) as record_count
FROM flea_market_research_ng_keywords
UNION ALL
SELECT 
    'データ確認' as check_type,
    '新テーブル ng_sellers' as table_name,
    COUNT(*) as record_count
FROM flea_market_research_ng_sellers;

-- Budweiserキーワードの最終確認
SELECT 
    'Budweiser確認' as check_type,
    keyword
FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';

-- =============================================================================
-- 2. アプリケーション接続確認
-- =============================================================================

-- 新しいテーブルへのアクセス権限確認
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY table_name, grantee;

-- =============================================================================
-- 3. 古いテーブルの削除実行
-- =============================================================================

-- ⚠️ 以下のコメントを外す前に、上記の確認をすべて完了してください

-- 古いテーブルのインデックスを削除
-- DROP INDEX IF EXISTS idx_ng_keywords_keyword;
-- DROP INDEX IF EXISTS idx_ng_sellers_platform_seller;

-- 古いテーブルを削除
-- DROP TABLE IF EXISTS ng_keywords;
-- DROP TABLE IF EXISTS ng_sellers;

-- =============================================================================
-- 4. クリーンアップ後の確認
-- =============================================================================

-- 削除確認（古いテーブルが存在しないことを確認）
SELECT 
    table_name,
    'DELETED' as status
FROM information_schema.tables 
WHERE table_name IN ('ng_keywords', 'ng_sellers');

-- 新しいテーブルが正常に存在することを確認
SELECT 
    table_name,
    'ACTIVE' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY table_name;

-- =============================================================================
-- 5. 最終メッセージ
-- =============================================================================

SELECT 
    'クリーンアップ完了' as status,
    '古いNGテーブルが削除され、新しいテーブル名に統一されました' as message,
    CURRENT_TIMESTAMP as completed_at;