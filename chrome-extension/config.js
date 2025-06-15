// Chrome拡張機能用の設定
console.log('config.js が読み込まれました');

// Supabase設定（実際の値は Chrome Storage から取得）
const SUPABASE_CONFIG = {
    url: 'https://ogtcktojdarzuigwrnkj.supabase.co', // デフォルト値、実際はChrome Storageから取得
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndGNrdG9qZGFyenVpZ3dybmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjA1NjcsImV4cCI6MjA2Mjc5NjU2N30.1mJQ8ODIdPfrpTEQbxKwGnSyUKK4kg3TvPXfq-J1h08' // デフォルト値、実際はChrome Storageから取得
};

// テーブル名
const TABLE_NAMES = {
    PLATFORMS: 'flea_market_research_platforms',
    PRODUCTS: 'flea_market_research_products',
    KEYWORD_FILTERS: 'flea_market_research_keyword_filters',
    PRICE_TABLES: 'flea_market_research_price_tables',
    PRICE_RANGES: 'flea_market_research_price_ranges'
};

// 管理画面URL（デフォルト値）
const ADMIN_PANEL_URL = 'https://mercari-listing-tool-admin.vercel.app';

// 設定をグローバルに公開
if (typeof window !== 'undefined') {
    window.RESEARCH_TOOL_CONFIG = {
        SUPABASE_CONFIG,
        TABLE_NAMES,
        ADMIN_PANEL_URL
    };
    console.log('RESEARCH_TOOL_CONFIG が初期化されました:', window.RESEARCH_TOOL_CONFIG);
} else {
    // Node.js環境（Service Worker等）の場合
    globalThis.RESEARCH_TOOL_CONFIG = {
        SUPABASE_CONFIG,
        TABLE_NAMES,
        ADMIN_PANEL_URL
    };
}