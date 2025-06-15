-- NG出品者管理テーブル作成
CREATE TABLE IF NOT EXISTS ng_sellers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    code TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ng_sellers_name ON ng_sellers(name);
CREATE INDEX IF NOT EXISTS idx_ng_sellers_code ON ng_sellers(code);

-- サンプルデータ
INSERT INTO ng_sellers (name, code, reason) VALUES 
('サンプル出品者1', '12345', '詐欺報告あり'),
('サンプル出品者2', '67890', '価格操作の疑い')
ON CONFLICT DO NOTHING;

-- 確認用クエリ
SELECT * FROM ng_sellers;