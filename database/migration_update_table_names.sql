-- データベーステーブル名統一マイグレーションSQL
-- 実行前に必ずデータベースのバックアップを取ってください
-- 実行順序: 1. バックアップ → 2. このSQLを実行 → 3. 検証

-- =============================================================================
-- 1. 既存テーブルの確認とバックアップ準備
-- =============================================================================

-- 現在のテーブル状況を確認
SELECT 
    table_name,
    table_type,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('ng_keywords', 'ng_sellers')
ORDER BY table_name;

-- データ件数の確認
SELECT 
    'ng_keywords' as table_name,
    COUNT(*) as record_count
FROM ng_keywords
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_keywords')
UNION ALL
SELECT 
    'ng_sellers' as table_name,
    COUNT(*) as record_count  
FROM ng_sellers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_sellers');

-- =============================================================================
-- 2. 新しいテーブルの作成（データ移行用）
-- =============================================================================

-- 新しいNGキーワードテーブルを作成
CREATE TABLE IF NOT EXISTS flea_market_research_ng_keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 新しいNG出品者テーブルを作成
CREATE TABLE IF NOT EXISTS flea_market_research_ng_sellers (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    seller_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, seller_id)
);

-- =============================================================================
-- 3. データ移行の実行
-- =============================================================================

-- NGキーワードデータの移行
INSERT INTO flea_market_research_ng_keywords (keyword, created_at)
SELECT 
    keyword,
    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
FROM ng_keywords
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_keywords')
ON CONFLICT (keyword) DO NOTHING;

-- NG出品者データの移行
INSERT INTO flea_market_research_ng_sellers (platform, seller_id, created_at)
SELECT 
    platform,
    seller_id,
    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
FROM ng_sellers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_sellers')
ON CONFLICT (platform, seller_id) DO NOTHING;

-- =============================================================================
-- 4. インデックスの作成
-- =============================================================================

-- 新しいテーブル用のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_flea_market_research_ng_keywords_keyword 
ON flea_market_research_ng_keywords(keyword);

CREATE INDEX IF NOT EXISTS idx_flea_market_research_ng_sellers_platform_seller 
ON flea_market_research_ng_sellers(platform, seller_id);

-- =============================================================================
-- 5. データ移行の検証
-- =============================================================================

-- 移行後のデータ件数確認
SELECT 
    '移行前 ng_keywords' as description,
    COUNT(*) as count
FROM ng_keywords
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_keywords')
UNION ALL
SELECT 
    '移行後 flea_market_research_ng_keywords' as description,
    COUNT(*) as count
FROM flea_market_research_ng_keywords
UNION ALL
SELECT 
    '移行前 ng_sellers' as description,
    COUNT(*) as count
FROM ng_sellers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_sellers')
UNION ALL
SELECT 
    '移行後 flea_market_research_ng_sellers' as description,
    COUNT(*) as count
FROM flea_market_research_ng_sellers;

-- Budweiserキーワードの存在確認
SELECT 
    'Budweiser確認 - 旧テーブル' as description,
    keyword
FROM ng_keywords 
WHERE keyword ILIKE '%budweiser%'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ng_keywords')
UNION ALL
SELECT 
    'Budweiser確認 - 新テーブル' as description,
    keyword
FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';

-- =============================================================================
-- 6. 古いテーブルのリネーム（バックアップとして保持）
-- =============================================================================

-- 古いテーブルをバックアップ用にリネーム
-- ※本番環境では慎重に実行してください

-- DROP文はコメントアウトしています。移行が完全に確認された後に実行してください。
-- ALTER TABLE ng_keywords RENAME TO ng_keywords_backup_old;
-- ALTER TABLE ng_sellers RENAME TO ng_sellers_backup_old;

-- 古いインデックスの削除（もし存在する場合）
-- DROP INDEX IF EXISTS idx_ng_keywords_keyword;
-- DROP INDEX IF EXISTS idx_ng_sellers_platform_seller;

-- =============================================================================
-- 7. 最終確認クエリ
-- =============================================================================

-- 新しいテーブルが正常に作成されているか確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY table_name, ordinal_position;

-- インデックスの確認
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('flea_market_research_ng_keywords', 'flea_market_research_ng_sellers')
ORDER BY tablename, indexname;

-- =============================================================================
-- マイグレーション完了メッセージ
-- =============================================================================

SELECT 
    'マイグレーション完了' as status,
    'データベーステーブル名が統一されました' as message,
    CURRENT_TIMESTAMP as completed_at;