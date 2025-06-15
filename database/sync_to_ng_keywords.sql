-- keyword_filtersテーブルからng_keywordsテーブルに同期するSQL
-- （既存のng_keywordsテーブルに追加データがある場合に使用）

-- 1. keyword_filtersテーブルからng_keywordsテーブルにデータを挿入
INSERT INTO ng_keywords (keyword, created_at)
SELECT 
    kf.keyword,
    CURRENT_TIMESTAMP as created_at
FROM flea_market_research_keyword_filters kf
WHERE kf.filter_type = 'exclude' 
  AND kf.is_active = true
  AND NOT EXISTS (
    -- 重複を避けるため、既に存在するキーワードは除外
    SELECT 1 FROM ng_keywords ng 
    WHERE ng.keyword = kf.keyword
  );

-- 2. 同期結果を確認
SELECT 
    'After Sync - ng_keywords' as table_name,
    COUNT(*) as count
FROM ng_keywords
UNION ALL
SELECT 
    'After Sync - keyword_filters (exclude)' as table_name,
    COUNT(*) as count
FROM flea_market_research_keyword_filters
WHERE filter_type = 'exclude' AND is_active = true;