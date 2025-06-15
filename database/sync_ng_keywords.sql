-- NGキーワードデータをng_keywordsテーブルからkeyword_filtersテーブルに同期するSQL

-- 1. ng_keywordsテーブルからkeyword_filtersテーブルにデータを挿入
INSERT INTO flea_market_research_keyword_filters (
    platform_id,
    keyword,
    filter_type,
    is_active,
    created_at
)
SELECT 
    (SELECT id FROM flea_market_research_platforms WHERE platform_code = 'mercari' LIMIT 1) as platform_id,
    ng.keyword,
    'exclude' as filter_type,
    true as is_active,
    CURRENT_TIMESTAMP as created_at
FROM ng_keywords ng
WHERE NOT EXISTS (
    -- 重複を避けるため、既に存在するキーワードは除外
    SELECT 1 FROM flea_market_research_keyword_filters kf 
    WHERE kf.keyword = ng.keyword AND kf.filter_type = 'exclude'
);

-- 2. 同期結果を確認
SELECT 
    'ng_keywords' as table_name,
    COUNT(*) as count
FROM ng_keywords
UNION ALL
SELECT 
    'keyword_filters' as table_name,
    COUNT(*) as count
FROM flea_market_research_keyword_filters
WHERE filter_type = 'exclude';

-- 3. Budweiserキーワードの存在確認
SELECT 
    'ng_keywords' as table_name,
    keyword
FROM ng_keywords 
WHERE keyword ILIKE '%budweiser%'
UNION ALL
SELECT 
    'keyword_filters' as table_name,
    keyword
FROM flea_market_research_keyword_filters 
WHERE keyword ILIKE '%budweiser%' AND filter_type = 'exclude';