# Supabase セットアップガイド

## 🚀 クイックスタート

### 1. Supabaseプロジェクト作成
1. [Supabase](https://supabase.com) でアカウント作成
2. 「New Project」でプロジェクト作成
3. プロジェクト名・パスワード設定
4. リージョン選択（Northeast Asia (Tokyo) 推奨）

### 2. SQLマイグレーション実行
Supabase Dashboard → SQL Editor で以下を順番に実行：

#### ステップ1: 基本テーブル作成
```sql
-- backend/supabase/migrations/001_initial_tables.sql の内容をコピペして実行
```

#### ステップ2: セキュリティポリシー設定
```sql
-- backend/supabase/migrations/002_rls_policies.sql の内容をコピペして実行
```

#### ステップ3: パフォーマンス最適化
```sql
-- backend/supabase/migrations/003_security_configurations.sql の内容をコピペして実行
```

### 3. API情報取得
プロジェクト設定 → API で以下をコピー：
- **Project URL**: `https://your-project.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔒 セキュリティレベル別設定

### レベル1: 基本セキュリティ（個人・小規模利用）⭐ 推奨
```sql
-- デフォルト設定（24時間アクセス可能）
-- Chrome拡張機能とNext.js管理画面が直接アクセス
-- いつでもどこでもリサーチ作業可能
```

### レベル2: 認証必須（チーム利用）
```sql
-- 認証ユーザーのみアクセス許可
-- 002_rls_policies.sql の認証ユーザー用ポリシーのコメントを解除
-- ログイン機能が必要
```

### レベル3: IP制限（企業・高セキュリティ）
```sql
-- 特定IPからのみアクセス許可
-- 002_rls_policies.sql のIP制限ポリシーのコメントを解除
-- オフィスや自宅など指定場所からのみアクセス
```

## 📊 ポリシー詳細

### 🎯 **商品データ (mercari_research_products)**
- **Chrome拡張機能**: 挿入・更新のみ可能
- **管理画面**: 全操作可能
- **匿名ユーザー**: 基本的なアクセス許可

### 🔍 **キーワードフィルター (mercari_research_keyword_filters)**
- **Chrome拡張機能**: 読み取りのみ（フィルタリング用）
- **管理画面**: 全操作可能

### 💰 **価格表 (mercari_research_price_tables/ranges)**
- **Chrome拡張機能**: 読み取りのみ（価格計算用）
- **管理画面**: 全操作可能

## 🛠️ セキュリティ機能

### Row Level Security (RLS)
```sql
-- 全テーブルでRLS有効
ALTER TABLE mercari_research_products ENABLE ROW LEVEL SECURITY;
```

### 監査ログ
```sql
-- 全ての変更を記録
SELECT * FROM audit_log ORDER BY created_at DESC;
```

### データ整合性チェック
```sql
-- システム状況確認
SELECT * FROM check_data_integrity();
```

### 統計情報
```sql
-- システム状況確認
SELECT * FROM system_status;
```

## 🔧 メンテナンス

### データクリーンアップ
```sql
-- 手動実行
SELECT cleanup_old_data();

-- 自動実行設定（pg_cron拡張必要）
SELECT cron.schedule('cleanup', '0 2 * * *', 'SELECT cleanup_old_data();');
```

### パフォーマンス監視
```sql
-- 統計情報更新
SELECT refresh_statistics();

-- スロークエリ確認
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. RLSエラー
```
Error: new row violates row-level security policy
```
**解決策**: ポリシーが正しく設定されているか確認
```sql
SELECT * FROM pg_policies WHERE tablename = 'mercari_research_products';
```

#### 2. 権限エラー
```
Error: permission denied for table
```
**解決策**: ロールの権限確認
```sql
SELECT grantee, privilege_type FROM information_schema.role_table_grants 
WHERE table_name = 'mercari_research_products';
```

#### 3. 接続エラー
```
Error: Failed to connect to Supabase
```
**解決策**: 
- URL・APIキーの確認
- ネットワーク接続確認
- Supabaseサービス状況確認

### デバッグ用SQL

#### テーブル存在確認
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'mercari_research_%';
```

#### ポリシー一覧
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'mercari_research_%';
```

#### インデックス確認
```sql
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename LIKE 'mercari_research_%';
```

## 🔄 マイグレーション履歴

### バージョン1.0.0
- 基本テーブル作成
- デフォルト価格表設定

### バージョン2.0.0
- RLSポリシー追加
- セキュリティ機能強化
- 監査ログ実装

### バージョン3.0.0
- パフォーマンス最適化
- データ整合性チェック
- 自動メンテナンス機能

## 📈 パフォーマンス最適化

### インデックス戦略
- **商品テーブル**: 日時・フィルタ状態・価格での高速検索
- **価格設定**: アクティブテーブルでの効率的な価格計算
- **監査ログ**: 時系列での高速ソート

### クエリ最適化
- セキュア関数での価格計算
- 複合インデックスでの複数条件検索
- パーティション対応（大量データ時）

これでSupabaseの本格的なセットアップが完了です！