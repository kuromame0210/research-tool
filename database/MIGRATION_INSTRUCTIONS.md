# データベーステーブル名統一マイグレーション手順書

## 📋 概要
NGキーワードとNG出品者テーブルの命名規則を統一するためのマイグレーション手順です。

### 変更内容
- `ng_keywords` → `flea_market_research_ng_keywords`
- `ng_sellers` → `flea_market_research_ng_sellers`

## ⚠️ 重要な注意事項
1. **本番環境では必ずバックアップを取得してから実行**
2. **メンテナンス時間中に実行することを推奨**
3. **段階的に実行し、各ステップで確認**

## 🚀 実行手順

### ステップ1: 事前準備
```sql
-- 現在のテーブル状況確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('ng_keywords', 'ng_sellers');

-- データ件数確認
SELECT 'ng_keywords' as table_name, COUNT(*) as count FROM ng_keywords
UNION ALL
SELECT 'ng_sellers' as table_name, COUNT(*) as count FROM ng_sellers;
```

### ステップ2: マイグレーション実行
```bash
# Supabase SQL Editorまたはpsqlで実行
psql -h [host] -d [database] -U [user] -f migration_update_table_names.sql
```

または、Supabase Dashboardで `migration_update_table_names.sql` の内容をコピー&ペーストして実行

### ステップ3: アプリケーション更新
1. **Chrome拡張機能を更新** (既に完了)
2. **管理画面を更新** (既に完了)
3. **アプリケーションを再デプロイ**

### ステップ4: 動作確認
```sql
-- 新しいテーブルでBudweiser検索
SELECT keyword FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';

-- データ件数確認
SELECT 'new_ng_keywords' as table_name, COUNT(*) as count 
FROM flea_market_research_ng_keywords
UNION ALL
SELECT 'new_ng_sellers' as table_name, COUNT(*) as count 
FROM flea_market_research_ng_sellers;
```

### ステップ5: アプリケーション動作確認
1. **管理画面**: 商品一覧でBudweiser商品が除外されるかテスト
2. **Chrome拡張機能**: NGワード検出が正常に動作するかテスト
3. **CSV出力**: NGワード商品が除外されるかテスト

### ステップ6: 古いテーブル削除（オプション）
**⚠️ 新しいシステムが完全に安定してから実行**
```bash
# 1週間程度安定動作を確認後に実行
psql -h [host] -d [database] -U [user] -f cleanup_old_tables.sql
```

## 🔍 トラブルシューティング

### 問題: NGワード検出が動作しない
**解決策:**
```sql
-- テーブル存在確認
SELECT COUNT(*) FROM flea_market_research_ng_keywords;

-- Budweiser存在確認
SELECT keyword FROM flea_market_research_ng_keywords 
WHERE keyword ILIKE '%budweiser%';
```

### 問題: 権限エラー
**解決策:**
```sql
-- 権限確認
SELECT table_name, privilege_type, grantee
FROM information_schema.table_privileges 
WHERE table_name LIKE '%ng_keywords%';

-- 権限付与（必要に応じて）
GRANT SELECT, INSERT, UPDATE, DELETE ON flea_market_research_ng_keywords TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON flea_market_research_ng_sellers TO anon;
```

## 📊 実行結果の例

### 成功例
```
マイグレーション完了
データベーステーブル名が統一されました
2025-06-15 15:30:00+00
```

### データ確認例
```
移行前 ng_keywords          1000
移行後 flea_market_research_ng_keywords  1000
移行前 ng_sellers           50
移行後 flea_market_research_ng_sellers   50
```

## 🔄 ロールバック手順

万が一問題が発生した場合:

```sql
-- 新しいテーブルを一時的にリネーム
ALTER TABLE flea_market_research_ng_keywords RENAME TO flea_market_research_ng_keywords_temp;
ALTER TABLE flea_market_research_ng_sellers RENAME TO flea_market_research_ng_sellers_temp;

-- 古いテーブルを復元（バックアップから）
-- この部分は環境により異なります
```

## ✅ チェックリスト

- [ ] データベースのバックアップ取得
- [ ] `migration_update_table_names.sql` 実行
- [ ] 新しいテーブルのデータ確認
- [ ] アプリケーション動作確認
- [ ] Chrome拡張機能動作確認
- [ ] 管理画面動作確認
- [ ] 1週間の安定動作確認
- [ ] 古いテーブル削除（オプション）

## 📞 サポート
問題が発生した場合は、実行ログとエラーメッセージを保存して開発チームに連絡してください。