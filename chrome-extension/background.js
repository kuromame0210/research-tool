// バックグラウンドスクリプト

// インストール時の初期設定
chrome.runtime.onInstalled.addListener(() => {
    console.log('メルカリリサーチツールがインストールされました');
    
    // デフォルト設定をセット
    chrome.storage.sync.get(['supabaseUrl', 'supabaseKey'], (result) => {
        if (!result.supabaseUrl || !result.supabaseKey) {
            // 設定が未完了の場合、オプションページを開く
            chrome.runtime.openOptionsPage();
        }
    });
});

// メッセージハンドリング
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CONFIG') {
        // 設定を取得してレスポンス
        chrome.storage.sync.get(['supabaseUrl', 'supabaseKey', 'adminPanelUrl'], (result) => {
            sendResponse({
                supabaseUrl: result.supabaseUrl,
                supabaseKey: result.supabaseKey,
                adminPanelUrl: result.adminPanelUrl || 'http://localhost:3002'
            });
        });
        return true; // 非同期レスポンスを示す
    }
    
    if (request.type === 'OPEN_ADMIN') {
        // 管理画面を開く
        chrome.storage.sync.get(['adminPanelUrl'], (result) => {
            const url = result.adminPanelUrl || 'http://localhost:3002';
            chrome.tabs.create({ url: url });
        });
    }
    
    if (request.type === 'TEST_CONNECTION') {
        // Supabase接続テスト（バックグラウンドでは実行できないため、content scriptに転送）
        sendResponse({ success: false, message: 'Background scriptでは接続テストできません' });
    }
});

// コンテキストメニューの追加
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openAdmin',
        title: 'リサーチツール管理画面を開く',
        contexts: ['page'],
        documentUrlPatterns: ['https://jp.mercari.com/*']
    });
    
    chrome.contextMenus.create({
        id: 'openSettings',
        title: 'リサーチツール設定',
        contexts: ['page'],
        documentUrlPatterns: ['https://jp.mercari.com/*']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openAdmin') {
        chrome.storage.sync.get(['adminPanelUrl'], (result) => {
            const url = result.adminPanelUrl || 'http://localhost:3002';
            chrome.tabs.create({ url: url });
        });
    } else if (info.menuItemId === 'openSettings') {
        chrome.runtime.openOptionsPage();
    }
});

// アラームやタイマー機能（将来的な拡張用）
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReport') {
        // 日次レポート機能（将来実装）
        console.log('日次レポート生成');
    }
});

// ストレージ変更の監視
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('設定が変更されました:', changes);
        
        // アクティブなメルカリタブに設定更新を通知
        chrome.tabs.query({ url: 'https://jp.mercari.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'CONFIG_UPDATE',
                    changes: changes
                }).catch(() => {
                    // タブがアクティブでない場合のエラーを無視
                });
            });
        });
    }
});