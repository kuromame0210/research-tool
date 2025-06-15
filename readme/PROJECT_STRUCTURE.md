# 新しいプロジェクト構成

## 🎯 概要
モダンなJamstack構成で、Chrome拡張機能とNext.js管理画面を分離した構成です。

```
research-tool/
├── chrome-extension/          # データ収集用Chrome拡張機能
│   ├── manifest.json         # 拡張機能設定
│   ├── config.js             # Supabase設定
│   ├── utils.js              # 共通関数
│   ├── mercari-collector.js  # メルカリデータ収集
│   ├── styles.css            # スタイル
│   ├── popup.html/js         # ポップアップUI
│   └── options.html/js       # 設定画面
├── admin-panel/              # Next.js管理画面
│   ├── app/                  # App Router
│   ├── components/           # React コンポーネント
│   ├── lib/                  # ユーティリティ
│   └── package.json          # 依存関係
└── backend/supabase/         # データベーススキーマ
    └── migrations/           # SQLマイグレーション
```

## 🚀 技術スタック

### Chrome拡張機能
- **Manifest V3** - 最新のChrome拡張規格
- **Supabase JS SDK** - 直接データベース接続
- **jQuery** - DOM操作（既存コードとの互換性）

### 管理画面
- **Next.js 14** - React フレームワーク
- **Tailwind CSS** - スタイリング
- **TypeScript** - 型安全性
- **Supabase** - バックエンドサービス

### データベース
- **Supabase (PostgreSQL)** - クラウドデータベース
- **Row Level Security** - セキュリティ
- **Real-time subscriptions** - リアルタイム更新

## 📊 データフロー

```
メルカリページ → Chrome拡張機能 → Supabase → Next.js管理画面
    ↓              ↓                ↑         ↓
  商品データ     データ収集        クラウドDB   データ可視化
```

## 🔧 セットアップ手順

### 1. Supabaseプロジェクト作成
```bash
# 1. https://supabase.com でプロジェクト作成
# 2. SQL Editorで以下実行:
# backend/supabase/migrations/001_initial_tables.sql
```

### 2. Chrome拡張機能設定
```bash
cd chrome-extension
# config.js を編集してSupabase情報設定
# Chrome Extensions管理画面で読み込み
```

### 3. Next.js管理画面デプロイ
```bash
cd admin-panel
npm install
# .env.local 作成・編集
npm run build
# Vercelにデプロイ
```

## 🎨 主な機能

### Chrome拡張機能
- ✅ **ワンクリックデータ収集** - メルカリ商品情報を自動抽出
- ✅ **リアルタイム価格計算** - 設定した価格表に基づく利益計算
- ✅ **キーワードフィルタリング** - 不要商品の自動除外
- ✅ **Amazon検索連携** - 商品名でAmazon検索を開く
- ✅ **設定管理** - Supabase接続情報の管理

### Next.js管理画面
- ✅ **ダッシュボード** - 統計情報の可視化
- ✅ **商品一覧** - 収集した商品データの管理
- ✅ **価格表管理** - 価格帯別利益率設定
- ✅ **キーワードフィルター** - 除外キーワードの管理
- ✅ **分析機能** - 収益性分析・トレンド分析

## 🔒 セキュリティ

### Chrome拡張機能
- **Content Security Policy** - XSS攻撃防止
- **Host Permissions** - 必要最小限のアクセス権
- **Secure Storage** - Chrome Storage APIで設定保存

### Next.js管理画面
- **Environment Variables** - 機密情報の環境変数管理
- **CSP Headers** - セキュリティヘッダー設定
- **Supabase RLS** - 行レベルセキュリティ

## 🚀 デプロイ

### Vercel (推奨)
```bash
cd admin-panel
vercel --prod
```

### 環境変数設定
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📈 利点

### 🎯 **関心の分離**
- データ収集: Chrome拡張機能
- データ管理: Next.js管理画面
- データ保存: Supabase

### ⚡ **パフォーマンス**
- サーバーレス: Vercel + Supabase
- CDN配信: 高速な画面表示
- リアルタイム: Supabaseのリアルタイム機能

### 🔧 **開発効率**
- TypeScript: 型安全性
- Hot Reload: 高速な開発サイクル
- Component-based: 再利用可能なUI

### 💰 **コスト効率**
- Supabase: 無料枠あり
- Vercel: Hobbyプラン無料
- サーバー管理不要

## 🔄 データ同期

### リアルタイム更新
```typescript
// 商品データのリアルタイム監視
supabase
  .channel('products')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'mercari_research_products' }, 
    (payload) => {
      // 新商品追加時の処理
    }
  )
  .subscribe()
```

### キャッシュ戦略
- **Chrome拡張**: ローカルストレージ + 設定同期
- **Next.js**: SWR/React Query for データキャッシュ
- **Supabase**: Connection pooling

これで完全に独立した、スケーラブルなアーキテクチャが完成です！