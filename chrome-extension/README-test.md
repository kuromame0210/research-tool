# Chrome拡張機能テストガイド

## 📋 テスト準備

### 1. Chrome拡張機能のインストール

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `/Users/kurosawaryoufutoshi/Downloads/research-tool/chrome-extension` フォルダを選択

### 2. 必要なライブラリの追加

manifest.jsonで参照している `lib/supabase-js.min.js` をダウンロード：

```bash
# chrome-extensionフォルダに移動
cd /Users/kurosawaryoufutoshi/Downloads/research-tool/chrome-extension

# libフォルダ作成
mkdir lib

# Supabase JSライブラリをダウンロード
curl -o lib/supabase-js.min.js https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js
```

### 3. 管理パネルの起動

```bash
cd /Users/kurosawaryoufutoshi/Downloads/research-tool/admin-panel
npm run dev
```

## 🧪 テスト手順

### Step 1: テストページでの基本機能確認

1. ブラウザで `file:///Users/kurosawaryoufutoshi/Downloads/research-tool/chrome-extension/test.html` を開く
2. Supabase設定を入力
3. 各テストボタンをクリックして機能確認

### Step 2: メルカリページでの動作確認

1. https://jp.mercari.com/search?keyword=iPhone にアクセス
2. 検索結果ページにリサーチツールボタンが表示されることを確認
3. 商品詳細ページでデータ収集ボタンの動作を確認

### Step 3: 拡張機能ポップアップの確認

1. Chrome拡張機能アイコンをクリック
2. ポップアップが正常に表示されることを確認
3. 「管理画面を開く」ボタンの動作確認

## ✅ 確認項目チェックリスト

### 基本機能
- [ ] 拡張機能が正常にインストールされる
- [ ] Supabase接続が成功する
- [ ] 設定が正常に保存される

### メルカリページ機能
- [ ] 商品詳細ページにボタンが表示される
- [ ] 検索結果ページにボタンが表示される
- [ ] データ収集ボタンが動作する
- [ ] Amazon検索ボタンが動作する
- [ ] 管理画面ボタンが動作する

### データ処理機能
- [ ] 商品データが正常に抽出される
- [ ] 価格計算が正常に実行される
- [ ] キーワードフィルタリングが動作する
- [ ] Supabaseへのデータ保存が成功する

### ポップアップ機能
- [ ] ポップアップが正常に表示される
- [ ] 設定状況が正確に表示される
- [ ] 管理画面リンクが動作する

## 🐛 トラブルシューティング

### 拡張機能が読み込まれない
- manifest.jsonの構文エラーをチェック
- 必要なファイルがすべて存在するか確認
- console.logでエラーメッセージを確認

### Supabase接続エラー
- URL/Anon Keyが正しいか確認
- CORSポリシーの設定確認
- ネットワーク接続確認

### メルカリページでボタンが表示されない
- コンテンツスクリプトが正常に実行されているか確認
- DOM要素のセレクタが正しいか確認
- メルカリサイトの構造変更の可能性

## 📊 テスト結果記録

テスト日時: ___________

| 機能 | 結果 | 備考 |
|------|------|------|
| 拡張機能インストール | ⬜ Pass / ⬜ Fail | |
| Supabase接続 | ⬜ Pass / ⬜ Fail | |
| データ収集 | ⬜ Pass / ⬜ Fail | |
| 価格計算 | ⬜ Pass / ⬜ Fail | |
| キーワードフィルタ | ⬜ Pass / ⬜ Fail | |
| Amazon検索 | ⬜ Pass / ⬜ Fail | |
| 管理画面連携 | ⬜ Pass / ⬜ Fail | |

## 📝 次のステップ

テスト完了後の改善点:

1. [ ] パフォーマンス最適化
2. [ ] エラーハンドリング強化
3. [ ] ユーザビリティ改善
4. [ ] セキュリティチェック
5. [ ] 本番環境デプロイ準備