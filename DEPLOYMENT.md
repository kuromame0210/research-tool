# デプロイガイド

## 概要
メルカリリサーチツールを本番環境にデプロイするための手順です。

## データベースの変更点
- **テーブル接頭語**: `mercari_research_` を全テーブルに追加
- **名前空間**: 他のプロジェクトとの競合を回避

## デプロイ方法

### 🚀 1. Vercelデプロイ（推奨）

#### 準備
1. Supabaseプロジェクト作成・設定
2. GitHubリポジトリ作成・プッシュ

#### Vercelでのセットアップ
```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトルートで実行
cd backend
vercel

# 環境変数設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_KEY
vercel env add NODE_ENV production

# デプロイ
vercel --prod
```

#### 環境変数
```
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### 🐳 2. Dockerデプロイ

#### ローカル実行
```bash
# 環境変数設定
cp backend/.env.example backend/.env
# .envファイルを編集

# Docker Compose起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

#### 本番環境（VPS等）
```bash
# SSL証明書配置（Let's Encrypt推奨）
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# 環境変数設定
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
export FRONTEND_URL="https://yourdomain.com"

# デプロイ
docker-compose -f docker-compose.yml up -d

# 更新時
docker-compose pull
docker-compose up -d --force-recreate
```

### 📊 3. Supabaseセットアップ

#### データベース初期化
1. SupabaseのSQL Editorを開く
2. `backend/supabase/migrations/001_initial_tables.sql` の内容を実行
3. テーブル作成とデフォルトデータ投入を確認

#### RLS（Row Level Security）設定
```sql
-- 開発環境: 全アクセス許可
CREATE POLICY "Enable all operations" ON mercari_research_products FOR ALL USING (TRUE);

-- 本番環境: 認証済みユーザーのみ
CREATE POLICY "Authenticated users only" ON mercari_research_products 
FOR ALL USING (auth.role() = 'authenticated');
```

## デプロイ後の確認

### ✅ 動作確認チェックリスト
- [ ] ヘルスチェック: `https://your-domain.com/health`
- [ ] 管理画面アクセス: `https://your-domain.com`
- [ ] メルカリ商品データ登録テスト
- [ ] 価格表作成・切り替えテスト
- [ ] キーワードフィルター動作確認

### 🔧 トラブルシューティング

#### Vercelエラー
```bash
# ログ確認
vercel logs

# ローカルでVercel環境再現
vercel dev
```

#### Dockerエラー
```bash
# コンテナ状態確認
docker-compose ps

# ログ確認
docker-compose logs mercari-research-backend

# コンテナ内アクセス
docker-compose exec mercari-research-backend sh
```

#### データベース接続エラー
- Supabase URL・キーの確認
- RLSポリシーの設定確認
- ネットワークアクセス制限の確認

## 環境別構成

### 開発環境
```bash
npm run dev          # Nodemon + Supabase
```

### ローカル本番環境
```bash
npm run start        # 本番用サーバー起動
```

### Vercel（本番）
- **サーバー**: `server-production.js`
- **設定**: `vercel.json`
- **環境変数**: Vercelダッシュボードで管理

### Docker（本番）
- **構成**: `docker-compose.yml`
- **Nginx**: リバースプロキシ + SSL
- **永続化**: ログボリューム

## パフォーマンス最適化

### Supabase
- インデックス最適化
- クエリ最適化
- Connection Pooling

### Nginx
- Gzip圧縮有効
- 静的ファイルキャッシュ
- SSL最適化

### Node.js
- プロセスマネージャー（PM2）
- メモリ制限設定
- エラーハンドリング

## セキュリティ

### 基本対策
- ✅ HTTPS必須
- ✅ セキュリティヘッダー設定
- ✅ CORS設定
- ✅ 環境変数での機密情報管理

### Supabase RLS
```sql
-- 認証必須ポリシー
ALTER TABLE mercari_research_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_required" ON mercari_research_products 
FOR ALL USING (auth.role() = 'authenticated');
```

## 監視・ログ

### ヘルスチェック
- エンドポイント: `/health`
- レスポンス: `{"status": "OK", "timestamp": "2024-01-01T00:00:00.000Z"}`

### ログ管理
- アプリケーションログ: Console出力
- アクセスログ: Nginx
- エラー追跡: Supabase Dashboard

## バックアップ

### Supabaseデータ
- 自動バックアップ有効（Supabase Pro以上）
- 手動エクスポート: SQL/CSV

### アプリケーション
- GitHubでソースコード管理
- Vercel: 自動デプロイ履歴
- Docker: イメージバージョン管理