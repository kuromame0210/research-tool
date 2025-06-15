# メルカリリサーチツール（Supabase版）

## 概要
Supabaseをバックエンドに使用したメルカリ商品リサーチ・価格計算ツールです。

## 新機能
- ✅ **Supabase連携** - クラウドデータベース対応
- ✅ **価格表管理** - 複数の価格計算設定を作成・管理
- ✅ **価格帯別設定** - 商品価格に応じた利益率設定
- ✅ **アクティブ価格表** - 使用する価格表の切り替え
- ✅ **リアルタイム価格計算** - 設定した価格表に基づく自動計算

## セットアップ

### 1. Supabaseプロジェクト作成
1. [Supabase](https://supabase.com)でアカウント作成
2. 新しいプロジェクトを作成
3. SQL Editorで以下のSQLを実行:
```sql
-- backend/supabase/migrations/001_initial_tables.sql の内容をコピペ
```

### 2. Supabase設定取得
1. プロジェクト設定 → API → URL とanon key をコピー
2. Service Role key もコピー（管理用）

### 3. バックエンドセットアップ
```bash
cd backend
npm install
cp .env.example .env
# .env ファイルを編集してSupabase情報を設定
```

**`.env`ファイル例:**
```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### 4. サーバー起動
```bash
# Supabase版サーバー起動
node server-supabase.js
```

### 5. Chrome拡張機能修正
`mercari.js` を `mercari-modified.js` で置き換え

### 6. 管理画面アクセス
http://localhost:3000/index-supabase.html で管理画面にアクセス

## 価格表機能の使い方

### 1. 価格表作成
1. 管理画面の「価格表管理」タブを開く
2. 「新規作成」ボタンをクリック
3. 価格表名と説明を入力
4. 価格帯設定を追加:
   - **最低価格**: その価格帯の開始価格
   - **最高価格**: その価格帯の終了価格（空欄で上限なし）
   - **利益率**: その価格帯での利益率(%)
   - **送料**: 送料設定
   - **手数料**: プラットフォーム手数料率(%)

### 2. 価格表例
**基本価格表:**
- ¥0-999: 利益率15%
- ¥1,000-2,999: 利益率20%
- ¥3,000-4,999: 利益率25%
- ¥5,000-9,999: 利益率30%
- ¥10,000-: 利益率35%

**高利益価格表:**
- ¥0-999: 利益率25%
- ¥1,000-4,999: 利益率35%
- ¥5,000-: 利益率45%

### 3. 価格表切り替え
1. 使用したい価格表の「操作」→「アクティブ化」
2. アクティブな価格表が商品の出品価格計算に使用される

### 4. 価格計算ロジック
```
出品価格 = (仕入れ価格 + 送料) ÷ (1 - 手数料率 - 利益率)
```

## データベーススキーマ
- `mercari_products`: 商品データ
- `keyword_filters`: キーワードフィルター
- `price_tables`: 価格表マスター
- `price_ranges`: 価格帯設定

## 技術スタック
- **バックエンド**: Node.js + Express + Supabase
- **フロントエンド**: HTML + Bootstrap + JavaScript
- **データベース**: PostgreSQL (Supabase)
- **拡張機能**: Chrome Extension

## メリット
- 🌐 **クラウド対応** - データの永続化・共有
- 📊 **柔軟な価格設定** - 商品カテゴリ別の価格戦略
- 🔄 **リアルタイム同期** - Supabaseのリアルタイム機能
- 📱 **スケーラブル** - Supabaseの自動スケーリング
- 🔐 **セキュア** - Supabaseの認証・認可機能