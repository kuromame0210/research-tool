-- ==============================================
-- フリマサイトリサーチツール Supabase セットアップ
-- 一括実行用SQLファイル (メルカリ・ラクマ・ヤフオク等対応)
-- ==============================================

-- 初期化メッセージ
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'フリマサイトリサーチツール セットアップ開始';
    RAISE NOTICE 'Version: 4.0.0';
    RAISE NOTICE 'Support: メルカリ・ラクマ・ヤフオク等';
    RAISE NOTICE '===========================================';
END $$;

-- ==============================================
-- 1. 基本テーブル作成
-- ==============================================

-- 既存テーブルが存在する場合は削除（開発時のみ）
-- DROP TABLE IF EXISTS flea_market_research_price_ranges CASCADE;
-- DROP TABLE IF EXISTS flea_market_research_price_tables CASCADE;
-- DROP TABLE IF EXISTS flea_market_research_keyword_filters CASCADE;
-- DROP TABLE IF EXISTS flea_market_research_products CASCADE;
-- DROP TABLE IF EXISTS flea_market_research_platforms CASCADE;
-- DROP TABLE IF EXISTS flea_market_research_amazon_categories CASCADE;
-- DROP TABLE IF EXISTS audit_log CASCADE;

-- プラットフォーム管理テーブル
CREATE TABLE IF NOT EXISTS flea_market_research_platforms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_code VARCHAR(20) UNIQUE NOT NULL, -- 'mercari', 'rakuma', 'yahoo_auction'
    platform_name VARCHAR(50) NOT NULL, -- 'メルカリ', 'ラクマ', 'ヤフオク'
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    platform_fee_rate DECIMAL(5,2) DEFAULT 10.00, -- プラットフォーム手数料率
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フリマサイト商品テーブル
CREATE TABLE IF NOT EXISTS flea_market_research_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_id UUID REFERENCES flea_market_research_platforms(id) ON DELETE CASCADE,
    url TEXT UNIQUE NOT NULL,
    product_id TEXT, -- サイト固有の商品ID
    title TEXT,
    price INTEGER,
    seller_name TEXT,
    seller_code TEXT,
    product_condition TEXT,
    description TEXT,
    images JSONB,
    checkout_status TEXT,
    listing_price INTEGER, -- 出品予定価格
    is_filtered BOOLEAN DEFAULT FALSE, -- キーワードフィルタリング済み
    platform_specific_data JSONB, -- サイト固有データ格納用
    
    -- Amazon出品用フィールド
    amazon_title TEXT, -- Amazon用商品タイトル（編集可能）
    amazon_description TEXT, -- Amazon用商品説明（編集可能）
    amazon_brand TEXT, -- ブランド名
    amazon_manufacturer TEXT, -- メーカー名
    amazon_model TEXT, -- 型番・モデル名
    amazon_category TEXT, -- Amazonカテゴリ
    amazon_subcategory TEXT, -- Amazonサブカテゴリ
    amazon_condition TEXT, -- Amazon用コンディション ('New', 'Used - Like New', 'Used - Very Good', 'Used - Good', 'Used - Acceptable')
    amazon_condition_note TEXT, -- コンディション詳細
    amazon_keywords TEXT, -- 検索キーワード（カンマ区切り）
    amazon_bullet_point_1 TEXT, -- 商品の特長1
    amazon_bullet_point_2 TEXT, -- 商品の特長2
    amazon_bullet_point_3 TEXT, -- 商品の特長3
    amazon_bullet_point_4 TEXT, -- 商品の特長4
    amazon_bullet_point_5 TEXT, -- 商品の特長5
    amazon_item_weight DECIMAL(8,2), -- 商品重量（kg）
    amazon_package_weight DECIMAL(8,2), -- 梱包重量（kg）
    amazon_dimensions TEXT, -- 商品サイズ（長さx幅x高さ cm）
    amazon_package_dimensions TEXT, -- 梱包サイズ（長さx幅x高さ cm）
    amazon_color TEXT, -- 色
    amazon_size TEXT, -- サイズ
    amazon_material TEXT, -- 素材
    amazon_target_audience TEXT, -- 対象年齢・性別
    amazon_quantity INTEGER DEFAULT 1, -- 出品数量
    amazon_handling_time INTEGER DEFAULT 2, -- 発送までの日数
    amazon_fulfillment_channel TEXT DEFAULT 'MERCHANT', -- 配送方法 ('MERCHANT' or 'AMAZON')
    amazon_main_image_url TEXT, -- メイン画像URL
    amazon_other_image_urls TEXT, -- その他画像URL（カンマ区切り）
    amazon_external_product_id TEXT, -- JAN/EAN/UPCコード
    amazon_external_product_id_type TEXT, -- 'JAN', 'EAN', 'UPC', 'ISBN'
    amazon_variation_theme TEXT, -- バリエーションテーマ（色、サイズなど）
    amazon_parent_child TEXT DEFAULT 'Child', -- 'Parent', 'Child', 'Standalone'
    amazon_relationship_type TEXT, -- バリエーション関係タイプ
    amazon_parent_sku TEXT, -- 親商品SKU
    amazon_feed_product_type TEXT, -- 商品タイプテンプレート
    amazon_recommended_browse_nodes TEXT, -- 推奨ブラウズノード
    amazon_launch_date DATE, -- 販売開始日
    amazon_discontinue_date DATE, -- 販売終了日
    amazon_max_order_quantity INTEGER, -- 最大注文数
    amazon_sale_price INTEGER, -- セール価格
    amazon_sale_start_date DATE, -- セール開始日
    amazon_sale_end_date DATE, -- セール終了日
    amazon_tax_code TEXT, -- 税コード
    amazon_gift_wrap_available BOOLEAN DEFAULT FALSE, -- ギフト包装可能
    amazon_gift_message_available BOOLEAN DEFAULT FALSE, -- ギフトメッセージ可能
    amazon_is_discontinued BOOLEAN DEFAULT FALSE, -- 廃番商品フラグ
    amazon_status TEXT DEFAULT 'draft', -- 'draft', 'ready', 'uploaded', 'active', 'error'
    amazon_error_message TEXT, -- エラーメッセージ
    amazon_sku TEXT, -- Amazon SKU（自動生成または手動設定）
    amazon_listing_id TEXT, -- Amazon商品ID（アップロード後に設定）
    amazon_last_uploaded_at TIMESTAMP WITH TIME ZONE, -- 最終アップロード日時
    amazon_profit_margin DECIMAL(5,2), -- 利益率（%）
    amazon_roi DECIMAL(5,2), -- ROI（%）
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キーワードフィルターテーブル
CREATE TABLE IF NOT EXISTS flea_market_research_keyword_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_id UUID REFERENCES flea_market_research_platforms(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    filter_type VARCHAR(20) NOT NULL DEFAULT 'exclude', -- 'exclude' or 'include'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 価格計算表テーブル
CREATE TABLE IF NOT EXISTS flea_market_research_price_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_id UUID REFERENCES flea_market_research_platforms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 価格表名
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 価格帯設定テーブル
CREATE TABLE IF NOT EXISTS flea_market_research_price_ranges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    price_table_id UUID REFERENCES flea_market_research_price_tables(id) ON DELETE CASCADE,
    min_price INTEGER NOT NULL,
    max_price INTEGER,
    fixed_price INTEGER, -- 固定販売価格（設定時は利益率計算より優先）
    profit_rate DECIMAL(5,2) DEFAULT 0, -- 利益率（例: 20.00 = 20%）
    shipping_cost INTEGER DEFAULT 175,
    platform_fee_rate DECIMAL(5,2) DEFAULT 10.00, -- プラットフォーム手数料率（プラットフォーム別に設定可能）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_price_range CHECK (max_price IS NULL OR min_price <= max_price)
);

-- Amazonカテゴリ管理テーブル
CREATE TABLE IF NOT EXISTS flea_market_research_amazon_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_name VARCHAR(200) NOT NULL, -- カテゴリ名
    browse_node_id VARCHAR(50), -- Amazonブラウズノード ID
    parent_category_id UUID REFERENCES flea_market_research_amazon_categories(id), -- 親カテゴリ
    feed_product_type VARCHAR(100), -- 商品タイプテンプレート
    required_attributes JSONB, -- 必須属性リスト
    recommended_attributes JSONB, -- 推奨属性リスト
    category_path TEXT, -- カテゴリパス（階層表示用）
    commission_rate DECIMAL(5,2), -- 手数料率
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 監査ログテーブル
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    row_id UUID,
    old_data JSONB,
    new_data JSONB,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. インデックス作成
-- ==============================================

-- 商品テーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_price ON flea_market_research_products(price);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_seller ON flea_market_research_products(seller_name);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_created_at ON flea_market_research_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_url_hash ON flea_market_research_products USING hash (url);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_filtered_created ON flea_market_research_products (is_filtered, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_platform ON flea_market_research_products(platform_id);

-- Amazon出品用インデックス
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_amazon_status ON flea_market_research_products(amazon_status);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_amazon_sku ON flea_market_research_products(amazon_sku);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_amazon_category ON flea_market_research_products(amazon_category);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_products_amazon_ready ON flea_market_research_products(amazon_status) WHERE amazon_status = 'ready';

-- 価格帯設定用インデックス
CREATE INDEX IF NOT EXISTS idx_flea_market_research_price_ranges_table ON flea_market_research_price_ranges(price_table_id);
CREATE INDEX IF NOT EXISTS idx_flea_market_research_price_ranges_price ON flea_market_research_price_ranges(min_price, max_price);

-- 監査ログ用インデックス
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log (table_name);

-- ==============================================
-- 3. ビジネスルール制約（最小限）
-- ==============================================

-- プラットフォーム別にアクティブな価格表は1つまで（重要なビジネスルール）
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_price_table_unique 
ON flea_market_research_price_tables (platform_id, is_active) 
WHERE is_active = true;

-- ==============================================
-- 4. RLS有効化
-- ==============================================

-- 全テーブルでRLS有効化
ALTER TABLE flea_market_research_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE flea_market_research_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE flea_market_research_keyword_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE flea_market_research_price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE flea_market_research_price_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE flea_market_research_amazon_categories ENABLE ROW LEVEL SECURITY;

-- 既存ポリシー削除（再実行時のため）
DROP POLICY IF EXISTS "Allow read platforms" ON flea_market_research_platforms;
DROP POLICY IF EXISTS "Allow admin modify platforms" ON flea_market_research_platforms;
DROP POLICY IF EXISTS "Allow chrome extension insert/update" ON flea_market_research_products;
DROP POLICY IF EXISTS "Allow admin panel operations" ON flea_market_research_products;
DROP POLICY IF EXISTS "Allow read keyword filters" ON flea_market_research_keyword_filters;
DROP POLICY IF EXISTS "Allow admin modify keyword filters" ON flea_market_research_keyword_filters;
DROP POLICY IF EXISTS "Allow read price tables" ON flea_market_research_price_tables;
DROP POLICY IF EXISTS "Allow admin modify price tables" ON flea_market_research_price_tables;
DROP POLICY IF EXISTS "Allow read price ranges" ON flea_market_research_price_ranges;
DROP POLICY IF EXISTS "Allow admin modify price ranges" ON flea_market_research_price_ranges;
DROP POLICY IF EXISTS "Allow read amazon categories" ON flea_market_research_amazon_categories;
DROP POLICY IF EXISTS "Allow admin modify amazon categories" ON flea_market_research_amazon_categories;

-- ==============================================
-- 5. RLSポリシー作成
-- ==============================================

-- プラットフォームテーブル: 読み取り専用（Chrome拡張機能用）
CREATE POLICY "Allow read platforms"
ON flea_market_research_platforms
FOR SELECT
USING (true);

-- プラットフォームテーブル: 管理画面からの変更操作
CREATE POLICY "Allow admin modify platforms"
ON flea_market_research_platforms
FOR ALL
USING (true)
WITH CHECK (true);

-- 商品テーブル: 全ユーザーが全操作可能（24時間アクセス）
CREATE POLICY "Allow chrome extension insert/update"
ON flea_market_research_products
FOR ALL
USING (true)
WITH CHECK (true);

-- キーワードフィルター: 読み取りとCRUD操作を分離
CREATE POLICY "Allow read keyword filters"
ON flea_market_research_keyword_filters
FOR SELECT
USING (true);

CREATE POLICY "Allow admin modify keyword filters"
ON flea_market_research_keyword_filters
FOR ALL
USING (true)
WITH CHECK (true);

-- 価格表: 読み取りとCRUD操作を分離
CREATE POLICY "Allow read price tables"
ON flea_market_research_price_tables
FOR SELECT
USING (true);

CREATE POLICY "Allow admin modify price tables"
ON flea_market_research_price_tables
FOR ALL
USING (true)
WITH CHECK (true);

-- 価格帯設定: 読み取りとCRUD操作を分離
CREATE POLICY "Allow read price ranges"
ON flea_market_research_price_ranges
FOR SELECT
USING (true);

CREATE POLICY "Allow admin modify price ranges"
ON flea_market_research_price_ranges
FOR ALL
USING (true)
WITH CHECK (true);

-- Amazonカテゴリ: 読み取りとCRUD操作を分離
CREATE POLICY "Allow read amazon categories"
ON flea_market_research_amazon_categories
FOR SELECT
USING (true);

CREATE POLICY "Allow admin modify amazon categories"
ON flea_market_research_amazon_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- ==============================================
-- 6. 権限設定
-- ==============================================

-- anon（匿名）ロールの権限設定
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON flea_market_research_platforms TO anon;
GRANT SELECT, INSERT, UPDATE ON flea_market_research_products TO anon;
GRANT SELECT ON flea_market_research_keyword_filters TO anon;
GRANT SELECT ON flea_market_research_price_tables TO anon;
GRANT SELECT ON flea_market_research_price_ranges TO anon;
GRANT SELECT ON flea_market_research_amazon_categories TO anon;

-- authenticated（認証済み）ロールの権限設定
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- service_role の権限設定（管理用）
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==============================================
-- 7. セキュア関数作成
-- ==============================================

-- 価格計算用セキュア関数
CREATE OR REPLACE FUNCTION calculate_listing_price_secure(
    product_price integer,
    price_table_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_table_id uuid;
    price_range_record RECORD;
    calculated_price integer;
BEGIN
    -- 入力値検証
    IF product_price IS NULL OR product_price < 0 THEN
        RETURN NULL;
    END IF;
    
    -- アクティブな価格表IDを取得
    IF price_table_id IS NULL THEN
        SELECT id INTO active_table_id
        FROM flea_market_research_price_tables
        WHERE is_active = true
        LIMIT 1;
    ELSE
        active_table_id := price_table_id;
    END IF;
    
    -- 該当する価格帯を検索
    SELECT * INTO price_range_record
    FROM flea_market_research_price_ranges
    WHERE price_table_id = active_table_id
    AND product_price >= min_price
    AND (max_price IS NULL OR product_price <= max_price)
    LIMIT 1;
    
    -- 価格計算
    IF FOUND THEN
        -- 固定価格が設定されている場合は固定価格を返す
        IF price_range_record.fixed_price IS NOT NULL THEN
            calculated_price := price_range_record.fixed_price;
        ELSE
            -- 利益率での計算
            calculated_price := ROUND(
                (product_price + price_range_record.shipping_cost) / 
                (1 - (price_range_record.platform_fee_rate / 100.0) - (price_range_record.profit_rate / 100.0))
            );
        END IF;
    ELSE
        -- デフォルト計算（50%マージン）
        calculated_price := ROUND(product_price * 1.5);
    END IF;
    
    -- 最小価格チェック
    IF calculated_price < product_price THEN
        calculated_price := ROUND(product_price * 1.1); -- 最低10%マージン
    END IF;
    
    RETURN calculated_price;
END;
$$;

-- キーワードフィルタリング用セキュア関数
CREATE OR REPLACE FUNCTION check_keyword_filter_secure(
    product_title text,
    product_description text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    filter_record RECORD;
    search_text text;
BEGIN
    -- 入力値検証
    IF product_title IS NULL THEN
        RETURN false;
    END IF;
    
    -- 検索対象テキストを作成
    search_text := LOWER(COALESCE(product_title, '') || ' ' || COALESCE(product_description, ''));
    
    -- アクティブなフィルターをチェック
    FOR filter_record IN 
        SELECT keyword, filter_type 
        FROM flea_market_research_keyword_filters 
        WHERE is_active = true
    LOOP
        IF filter_record.filter_type = 'exclude' THEN
            IF POSITION(LOWER(filter_record.keyword) IN search_text) > 0 THEN
                RETURN true; -- フィルタリング対象
            END IF;
        END IF;
    END LOOP;
    
    RETURN false; -- フィルタリング対象外
END;
$$;

-- ==============================================
-- 8. トリガー関数作成
-- ==============================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 監査ログ用トリガー関数
CREATE OR REPLACE FUNCTION log_changes()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        row_id,
        old_data,
        new_data,
        user_id,
        created_at
    )
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        COALESCE(auth.jwt()->>'sub', 'anonymous'),
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 9. トリガー作成
-- ==============================================

-- updated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_products_updated_at ON flea_market_research_products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON flea_market_research_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_tables_updated_at ON flea_market_research_price_tables;
CREATE TRIGGER update_price_tables_updated_at
    BEFORE UPDATE ON flea_market_research_price_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 監査ログトリガー
DROP TRIGGER IF EXISTS audit_trigger_products ON flea_market_research_products;
CREATE TRIGGER audit_trigger_products
    AFTER INSERT OR UPDATE OR DELETE ON flea_market_research_products
    FOR EACH ROW EXECUTE FUNCTION log_changes();

DROP TRIGGER IF EXISTS audit_trigger_price_tables ON flea_market_research_price_tables;
CREATE TRIGGER audit_trigger_price_tables
    AFTER INSERT OR UPDATE OR DELETE ON flea_market_research_price_tables
    FOR EACH ROW EXECUTE FUNCTION log_changes();

-- ==============================================
-- 10. メンテナンス関数作成
-- ==============================================

-- データクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 6ヶ月以上古い商品データを削除
    DELETE FROM flea_market_research_products 
    WHERE created_at < (now() - interval '6 months');
    
    -- 1年以上古い監査ログを削除
    DELETE FROM audit_log 
    WHERE created_at < (now() - interval '1 year');
    
    RAISE NOTICE 'Data cleanup completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- データ整合性チェック関数
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
    check_name text,
    status text,
    message text
) AS $$
BEGIN
    -- 重複URLチェック
    RETURN QUERY
    SELECT 
        'duplicate_urls'::text,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::text,
        CONCAT('重複URL数: ', COUNT(*))::text
    FROM (
        SELECT url, COUNT(*) as cnt
        FROM flea_market_research_products
        GROUP BY url
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- 基本的なデータ整合性チェック
    RETURN QUERY
    SELECT 
        'basic_data_check'::text,
        'OK'::text,
        '基本データ構造: 正常'::text;
    
    -- 孤立した価格帯データチェック
    RETURN QUERY
    SELECT 
        'orphaned_price_ranges'::text,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::text,
        CONCAT('孤立価格帯数: ', COUNT(*))::text
    FROM flea_market_research_price_ranges pr
    LEFT JOIN flea_market_research_price_tables pt ON pr.price_table_id = pt.id
    WHERE pt.id IS NULL;
    
    -- プラットフォーム別アクティブ価格表チェック
    RETURN QUERY
    SELECT 
        'active_price_tables'::text,
        CASE 
            WHEN COUNT(*) >= 1 THEN 'OK'
            ELSE 'WARNING'
        END::text,
        CONCAT('アクティブ価格表設定済みプラットフォーム数: ', COUNT(*))::text
    FROM (
        SELECT platform_id 
        FROM flea_market_research_price_tables 
        WHERE is_active = true 
        GROUP BY platform_id
    ) active_platforms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 統計情報更新関数
CREATE OR REPLACE FUNCTION refresh_statistics()
RETURNS void AS $$
BEGIN
    -- テーブル統計情報を更新
    ANALYZE flea_market_research_products;
    ANALYZE flea_market_research_keyword_filters;
    ANALYZE flea_market_research_price_tables;
    ANALYZE flea_market_research_price_ranges;
    ANALYZE flea_market_research_amazon_categories;
    
    RAISE NOTICE 'Statistics refreshed for all tables';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Amazon SKU自動生成関数
CREATE OR REPLACE FUNCTION generate_amazon_sku(
    product_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    platform_code text;
    product_code text;
    sku text;
BEGIN
    -- プラットフォームコードと商品情報を取得
    SELECT 
        plat.platform_code,
        SUBSTRING(prod.product_id FROM 1 FOR 8)
    INTO platform_code, product_code
    FROM flea_market_research_products prod
    JOIN flea_market_research_platforms plat ON prod.platform_id = plat.id
    WHERE prod.id = product_id;
    
    -- SKU生成: プラットフォーム_商品ID_タイムスタンプ
    sku := UPPER(platform_code) || '_' || COALESCE(product_code, 'UNKNOWN') || '_' || 
           TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    RETURN sku;
END;
$$;

-- Amazon CSV出力関数
CREATE OR REPLACE FUNCTION export_amazon_csv(
    status_filter text DEFAULT 'ready'
)
RETURNS TABLE(
    sku text,
    product_name text,
    product_description text,
    listing_price text,
    quantity text,
    product_id text,
    product_id_type text,
    condition_type text,
    condition_note text,
    main_image_url text,
    other_image_url1 text,
    other_image_url2 text,
    other_image_url3 text,
    parent_child text,
    relationship_type text,
    variation_theme text,
    brand_name text,
    manufacturer text,
    model_number text,
    item_weight text,
    color_name text,
    size_name text,
    material_type text,
    target_audience text,
    bullet_point1 text,
    bullet_point2 text,
    bullet_point3 text,
    bullet_point4 text,
    bullet_point5 text,
    search_terms text,
    platinum_keywords text,
    fulfillment_center_id text,
    max_order_quantity text,
    handling_time text,
    category text,
    feed_product_type text,
    recommended_browse_nodes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.amazon_sku, generate_amazon_sku(p.id)) as sku,
        COALESCE(p.amazon_title, p.title) as product_name,
        COALESCE(p.amazon_description, p.description) as product_description,
        p.listing_price::text as listing_price,
        COALESCE(p.amazon_quantity, 1)::text as quantity,
        p.amazon_external_product_id as product_id,
        p.amazon_external_product_id_type as product_id_type,
        COALESCE(p.amazon_condition, 'Used - Good') as condition_type,
        p.amazon_condition_note as condition_note,
        p.amazon_main_image_url as main_image_url,
        -- その他画像URLを分割
        SPLIT_PART(p.amazon_other_image_urls, ',', 1) as other_image_url1,
        SPLIT_PART(p.amazon_other_image_urls, ',', 2) as other_image_url2,
        SPLIT_PART(p.amazon_other_image_urls, ',', 3) as other_image_url3,
        COALESCE(p.amazon_parent_child, 'Child') as parent_child,
        p.amazon_relationship_type as relationship_type,
        p.amazon_variation_theme as variation_theme,
        p.amazon_brand as brand_name,
        p.amazon_manufacturer as manufacturer,
        p.amazon_model as model_number,
        p.amazon_item_weight::text as item_weight,
        p.amazon_color as color_name,
        p.amazon_size as size_name,
        p.amazon_material as material_type,
        p.amazon_target_audience as target_audience,
        p.amazon_bullet_point_1 as bullet_point1,
        p.amazon_bullet_point_2 as bullet_point2,
        p.amazon_bullet_point_3 as bullet_point3,
        p.amazon_bullet_point_4 as bullet_point4,
        p.amazon_bullet_point_5 as bullet_point5,
        p.amazon_keywords as search_terms,
        p.amazon_keywords as platinum_keywords,
        CASE 
            WHEN p.amazon_fulfillment_channel = 'AMAZON' THEN 'AMAZON_NA'
            ELSE null
        END as fulfillment_center_id,
        p.amazon_max_order_quantity::text as max_order_quantity,
        COALESCE(p.amazon_handling_time, 2)::text as handling_time,
        p.amazon_category as category,
        p.amazon_feed_product_type as feed_product_type,
        p.amazon_recommended_browse_nodes as recommended_browse_nodes
    FROM flea_market_research_products p
    WHERE p.amazon_status = status_filter
    AND p.listing_price IS NOT NULL
    ORDER BY p.created_at DESC;
END;
$$;

-- ==============================================
-- 11. システム状況確認ビュー作成
-- ==============================================

-- システム状況ビュー
CREATE OR REPLACE VIEW system_status AS
SELECT 
    'Tables Created' as component,
    COUNT(*)::text as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'flea_market_research_%'

UNION ALL

SELECT 
    'RLS Enabled' as component,
    COUNT(*)::text as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname LIKE 'flea_market_research_%'
AND c.relrowsecurity = true

UNION ALL

SELECT 
    'Policies Created' as component,
    COUNT(*)::text as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'flea_market_research_%'

UNION ALL

SELECT 
    'Indexes Created' as component,
    COUNT(*)::text as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'flea_market_research_%';

-- Amazon出品準備状況ビュー
CREATE OR REPLACE VIEW amazon_listing_status AS
SELECT 
    'Ready for Upload' as status,
    COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'ready'
AND listing_price IS NOT NULL

UNION ALL

SELECT 
    'Draft' as status,
    COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'draft'

UNION ALL

SELECT 
    'Uploaded' as status,
    COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'uploaded'

UNION ALL

SELECT 
    'Active' as status,
    COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'active'

UNION ALL

SELECT 
    'Error' as status,
    COUNT(*) as count
FROM flea_market_research_products 
WHERE amazon_status = 'error';

-- Amazon利益分析ビュー
CREATE OR REPLACE VIEW amazon_profit_analysis AS
SELECT 
    p.id,
    p.title,
    p.price as source_price,
    p.listing_price as amazon_price,
    ROUND((p.listing_price - p.price)::decimal / p.price * 100, 2) as profit_margin_percent,
    (p.listing_price - p.price) as profit_amount,
    p.amazon_status,
    p.amazon_category,
    plat.platform_name as source_platform
FROM flea_market_research_products p
JOIN flea_market_research_platforms plat ON p.platform_id = plat.id
WHERE p.listing_price IS NOT NULL 
AND p.price IS NOT NULL
AND p.price > 0
ORDER BY profit_margin_percent DESC;

-- ==============================================
-- 12. デフォルトデータ挿入
-- ==============================================

-- プラットフォーム情報の挿入
INSERT INTO flea_market_research_platforms (platform_code, platform_name, base_url, is_active, platform_fee_rate) 
VALUES 
    ('mercari', 'メルカリ', 'https://jp.mercari.com', TRUE, 10.00),
    ('rakuma', 'ラクマ', 'https://rakuma.rakuten.co.jp', TRUE, 6.00),
    ('yahoo_auction', 'ヤフオク', 'https://auctions.yahoo.co.jp', TRUE, 8.80),
    ('paypay_flea', 'PayPayフリマ', 'https://paypayfleamarket.yahoo.co.jp', TRUE, 5.00)
ON CONFLICT (platform_code) DO NOTHING;

-- デフォルト価格表作成（メルカリ用）
WITH mercari_platform AS (
    SELECT id FROM flea_market_research_platforms WHERE platform_code = 'mercari' LIMIT 1
)
INSERT INTO flea_market_research_price_tables (platform_id, name, description, is_active) 
SELECT mp.id, 'メルカリ デフォルト価格表', 'メルカリ用基本価格計算設定', TRUE
FROM mercari_platform mp
ON CONFLICT DO NOTHING;

-- デフォルト価格帯設定（メルカリ用）
WITH default_table AS (
    SELECT id FROM flea_market_research_price_tables 
    WHERE name = 'メルカリ デフォルト価格表' LIMIT 1
)
INSERT INTO flea_market_research_price_ranges (price_table_id, min_price, max_price, fixed_price, profit_rate, shipping_cost, platform_fee_rate)
SELECT 
    dt.id,
    ranges.min_price,
    ranges.max_price,
    ranges.fixed_price,
    ranges.profit_rate,
    ranges.shipping_cost,
    ranges.platform_fee_rate
FROM default_table dt,
(VALUES 
    (0, 1000, 3980, 0, 0, 10.00),      -- ～1,000 → 3,980
    (1001, 2000, 4980, 0, 0, 10.00),   -- 1,001～2,000 → 4,980
    (2001, 3000, 6980, 0, 0, 10.00),   -- 2,001～3,000 → 6,980
    (3001, 4000, 8980, 0, 0, 10.00),   -- 3,001～4,000 → 8,980
    (4001, 5000, 9980, 0, 0, 10.00),   -- 4,001～5,000 → 9,980
    (5001, 6000, 12980, 0, 0, 10.00),  -- 5,001～6,000 → 12,980
    (6001, 7000, 14980, 0, 0, 10.00),  -- 6,001～7,000 → 14,980
    (7001, 8000, 16980, 0, 0, 10.00),  -- 7,001～8,000 → 16,980
    (8001, 9000, 18980, 0, 0, 10.00),  -- 8,001～9,000 → 18,980
    (9001, 10000, 19980, 0, 0, 10.00), -- 9,001～10,000 → 19,980
    (10001, 11000, 23980, 0, 0, 10.00),-- 10,001～11,000 → 23,980
    (11001, 12000, 24980, 0, 0, 10.00),-- 11,001～12,000 → 24,980
    (12001, NULL, NULL, 100, 0, 10.00) -- 12,001～ → 元価格の2倍
) AS ranges(min_price, max_price, fixed_price, profit_rate, shipping_cost, platform_fee_rate)
ON CONFLICT DO NOTHING;

-- サンプルキーワードフィルター（全プラットフォーム共通）
WITH mercari_platform AS (
    SELECT id FROM flea_market_research_platforms WHERE platform_code = 'mercari' LIMIT 1
)
INSERT INTO flea_market_research_keyword_filters (platform_id, keyword, filter_type, is_active)
SELECT mp.id, filters.keyword, filters.filter_type, filters.is_active
FROM mercari_platform mp,
(VALUES 
    ('ジャンク', 'exclude', true),
    ('破損', 'exclude', true),
    ('汚れ', 'exclude', true),
    ('訳あり', 'exclude', true),
    ('要修理', 'exclude', true),
    ('難あり', 'exclude', true)
) AS filters(keyword, filter_type, is_active)
ON CONFLICT DO NOTHING;

-- デフォルトAmazonカテゴリ挿入
INSERT INTO flea_market_research_amazon_categories (category_name, browse_node_id, feed_product_type, category_path, commission_rate, is_active)
VALUES 
    ('ホーム&キッチン', '3828971', 'Home', 'ホーム&キッチン', 8.00, TRUE),
    ('家電・カメラ', '3210991', 'CE', '家電・カメラ', 8.00, TRUE),
    ('パソコン・周辺機器', '16295991', 'CE', 'パソコン・周辺機器', 2.00, TRUE),
    ('携帯電話・スマートフォン', '16295991', 'CE', '家電・カメラ > 携帯電話・スマートフォン', 2.00, TRUE),
    ('ファッション', '2016929011', 'Clothing', 'ファッション', 10.00, TRUE),
    ('靴&バッグ', '13331821', 'Shoes', '靴&バッグ', 10.00, TRUE),
    ('ジュエリー', '16295991', 'Jewelry', 'ジュエリー', 20.00, TRUE),
    ('腕時計', '324025011', 'Watch', 'ファッション > 腕時計', 6.00, TRUE),
    ('スポーツ&アウトドア', '14315361', 'Sports', 'スポーツ&アウトドア', 10.00, TRUE),
    ('おもちゃ', '2016300051', 'Toy', 'おもちゃ', 10.00, TRUE),
    ('ゲーム', '16295991', 'VideoGames', 'ゲーム', 5.00, TRUE),
    ('本・雑誌', '465610', 'Book', '本・雑誌', 3.00, TRUE),
    ('CD・レコード', '561972', 'Music', 'CD・レコード', 5.00, TRUE),
    ('DVD・ブルーレイ', '561958', 'Video', 'DVD・ブルーレイ', 5.00, TRUE),
    ('自動車・バイク', '16295991', 'Auto', '自動車・バイク', 12.00, TRUE),
    ('美容・化粧品', '52374051', 'Beauty', '美容・化粧品', 8.00, TRUE),
    ('食品・飲料', '3828671', 'Grocery', '食品・飲料', 8.00, TRUE),
    ('ペット用品', '13331821', 'Pet', 'ペット用品', 12.00, TRUE),
    ('楽器・音響機器', '562032', 'MusicalInstruments', '楽器・音響機器', 6.00, TRUE),
    ('文房具・オフィス用品', '89083051', 'OfficeProducts', '文房具・オフィス用品', 15.00, TRUE)
ON CONFLICT DO NOTHING;

-- ==============================================
-- 13. 完了メッセージと確認
-- ==============================================

-- セットアップ完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'セットアップが正常に完了しました！';
    RAISE NOTICE '';
    RAISE NOTICE '次のコマンドでシステム状況を確認できます:';
    RAISE NOTICE 'SELECT * FROM system_status;';
    RAISE NOTICE '';
    RAISE NOTICE 'データ整合性をチェック:';
    RAISE NOTICE 'SELECT * FROM check_data_integrity();';
    RAISE NOTICE '';
    RAISE NOTICE '統計情報を更新:';
    RAISE NOTICE 'SELECT refresh_statistics();';
    RAISE NOTICE '';
    RAISE NOTICE '古いデータのクリーンアップ:';
    RAISE NOTICE 'SELECT cleanup_old_data();';
    RAISE NOTICE '';
    RAISE NOTICE 'Amazon CSV出力（準備完了商品）:';
    RAISE NOTICE 'SELECT * FROM export_amazon_csv(''ready'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Amazon出品状況確認:';
    RAISE NOTICE 'SELECT * FROM amazon_listing_status;';
    RAISE NOTICE '';
    RAISE NOTICE 'Amazon利益分析:';
    RAISE NOTICE 'SELECT * FROM amazon_profit_analysis LIMIT 10;';
    RAISE NOTICE '===========================================';
END $$;