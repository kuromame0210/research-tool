# メルカリリサーチツール（セルフホスト版）

## 概要
メルカリからの商品データを収集・管理し、価格計算と出品支援を行うツールです。

## 機能
- ✅ メルカリ商品データの自動収集
- ✅ 商品一覧・検索・フィルタリング
- ✅ キーワードによる自動フィルタリング
- ✅ 利益率に基づく出品価格計算
- ✅ 統計情報ダッシュボード

## セットアップ

### 1. データベースセットアップ
```bash
# PostgreSQL起動
brew install postgresql
brew services start postgresql

# データベース作成
createdb mercari_research
```

### 2. バックエンドセットアップ
```bash
cd backend
npm install
cp .env.example .env
# .env ファイルを編集してデータベース接続情報を設定

# データベースマイグレーション
npm run migrate

# サーバー起動
npm run dev
```

### 3. Chrome拡張機能の修正
`mercari.js` を `mercari-modified.js` で置き換えて、サーバーURLを `http://localhost:3000` に変更

### 4. 管理画面アクセス
http://localhost:3000 で管理画面にアクセス

## 使用方法

### 1. 商品データ収集
1. メルカリの商品ページで「出品ツールに登録」ボタンをクリック
2. データが自動的にバックエンドに送信される
3. 管理画面で収集したデータを確認

### 2. 価格設定
1. 管理画面の「設定」タブを開く
2. 利益率、手数料率、送料を設定
3. 「保存」をクリック

### 3. キーワードフィルタリング
1. 除外したいキーワードを追加
2. 該当商品は自動的にフィルタリング対象となる

### 4. 商品管理
- 「全て」「有効商品」「フィルタ済み」で絞り込み
- 商品名・出品者名で検索
- 仕入れ価格と出品予定価格、利益を確認

## データベーススキーマ
- `mercari_products`: 商品データ
- `keyword_filters`: キーワードフィルター
- `price_settings`: 価格設定

## 技術スタック
- **バックエンド**: Node.js + Express + PostgreSQL
- **フロントエンド**: HTML + Bootstrap + JavaScript
- **拡張機能**: Chrome Extension (Manifest V3)

## セキュリティ注意事項
- ローカル環境での使用を想定
- 本番環境では適切な認証機能を追加すること