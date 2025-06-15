# シンプルなテーブル名変更手順

## 🎯 目的
`ng_keywords` と `ng_sellers` テーブルを `flea_market_research_` 接頭語付きに変更

## ⚡ クイック実行手順

### 1. バックアップ（推奨）
```sql
-- データ確認
SELECT 'ng_keywords' as table_name, COUNT(*) as count FROM ng_keywords
UNION ALL
SELECT 'ng_sellers' as table_name, COUNT(*) as count FROM ng_sellers;
```

### 2. テーブル名変更実行
```bash
# Supabase SQL Editorで以下のファイルを実行
simple_rename_tables.sql
```

または直接実行:
```sql
ALTER TABLE ng_keywords RENAME TO flea_market_research_ng_keywords;
ALTER TABLE ng_sellers RENAME TO flea_market_research_ng_sellers;
```

### 3. アプリ再デプロイ
- Chrome拡張機能: 更新済み ✅
- 管理画面: 更新済み ✅

### 4. 動作確認
```sql
-- Budweiser確認
SELECT keyword FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';
```

## 🔄 ロールバック（必要時）
```bash
# 問題があった場合
rollback_table_names.sql
```

## ⏱️ 推定作業時間
- 実行: 1分
- 確認: 5分
- 合計: 10分以内

## 🎉 完了後の効果
- Budweiser商品の確実な検出
- 管理画面での正常なNGワードフィルタリング
- テーブル名の統一