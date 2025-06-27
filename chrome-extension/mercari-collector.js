// メルカリデータ収集スクリプト
const EXTENSION_VERSION = "3.2.4";
console.log('🚀 メルカリリサーチツール: スクリプトが読み込まれました', window.location.href);
console.log('📋 拡張機能バージョン:', EXTENSION_VERSION);

// データ更新通知UI
let notificationElement = null;
let lastDataCount = 0;
let progressIndicator = null;

// 上部通知を表示
function showDataNotification(message, type = 'info') {
    // 既存の通知があれば削除
    if (notificationElement) {
        notificationElement.remove();
    }
    
    // 新しい通知を作成
    notificationElement = document.createElement('div');
    notificationElement.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        text-align: center;
    `;
    notificationElement.textContent = message;
    
    document.body.appendChild(notificationElement);
    
    // 3秒後に自動削除
    setTimeout(() => {
        if (notificationElement) {
            notificationElement.remove();
            notificationElement = null;
        }
    }, 3000);
}

// モーダル管理システム - 重複防止
const ModalManager = {
    activeModals: new Set(),
    
    // 全てのモーダルをクリア
    clearAll() {
        console.log('🧹 全モーダルクリア開始');
        
        // 既存のインジケーター削除
        const existingIndicators = document.querySelectorAll('#mercari-progress-indicator, .mercari-progress-indicator');
        existingIndicators.forEach(el => {
            console.log('🗑️ 既存インジケーター削除:', el.id || el.className);
            el.remove();
        });
        
        // 既存の通知削除
        const existingNotifications = document.querySelectorAll('[id*="mercari-notification"], .mercari-notification');
        existingNotifications.forEach(el => {
            console.log('🗑️ 既存通知削除:', el.id || el.className);
            el.remove();
        });
        
        // バルク処理モーダル削除
        const existingBulkModals = document.querySelectorAll('[id*="bulk-progress"], .bulk-progress');
        existingBulkModals.forEach(el => {
            console.log('🗑️ 既存バルクモーダル削除:', el.id || el.className);
            el.remove();
        });
        
        this.activeModals.clear();
        console.log('✅ 全モーダルクリア完了');
    },
    
    // モーダル登録
    register(modal, id) {
        this.activeModals.add(id);
        console.log('📝 モーダル登録:', id);
    },
    
    // モーダル削除
    unregister(id) {
        this.activeModals.delete(id);
        console.log('🗑️ モーダル登録解除:', id);
    }
};

// 常時表示される進行状況インジケーターを作成
function createPersistentProgressIndicator() {
    console.log('📊 createPersistentProgressIndicator 開始');
    
    try {
        // 全てのモーダルをクリア（重複防止）
        ModalManager.clearAll();
        
        // 既存のインジケーターがあれば削除
        if (progressIndicator) {
            console.log('🗑️ 既存のインジケーターを削除');
            progressIndicator.remove();
        }
        
        // document.bodyが存在するかチェック
        if (!document.body) {
            console.error('❌ document.bodyが存在しません');
            return null;
        }
        
        // 新しいインジケーターを作成
        progressIndicator = document.createElement('div');
        progressIndicator.id = 'mercari-progress-indicator';
        progressIndicator.className = 'mercari-progress-indicator';
        
        progressIndicator.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 0 0 8px 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            z-index: 10001 !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            min-width: 200px !important;
            text-align: center !important;
            transition: all 0.3s ease !important;
            display: block !important;
            font-family: Arial, sans-serif !important;
        `;
        
        progressIndicator.innerHTML = `
            <div class="indicator-text">取得件数: 0件</div>
            <div class="indicator-subtext" style="font-size: 10px; opacity: 0.8; margin-top: 2px;">待機中</div>
        `;
        
        console.log('➕ インジケーターをbodyに追加');
        document.body.appendChild(progressIndicator);
        
        // モーダル管理システムに登録
        ModalManager.register(progressIndicator, 'progress-indicator');
        
        // DOM追加を確認
        const addedElement = document.getElementById('mercari-progress-indicator');
        if (addedElement) {
            console.log('✅ インジケーターが正常にDOM追加されました');
            console.log('📍 要素の位置情報:', {
                display: addedElement.style.display,
                position: addedElement.style.position,
                top: addedElement.style.top,
                left: addedElement.style.left,
                zIndex: addedElement.style.zIndex,
                visibility: addedElement.style.visibility,
                opacity: addedElement.style.opacity
            });
            
            // 実際のDOM位置を確認
            const rect = addedElement.getBoundingClientRect();
            console.log('📐 実際の位置とサイズ:', {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
            });
            
            // 追加のスタイル強制適用
            addedElement.style.visibility = 'visible';
            addedElement.style.opacity = '1';
            
            console.log('🎯 可視性設定完了');
        } else {
            console.error('❌ インジケーターのDOM追加に失敗');
        }
        
        console.log('✅ createPersistentProgressIndicator 完了');
        return progressIndicator;
        
    } catch (error) {
        console.error('❌ createPersistentProgressIndicator エラー:', error);
        return null;
    }
}

// 進行状況インジケーターを更新
function updateProgressIndicator(processed, failed, total, status = '処理中') {
    try {
        if (!progressIndicator) {
            createPersistentProgressIndicator();
        }
        
        if (!progressIndicator) {
            console.error('❌ progressIndicatorの作成に失敗');
            return;
        }
        
        const textElement = progressIndicator.querySelector('.indicator-text');
        const subtextElement = progressIndicator.querySelector('.indicator-subtext');
        
        if (textElement && subtextElement) {
            const newText = `取得済み: ${processed}件${failed > 0 ? ` (失敗: ${failed}件)` : ''}`;
            const newSubtext = total > 0 ? `${status} (${processed}/${total})` : status;
            
            textElement.textContent = newText;
            subtextElement.textContent = newSubtext;
            
            // 表示状態を更新
            progressIndicator.style.display = 'block';
            
            // 状態に応じて色を変更
            if (status.includes('完了')) {
                progressIndicator.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            } else if (failed > 0) {
                progressIndicator.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
            } else {
                progressIndicator.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
            }
        } else {
            console.error('❌ DOM要素が見つかりません');
        }
        
    } catch (error) {
        console.error('❌ updateProgressIndicator エラー:', error);
    }
}

// 進行状況インジケーターを隠す
function hideProgressIndicator() {
    if (progressIndicator) {
        progressIndicator.style.display = 'none';
    }
}

// バージョン情報を表示
function showVersionInfo() {
    // 既存のバージョン表示があれば削除
    const existingVersion = document.querySelector('.extension-version-info');
    if (existingVersion) {
        existingVersion.remove();
    }
    
    // バージョン情報を作成
    const versionDiv = document.createElement('div');
    versionDiv.className = 'extension-version-info';
    versionDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-family: monospace;
        z-index: 10002;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid #333;
    `;
    
    versionDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 2px;">🔧 メルカリリサーチツール</div>
        <div>v${EXTENSION_VERSION}</div>
        <div style="font-size: 9px; color: #ccc; margin-top: 2px;">
            読み込み: ${new Date().toLocaleTimeString()}
        </div>
    `;
    
    document.body.appendChild(versionDiv);
    
    // 10秒後に自動で薄くする
    setTimeout(() => {
        if (versionDiv) {
            versionDiv.style.opacity = '0.3';
            versionDiv.style.transition = 'opacity 0.5s ease';
        }
    }, 10000);
    
    console.log('📋 バージョン情報を表示しました: v' + EXTENSION_VERSION);
}

// 拡張機能の起動状態を確認・表示
function showExtensionStatus() {
    console.log('🔍 拡張機能ステータスチェック開始');
    
    // 必要なライブラリの確認
    const supabaseLoaded = typeof supabase !== 'undefined';
    const configLoaded = typeof SUPABASE_URL !== 'undefined';
    
    console.log('📊 ライブラリ状態:', {
        supabase: supabaseLoaded,
        config: configLoaded,
        url: window.location.href
    });
    
    // ステータス通知を表示
    const status = supabaseLoaded && configLoaded ? '正常' : '設定確認中';
    const statusColor = supabaseLoaded && configLoaded ? 'success' : 'info';
    
    showDataNotification(`拡張機能 v${EXTENSION_VERSION} - ${status}`, statusColor);
    
    return supabaseLoaded && configLoaded;
}

// デバッグ: 進行状況インジケーターのテスト表示
function testProgressIndicator() {
    console.log('🧪 進行状況インジケーターのテスト表示開始');
    
    // 既存のインジケーターを削除
    if (progressIndicator) {
        console.log('🗑️ 既存インジケーター削除');
        progressIndicator.remove();
        progressIndicator = null;
    }
    
    // 新規作成
    const indicator = createPersistentProgressIndicator();
    console.log('🔧 新規インジケーター作成結果:', !!indicator);
    
    if (indicator) {
        // テスト表示
        updateProgressIndicator(3, 1, 10, 'テスト表示');
        
        // 段階的テスト表示
        setTimeout(() => {
            console.log('🧪 段階1: 5件中3件処理');
            updateProgressIndicator(3, 0, 5, '処理中');
        }, 2000);
        
        setTimeout(() => {
            console.log('🧪 段階2: 完了状態');
            updateProgressIndicator(5, 0, 5, '完了');
        }, 4000);
        
        setTimeout(() => {
            console.log('🧪 段階3: 待機状態に戻す');
            updateProgressIndicator(0, 0, 0, '待機中');
        }, 6000);
    } else {
        console.error('❌ テスト用インジケーター作成失敗');
    }
}

// デバッグ用: 商品数を手動確認
function checkItemCount() {
    console.log('🔍 手動商品数チェック開始');
    
    const selectors = [
        '[data-testid="item-cell"]',
        'li[data-testid="item-cell"]',
        'a[data-testid="thumbnail-link"]',
        'a[href^="/item/"]',
        '.ItemCell',
        '[data-testid="search-result-item"]'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`📊 セレクター "${selector}": ${elements.length}件`);
    });
    
    // 最も多く検出されたセレクターを使用
    let maxCount = 0;
    let bestSelector = '';
    
    selectors.forEach(selector => {
        const count = document.querySelectorAll(selector).length;
        if (count > maxCount) {
            maxCount = count;
            bestSelector = selector;
        }
    });
    
    console.log(`🎯 最適セレクター: "${bestSelector}" (${maxCount}件)`);
    
    if (maxCount > 0) {
        updateProgressIndicator(maxCount, 0, 0, `${maxCount}件の商品を検出`);
        lastDataCount = maxCount;
    }
    
    return { count: maxCount, selector: bestSelector };
}

// デバッグ用: 詳細な状況確認
function checkDetailedStatus() {
    console.log('🔍 詳細状況確認:');
    console.log('📊 detailedProgressState:', detailedProgressState);
    console.log('📊 bulkProcessingState:', bulkProcessingState);
    
    const totalItems = document.querySelectorAll('[data-testid="item-cell"]').length;
    const completedButtons = document.querySelectorAll('.research-tool-list[data-completed="true"]').length;
    
    console.log('📋 DOM状況:');
    console.log(`  商品総数: ${totalItems}件`);
    console.log(`  詳細取得済み: ${completedButtons}件`);
    console.log(`  一括取得ボタン有効: ${bulkProcessingState.hasValidProducts}`);
    
    // 進行状況を強制更新
    detailedProgressState.totalItems = totalItems;
    detailedProgressState.detailedInfoReady = completedButtons;
    updateDetailedProgressIndicator();
    
    return {
        totalItems,
        completedButtons,
        bulkButtonEnabled: bulkProcessingState.hasValidProducts,
        detailedProgressState,
        bulkProcessingState
    };
}

// デバッグ用: 一括処理済み商品を確認
function checkBulkProcessedItems() {
    console.log('🔍 一括処理済み商品チェック:');
    
    const processedContainers = document.querySelectorAll('[data-bulk-processed="true"]');
    console.log(`📊 一括処理済み商品数: ${processedContainers.length}件`);
    
    processedContainers.forEach((container, index) => {
        const url = container.getAttribute('data-processed-url');
        const button = container.querySelector('.listing-btn');
        const buttonText = button ? button.textContent : 'ボタンなし';
        
        console.log(`  ${index + 1}. URL: ${url}`);
        console.log(`     ボタン状態: ${buttonText}`);
        console.log(`     disabled: ${button ? button.disabled : 'N/A'}`);
    });
    
    return {
        count: processedContainers.length,
        items: Array.from(processedContainers).map(container => ({
            url: container.getAttribute('data-processed-url'),
            buttonText: container.querySelector('.listing-btn')?.textContent,
            disabled: container.querySelector('.listing-btn')?.disabled
        }))
    };
}

// デバッグ用: 一括処理のテスト実行（詳細情報取得版）
async function testBulkProcessing() {
    console.log('🧪 詳細情報取得込み一括処理テスト開始');
    
    try {
        // 商品アイテムを取得
        const items = await getAllProductItems();
        console.log(`📊 検出された商品数: ${items.length}件`);
        
        if (items.length === 0) {
            console.warn('⚠️ 商品が見つかりません');
            return;
        }
        
        // 最初の1件だけテスト
        const testItem = items[0];
        console.log('🎯 テスト対象商品:', testItem);
        
        // 商品URLを取得してテスト
        const linkElement = testItem.querySelector('a[href^="/item/"]') || (testItem.tagName === 'A' ? testItem : null);
        let productUrl = '';
        if (linkElement) {
            productUrl = linkElement.href || linkElement.getAttribute('href');
            if (productUrl && !productUrl.startsWith('http')) {
                productUrl = 'https://jp.mercari.com' + productUrl;
            }
        }
        
        console.log('🔗 テスト用URL:', productUrl);
        
        // 直接fetchDetailedProductInfoをテスト
        if (typeof fetchDetailedProductInfo === 'function') {
            console.log('🔍 fetchDetailedProductInfo直接テスト...');
            const detailedTest = await fetchDetailedProductInfo(productUrl);
            console.log('📋 直接テスト結果:', detailedTest);
        } else {
            console.error('❌ fetchDetailedProductInfo関数が存在しません');
        }
        
        // 単一商品処理をテスト（詳細情報込み）
        console.log('⏰ 詳細情報取得を含むため、処理に時間がかかります...');
        const result = await processSingleItemInBulk(testItem, 0);
        console.log('✅ 詳細情報取得込みテスト結果:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ 詳細情報取得込み一括処理テストエラー:', error);
        return { success: false, error: error.message };
    }
}

// デバッグ用: 基本情報のみで一括処理テスト
async function testBulkProcessingBasic() {
    console.log('🧪 基本情報のみ一括処理テスト開始');
    
    try {
        // 商品アイテムを取得
        const items = await getAllProductItems();
        console.log(`📊 検出された商品数: ${items.length}件`);
        
        if (items.length === 0) {
            console.warn('⚠️ 商品が見つかりません');
            return;
        }
        
        // 最初の1件だけテスト
        const testItem = items[0];
        console.log('🎯 テスト対象商品:', testItem);
        
        // 基本情報のみ抽出
        const productData = extractProductDataFromListItem(testItem);
        
        // 商品URLを取得
        const linkElement = testItem.querySelector('a[href^="/item/"]') || (testItem.tagName === 'A' ? testItem : null);
        if (linkElement) {
            let productUrl = linkElement.href || linkElement.getAttribute('href');
            if (productUrl && !productUrl.startsWith('http')) {
                productUrl = 'https://jp.mercari.com' + productUrl;
            }
            productData.url = productUrl;
        }
        
        console.log('📦 基本商品データ:', productData);
        
        // 基本情報のみで保存
        const result = await saveProductForListingBulk(productData);
        console.log('✅ 基本情報テスト結果:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ 基本情報一括処理テストエラー:', error);
        return { success: false, error: error.message };
    }
}

// 手動NGチェック機能（必要に応じて実行）
function manualNGCheck() {
    console.log('🔍 手動NGチェック実行');
    checkItemsInList();
}

// 販売中商品のみ表示するフィルターを自動適用（価格フィルタ含む）
async function autoApplySaleStatusFilter() {
    console.log('🔍 販売状況・商品状態・価格フィルター自動適用開始');
    
    try {
        // URLパラメータを確認（既にフィルターが適用されているかチェック）
        const url = new URL(window.location.href);
        const statusParam = url.searchParams.get('status');
        const conditionParam = url.searchParams.get('item_condition_id');
        const priceMinParam = url.searchParams.get('price_min');
        
        const targetPriceMin = '10000'; // 1万円以上
        
        if (statusParam === 'on_sale' && conditionParam === '1' && priceMinParam === targetPriceMin) {
            console.log('✅ 既に販売中・新品・価格フィルターが適用済み');
            return;
        }
        
        console.log('⚠️ フィルター未適用のため自動設定開始');
        
        // URLパラメータで直接適用
        if (statusParam !== 'on_sale') {
            url.searchParams.set('status', 'on_sale');
            console.log('📝 販売中フィルターをURLに追加');
        }
        
        if (conditionParam !== '1') {
            url.searchParams.set('item_condition_id', '1'); // 新品のcondition ID
            console.log('📝 新品フィルターをURLに追加');
        }
        
        if (priceMinParam !== targetPriceMin) {
            url.searchParams.set('price_min', targetPriceMin); // 最低価格1万円
            console.log('📝 価格フィルター（1万円以上）をURLに追加');
        }
        
        // ページを再読み込み（フィルター適用）
        if (window.location.href !== url.toString()) {
            console.log('🔄 販売中・新品・価格フィルター適用のためページを更新:', url.toString());
            window.location.href = url.toString();
            return;
        }
        
    } catch (error) {
        console.error('❌ フィルター適用エラー:', error);
    }
}

// グローバル関数として追加（デバッグ用）
window.testProgressIndicator = testProgressIndicator;
window.checkItemCount = checkItemCount;
window.checkDetailedStatus = checkDetailedStatus;
window.checkBulkProcessedItems = checkBulkProcessedItems;
window.testBulkProcessing = testBulkProcessing;
window.testBulkProcessingBasic = testBulkProcessingBasic;
window.manualNGCheck = manualNGCheck;
window.autoApplySaleStatusFilter = autoApplySaleStatusFilter;

// 詳細な進行状況を管理する変数
let detailedProgressState = {
    totalItems: 0,
    basicInfoReady: 0,
    detailedInfoReady: 0,
    failed: 0,
    bulkButtonEnabled: false
};

// 5秒間隔でデータ更新をチェック
function startDataUpdateMonitoring() {
    console.log('👀 データ更新監視開始');
    
    // 初回カウント
    try {
        const initialCount = document.querySelectorAll('[data-testid="item-cell"]').length;
        console.log('📊 初回商品件数:', initialCount);
        lastDataCount = initialCount;
        detailedProgressState.totalItems = initialCount;
        
        // 一括取得ボタンを自動で有効化（商品が1件以上ある場合）
        if (initialCount > 0) {
            bulkProcessingState.hasValidProducts = true;
            setTimeout(() => enableBulkProcessingButton(), 2000); // 2秒後に自動有効化
            detailedProgressState.bulkButtonEnabled = true;
        }
        
        // 初回表示を更新
        updateDetailedProgressIndicator();
    } catch (error) {
        console.error('❌ 初回カウントエラー:', error);
    }
    
    setInterval(async () => {
        try {
            const currentCount = document.querySelectorAll('[data-testid="item-cell"]').length;
            
            // 商品数が変化した場合
            if (currentCount !== lastDataCount) {
                
                if (currentCount > lastDataCount) {
                    const newItems = currentCount - lastDataCount;
                    showDataNotification(`新しい商品が${newItems}件読み込まれました`, 'success');
                    
                    // 新しい商品があった場合、一括取得ボタンを有効化
                    if (currentCount > 0 && !detailedProgressState.bulkButtonEnabled) {
                        bulkProcessingState.hasValidProducts = true;
                        enableBulkProcessingButton();
                        detailedProgressState.bulkButtonEnabled = true;
                    }
                }
                
                lastDataCount = currentCount;
                detailedProgressState.totalItems = currentCount;
            }
            
            // 詳細情報取得済みの商品数をカウント
            const completedButtons = document.querySelectorAll('.research-tool-list[data-completed="true"]').length;
            detailedProgressState.detailedInfoReady = completedButtons;
            detailedProgressState.basicInfoReady = currentCount; // 表示されている商品は基本情報あり
            
            // 進行状況インジケーターを更新
            updateDetailedProgressIndicator();
            
        } catch (error) {
            console.error('❌ データ更新監視エラー:', error);
        }
    }, 10000); // 10秒間隔に変更（頻度を下げる）
}

// 詳細な進行状況インジケーターを更新
function updateDetailedProgressIndicator() {
    const { totalItems, basicInfoReady, detailedInfoReady, failed, bulkButtonEnabled } = detailedProgressState;
    
    let statusText = '';
    let detailText = '';
    
    if (totalItems === 0) {
        statusText = '商品を検索中...';
        detailText = '待機中';
    } else {
        statusText = `商品: ${totalItems}件`;
        
        if (detailedInfoReady > 0) {
            detailText = `詳細取得: ${detailedInfoReady}/${totalItems}件`;
        } else {
            detailText = bulkButtonEnabled ? '一括取得可能' : '情報取得後に一括取得可能';
        }
        
        if (failed > 0) {
            detailText += ` (失敗: ${failed}件)`;
        }
    }
    
    
    // 既存の進行状況表示を使用
    updateProgressIndicator(totalItems, failed, 0, detailText);
    
    // インジケーターのテキスト部分を詳細情報で更新
    if (progressIndicator) {
        const textElement = progressIndicator.querySelector('.indicator-text');
        if (textElement) {
            textElement.textContent = statusText;
        }
    }
}

// CSV出力機能は削除（管理画面で対応）

// 詳細ページに遷移してから情報を取得する方法
async function navigateAndFetchDetailedInfo(itemUrl) {
    try {
        console.log('📋 詳細ページに遷移して情報取得:', itemUrl);
        
        // セッションストレージに処理フラグを保存
        sessionStorage.setItem('mercari_fetch_details', 'true');
        sessionStorage.setItem('mercari_return_url', window.location.href);
        
        // 詳細ページに遷移
        window.location.href = itemUrl;
        
        // この関数は遷移後には実行されないので、遷移先で処理を継続
        return null;
    } catch (error) {
        console.error('❌ 詳細ページ遷移エラー:', error);
        return null;
    }
}

// 現在のページから商品情報を取得（詳細ページ用）
function fetchDetailedProductInfoFromCurrentPage() {
    try {
        console.log('📋 現在のページから詳細情報を取得中...');
        
        // 出品者情報を抽出（複数のセレクターを試行）
        let sellerName = '';
        let sellerCode = '';
        
        // 出品者名の取得
        const sellerSelectors = [
            '.merUserObject p.merText',
            '.merUserObject p',
            'a[data-location="item_details:seller_info"] .merUserObject p',
            '[data-testid="seller-link"] p',
            '[aria-label*="profile"] p',
            '.merText.primary__5616e150.bold__5616e150'
        ];
        
        for (const selector of sellerSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                sellerName = element.textContent.trim();
                console.log('✅ 出品者名取得:', sellerName, 'セレクター:', selector);
                break;
            }
        }
        
        // 出品者コード（URLから抽出）- 強化版
        const sellerLinkSelectors = [
            'a[data-location="item_details:seller_info"]',
            'a[href*="/user/profile/"]',
            'a[href*="/users/"]',
            'a[location-1="seller_info"]',
            '[data-testid="seller-link"]',
            '.merUserObject a'
        ];
        
        for (const selector of sellerLinkSelectors) {
            const sellerLink = document.querySelector(selector);
            if (sellerLink) {
                const href = sellerLink.getAttribute('href') || sellerLink.href;
                if (href) {
                    // /user/profile/数字 または /users/数字 のパターンに対応
                    const match = href.match(/\/user\/profile\/(\d+)|\/users\/(\d+)/);
                    if (match) {
                        sellerCode = match[1] || match[2];
                        console.log('✅ 出品者コード取得:', sellerCode, 'URL:', href, 'セレクター:', selector);
                        break;
                    }
                }
            }
        }
        
        // sellerCodeが取得できない場合、別の方法を試行
        if (!sellerCode) {
            // hrefのないリンクやdata属性から取得を試行
            const alternativeSelectors = [
                'section:contains("出品者") a',
                '.sc-59292da9-1',
                '.cYMVUe'
            ];
            
            for (const selector of alternativeSelectors) {
                const elements = document.querySelectorAll('a');
                for (const element of elements) {
                    const href = element.getAttribute('href') || element.href;
                    if (href && href.includes('/user/profile/')) {
                        const match = href.match(/\/user\/profile\/(\d+)/);
                        if (match) {
                            sellerCode = match[1];
                            console.log('✅ 代替方法で出品者コード取得:', sellerCode, 'URL:', href);
                            break;
                        }
                    }
                }
                if (sellerCode) break;
            }
        }
        
        // 商品状態を抽出
        let productCondition = '';
        const conditionSelectors = [
            'span[data-testid="商品の状態"]',
            '#item-info span[data-testid="商品の状態"]',
            '[data-testid="商品の状態"]',
            '.item-condition',
            '.condition-value',
            '.product-condition'
        ];
        
        for (const selector of conditionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                productCondition = element.textContent.trim();
                console.log('✅ 商品状態取得:', productCondition, 'セレクター:', selector);
                break;
            }
        }
        
        // 代替方法：テキストで商品の状態を探す
        if (!productCondition) {
            const allSpans = document.querySelectorAll('span, dt, dd');
            for (const span of allSpans) {
                if (span.textContent.includes('商品の状態')) {
                    // 次の要素を確認
                    const nextElement = span.nextElementSibling;
                    if (nextElement && nextElement.textContent.trim()) {
                        productCondition = nextElement.textContent.trim();
                        console.log('✅ 商品状態取得（代替方法）:', productCondition);
                        break;
                    }
                    // 親要素の次の要素を確認
                    const parentNext = span.parentElement?.nextElementSibling;
                    if (parentNext && parentNext.textContent.trim()) {
                        productCondition = parentNext.textContent.trim();
                        console.log('✅ 商品状態取得（代替方法2）:', productCondition);
                        break;
                    }
                }
            }
        }
        
        // 商品説明を取得
        let description = '';
        const descriptionSelectors = [
            'pre[data-testid="description"]',
            '.item-description',
            '.description-content',
            '[data-testid="description"]',
            '.product-description',
            '.item-detail-description',
            'div[class*="description"]'
        ];
        
        for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                description = element.textContent.trim();
                console.log('✅ 商品説明取得:', description.substring(0, 50) + '...');
                break;
            }
        }
        
        // 画像URLを取得
        const images = [];
        const imageSelectors = [
            '.slick-vertical .slick-list .slick-slide img',
            '.item-photo img',
            '.product-images img',
            'img[src*="mercari"]',
            'img[src*="photos"]'
        ];
        
        for (const selector of imageSelectors) {
            const imageElements = document.querySelectorAll(selector);
            imageElements.forEach(img => {
                if (img.src && img.src.includes('mercdn.net') && !images.includes(img.src)) {
                    images.push(img.src);
                }
            });
            if (images.length > 0) {
                console.log('✅ 画像取得:', images.length + '枚', 'セレクター:', selector);
                break;
            }
        }
        
        const result = {
            seller: sellerName,
            sellerCode: sellerCode,
            productCondition: productCondition,
            description: description,
            category: '',
            brand: '',
            images: images
        };
        
        console.log('✅ 現在ページ詳細情報取得完了:', result);
        
        return result;
    } catch (error) {
        console.error('❌ 現在ページ詳細情報取得エラー:', error);
        return {
            seller: '',
            sellerCode: '',
            productCondition: '',
            description: '',
            category: '',
            brand: '',
            images: []
        };
    }
}

// NG出品者チェック
async function checkNGSeller(sellerName, sellerCode) {
    try {
        const supabase = await initSupabase();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません');
            return false;
        }
        
        const { data, error } = await supabase
            .from(window.RESEARCH_TOOL_CONFIG.TABLE_NAMES.NG_SELLERS)
            .select('*')
            .eq('platform', 'メルカリ')
            .eq('seller_id', sellerCode);
        
        if (error) {
            console.error('NG出品者チェックエラー:', error);
            return false;
        }
        
        const isNGSeller = data && data.length > 0;
        if (isNGSeller) {
            console.log('🚫 NG出品者を検出:', sellerName, sellerCode);
        }
        
        return isNGSeller;
    } catch (error) {
        console.error('NG出品者チェックエラー:', error);
        return false;
    }
}

// NGワードチェック
async function checkNGKeywords(productTitle, sellerName) {
    try {
        const supabase = await initSupabase();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません');
            return { isNG: false, matchedKeywords: [] };
        }
        
        const { data, error } = await supabase
            .from(window.RESEARCH_TOOL_CONFIG.TABLE_NAMES.NG_KEYWORDS)
            .select('keyword');
        
        if (error) {
            console.error('NGワード取得エラー:', error);
            return { isNG: false, matchedKeywords: [] };
        }
        
        const matchedKeywords = [];
        const searchText = (productTitle + ' ' + sellerName).toLowerCase();
        
        for (const ngKeyword of data) {
            if (searchText.includes(ngKeyword.keyword.toLowerCase())) {
                matchedKeywords.push(ngKeyword.keyword);
            }
        }
        
        const isNG = matchedKeywords.length > 0;
        if (isNG) {
            console.log('🚫 NGキーワードを検出:', matchedKeywords);
        }
        
        return { isNG, matchedKeywords };
    } catch (error) {
        console.error('NGワードチェックエラー:', error);
        return { isNG: false, matchedKeywords: [] };
    }
}

// 出品ボタンを無効化
function disableListingButton(reason, details = '') {
    try {
        // メルカリの出品ボタンセレクター（複数パターン対応）
        const buttonSelectors = [
            'button[data-testid="purchase-button"]',
            'button[data-testid="buy-button"]',
            'button:contains("購入手続きへ")',
            'button:contains("購入する")',
            '.item-buy-btn button',
            '.purchase-button'
        ];
        
        for (const selector of buttonSelectors) {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                button.disabled = true;
                button.style.cssText = `
                    background-color: #dc3545 !important;
                    color: white !important;
                    cursor: not-allowed !important;
                    opacity: 0.7 !important;
                `;
                button.textContent = `⚠️ ${reason}`;
                button.title = `この商品は出品できません: ${reason}\n${details}`;
            });
        }
        
        // NG商品警告バナーを表示
        showNGAlert(reason, details);
        
    } catch (error) {
        console.error('出品ボタン無効化エラー:', error);
    }
}

// NG商品警告バナーを表示  
function showNGAlert(reason, details) {
    // 既存の警告があれば削除
    const existingAlert = document.getElementById('ng-product-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // 警告バナーを作成
    const alertElement = document.createElement('div');
    alertElement.id = 'ng-product-alert';
    alertElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #dc3545;
        color: white;
        padding: 12px;
        text-align: center;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    alertElement.innerHTML = `
        ⚠️ この商品は出品できません - ${reason}
        <br><small>${details}</small>
    `;
    
    document.body.insertBefore(alertElement, document.body.firstChild);
}

// リアルタイムNGチェック（商品詳細ページ用）
async function performRealtimeNGCheck() {
    try {
        console.log('🔍 リアルタイムNGチェック開始');
        
        // 複数の試行でより確実に要素を取得
        await retryUntilSuccess(async () => {
            // ページ要素の読み込みを待機
            await waitForElement('h1, .item-name, [data-testid="item-name"]', 3000);
            
            // 商品情報を取得
            const detailedInfo = fetchDetailedProductInfoFromCurrentPage();
            
            // 商品タイトルを取得（複数セレクターを試行）
            let productTitle = '';
            const titleSelectors = [
                'h1',
                '.item-name', 
                '[data-testid="item-name"]',
                '.item-name h1',
                '.product-name',
                '.item-box-name',
                '.merText.itemName',
                'h1[data-testid]'
            ];
            
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    productTitle = element.textContent.trim();
                    break;
                }
            }
            
            console.log('📋 取得した商品情報:', {
                title: productTitle,
                seller: detailedInfo.seller,
                sellerCode: detailedInfo.sellerCode
            });
            
            // 最低限の情報が取得できない場合は再試行
            if (!productTitle && !detailedInfo.seller && !detailedInfo.sellerCode) {
                throw new Error('商品情報を取得できませんでした');
            }
            
            // 包括的NGチェック実行
            await performComprehensiveNGCheck(productTitle, detailedInfo);
            
        }, 3, 2000); // 最大3回、2秒間隔で試行
        
    } catch (error) {
        console.error('❌ リアルタイムNGチェックエラー:', error);
        // エラーでも警告として表示
        showDataNotification('NG判定でエラーが発生しました', 'error');
    }
}

// 包括的NGチェック実行
async function performComprehensiveNGCheck(productTitle, detailedInfo) {
    let ngDetected = false;
    const ngReasons = [];
    
    try {
        console.log('🔍 包括的NGチェック実行中...');
        
        // 1. NG出品者チェック（詳細ページでのみ実行）
        if (detailedInfo.sellerCode) {
            console.log('🔍 NG出品者IDチェック中...', detailedInfo.seller, detailedInfo.sellerCode);
            const isNGSeller = await checkNGSeller(detailedInfo.seller, detailedInfo.sellerCode);
            if (isNGSeller) {
                ngDetected = true;
                ngReasons.push(`NG出品者: ${detailedInfo.seller} (${detailedInfo.sellerCode})`);
                console.log('🚫 NG出品者を検出:', detailedInfo.seller);
            }
        } else if (detailedInfo.seller) {
            // 出品者IDが取得できない場合は出品者名でのみチェック（制限的）
            console.log('🔍 出品者名でのNGチェック中...', detailedInfo.seller);
            const nameCheck = await checkNGKeywords('', detailedInfo.seller);
            if (nameCheck.isNG) {
                ngDetected = true;
                ngReasons.push(`NG出品者名: ${detailedInfo.seller} (キーワード: ${nameCheck.matchedKeywords.join(', ')})`);
                console.log('🚫 出品者名でNGを検出:', detailedInfo.seller);
            }
        }
        
        // 2. NGワードチェック
        if (productTitle || detailedInfo.seller) {
            console.log('🔍 NGワードチェック中...', productTitle);
            const keywordCheck = await checkNGKeywords(productTitle, detailedInfo.seller);
            if (keywordCheck.isNG) {
                ngDetected = true;
                ngReasons.push(`NGキーワード: ${keywordCheck.matchedKeywords.join(', ')}`);
                console.log('🚫 NGキーワードを検出:', keywordCheck.matchedKeywords);
            }
        }
        
        // 3. 商品説明文でのNGワードチェック（追加）
        if (detailedInfo.description) {
            console.log('🔍 商品説明文NGワードチェック中...');
            const descriptionCheck = await checkNGKeywords(detailedInfo.description, '');
            if (descriptionCheck.isNG) {
                ngDetected = true;
                ngReasons.push(`説明文NGキーワード: ${descriptionCheck.matchedKeywords.join(', ')}`);
                console.log('🚫 説明文でNGキーワードを検出:', descriptionCheck.matchedKeywords);
            }
        }
        
        // 4. 商品状態チェック（新品以外の場合）
        if (detailedInfo.productCondition && detailedInfo.productCondition !== '新品、未使用') {
            ngDetected = true;
            ngReasons.push(`商品状態: ${detailedInfo.productCondition} (新品以外のためフィルタ対象)`);
            console.log('🚫 新品以外の商品を検出:', detailedInfo.productCondition);
        }
        
        // 5. NG判定結果の処理
        if (ngDetected) {
            const allReasons = ngReasons.join(' | ');
            disableListingButton('NG商品検出', allReasons);
            showDataNotification(`NG商品を検出しました: ${ngReasons[0]}`, 'error');
            
            // ページタイトルも変更して警告
            if (document.title && !document.title.includes('⚠️NG商品')) {
                document.title = '⚠️NG商品 - ' + document.title;
            }
            
        } else {
            console.log('✅ NGチェック完了 - 問題なし');
            showDataNotification('商品チェック完了 - 問題ありません', 'success');
        }
        
    } catch (error) {
        console.error('❌ 包括的NGチェックエラー:', error);
        showDataNotification('NGチェック中にエラーが発生しました', 'error');
    }
}

// リトライ機能付き実行関数
async function retryUntilSuccess(asyncFunction, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await asyncFunction();
            return; // 成功したら終了
        } catch (error) {
            console.log(`🔄 試行 ${i + 1}/${maxRetries} 失敗:`, error.message);
            if (i === maxRetries - 1) {
                throw error; // 最後の試行でも失敗したらエラーを投げる
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 一覧ページでのNGチェック（一括取得機能があるため無効化）
async function performListPageNGCheck() {
    console.log('ℹ️ 定期NGチェックは無効化されています（一括取得機能を使用してください）');
    // 一括取得機能があるため、定期的なチェック機能は無効化
    // 必要に応じて手動で checkItemsInList() を呼び出すことは可能
}

// 一覧ページの商品アイテムをチェック
async function checkItemsInList() {
    try {
        // 商品アイテムを取得（複数のセレクターを試行）
        const itemSelectors = [
            '[data-testid="item-cell"]',
            '.items-box',
            '.item-box',
            '.items-box-content',
            '.item-grid'
        ];
        
        let items = [];
        for (const selector of itemSelectors) {
            items = document.querySelectorAll(selector);
            if (items.length > 0) break;
        }
        
        if (items.length === 0) {
            console.log('商品アイテムが見つかりません');
            return;
        }
        
        console.log(`🔍 ${items.length}件の商品をチェック中...`);
        
        for (const item of items) {
            // 既にチェック済みの場合はスキップ
            if (item.getAttribute('data-ng-checked') === 'true') {
                continue;
            }
            
            await checkSingleItemInList(item);
            item.setAttribute('data-ng-checked', 'true');
        }
        
    } catch (error) {
        console.error('❌ 商品アイテムチェックエラー:', error);
    }
}

// 個別商品アイテムのNGチェック
async function checkSingleItemInList(item) {
    try {
        // 商品タイトルを取得
        const titleSelectors = [
            '.items-box-name',
            '.item-name',
            '[data-testid="item-name"]',
            'h3',
            '.merText',
            '.item-box-name'
        ];
        
        let itemTitle = '';
        for (const selector of titleSelectors) {
            const titleElement = item.querySelector(selector);
            if (titleElement && titleElement.textContent.trim()) {
                itemTitle = titleElement.textContent.trim();
                break;
            }
        }
        
        // 出品者名を取得（取得できる場合のみ）
        const sellerSelectors = [
            '.items-box-user-name',
            '.item-user-name', 
            '.seller-name',
            '[data-testid="seller-name"]'
        ];
        
        let sellerName = '';
        for (const selector of sellerSelectors) {
            const sellerElement = item.querySelector(selector);
            if (sellerElement && sellerElement.textContent.trim()) {
                sellerName = sellerElement.textContent.trim();
                break;
            }
        }
        
        if (!itemTitle) return; // タイトルが取得できない場合はスキップ
        
        console.log('🔍 商品チェック:', { title: itemTitle, seller: sellerName });
        
        // NGワードチェック
        const keywordCheck = await checkNGKeywords(itemTitle, sellerName);
        if (keywordCheck.isNG) {
            markItemAsNG(item, itemTitle, keywordCheck.matchedKeywords);
        }
        
    } catch (error) {
        console.error('❌ 個別商品チェックエラー:', error);
    }
}

// NGアイテムをマーク
function markItemAsNG(item, title, keywords) {
    try {
        console.log('🚫 NG商品を一覧でマーク:', title, keywords);
        
        // NGオーバーレイを追加
        if (!item.querySelector('.ng-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'ng-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(220, 53, 69, 0.8);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-weight: bold;
                font-size: 12px;
                text-align: center;
                padding: 4px;
                z-index: 1000;
            `;
            overlay.innerHTML = `
                <div>⚠️ NG商品</div>
                <div style="font-size: 10px; margin-top: 2px;">
                    ${keywords.slice(0, 2).join(', ')}
                </div>
            `;
            
            // アイテムに相対位置を設定
            item.style.position = 'relative';
            item.appendChild(overlay);
        }
        
        // アイテム全体を暗くする
        item.style.opacity = '0.6';
        item.style.filter = 'grayscale(50%)';
        
        // クリックを無効化
        item.style.pointerEvents = 'none';
        
    } catch (error) {
        console.error('❌ NGマーキングエラー:', error);
    }
}

// ページ読み込み完了を待機
function waitForPageLoad(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// 要素が表示されるまで待機
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}

// 初期化
waitForPageLoad(function() {
    // まずバージョン情報を表示（即座に）
    setTimeout(showVersionInfo, 500);
    
    // 設定とライブラリの読み込みを待機してから初期化
    waitForConfigAndLibraries().then(() => {
        setTimeout(initMercariCollector, 1000);
        
        // ページ遷移を監視（SPAに対応）
        setupNavigationObserver();
    });
});

// ページ遷移監視（SPA対応）
function setupNavigationObserver() {
    let currentUrl = window.location.href;
    
    // URL変更を監視
    const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            console.log('🔄 ページ遷移を検出:', currentUrl);
            
            // 既存のボタンを削除
            const existingButtons = document.querySelectorAll('.research-tool, .research-tool-list, .research-tool-global');
            existingButtons.forEach(button => button.remove());
            
            // 少し待ってから再初期化
            setTimeout(() => {
                initMercariCollector();
            }, 1500);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('🔍 ページ遷移監視を開始しました');
}

// 設定とライブラリの読み込み待機
async function waitForConfigAndLibraries() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5秒間待機（100ms × 50回）
        
        function checkReady() {
            attempts++;
            
            // 設定とSupabaseライブラリが読み込まれているかチェック
            const configReady = typeof window.RESEARCH_TOOL_CONFIG !== 'undefined';
            const supabaseReady = typeof window.supabase !== 'undefined';
            
            console.log(`初期化チェック ${attempts}: config=${configReady}, supabase=${supabaseReady}`);
            
            if (configReady && supabaseReady) {
                console.log('設定とライブラリの読み込み完了');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('設定またはライブラリの読み込みがタイムアウトしました');
                console.warn('config:', typeof window.RESEARCH_TOOL_CONFIG);
                console.warn('supabase:', typeof window.supabase);
                resolve(); // タイムアウトしても続行
            } else {
                setTimeout(checkReady, 100);
            }
        }
        
        checkReady();
    });
}

function initMercariCollector() {
    let url = window.location.href;
    console.log('🔧 initMercariCollector 開始:', url);
    
    // バージョン情報とステータスを表示
    showVersionInfo();
    showExtensionStatus();
    
    // URLパラメータから処理IDをチェック（別タブ処理用）
    const urlParams = new URLSearchParams(window.location.search);
    const processingId = urlParams.get('processing_id');
    
    // セッションストレージから保留中の商品データをチェック（従来の方式）
    const pendingProduct = sessionStorage.getItem('mercari_pending_product');
    const returnUrl = sessionStorage.getItem('mercari_return_url');
    
    if (url.startsWith("https://jp.mercari.com/item/")) {
        console.log('📄 商品詳細ページを検出');
        
        // 別タブでの処理の場合
        if (processingId) {
            console.log('🔄 別タブでの自動処理開始 - Processing ID:', processingId);
            setTimeout(() => {
                processDetailedProductDataInSeparateTab(processingId);
            }, 2000);
            return;
        }
        
        // 保留中の商品データがある場合は自動処理（従来の方式）
        if (pendingProduct) {
            console.log('🔄 保留中の商品データを検出 - 自動処理開始');
            
            // セッションストレージをクリア
            sessionStorage.removeItem('mercari_pending_product');
            sessionStorage.removeItem('mercari_return_url');
            
            // 少し待ってから詳細情報を取得
            setTimeout(() => {
                processDetailedProductData(JSON.parse(pendingProduct), returnUrl);
            }, 2000);
        } else {
            setResearchToolButtonMerucari();
            // 商品詳細ページでのリアルタイムNGチェック
            performRealtimeNGCheck();
        }
    } else if (url.includes("jp.mercari.com/search") || url.includes("jp.mercari.com/category/")) {
        console.log('📋 検索・一覧ページを検出');
        // 検索画面や一覧画面
        setResearchToolButtonMerucariList();
        setupListingPageFeatures();
        // 一覧ページでのNGワードチェックは一括取得機能があるため無効化
        // performListPageNGCheck(); // 無効化済み
        
        // 販売中商品のみ表示するフィルターを自動適用（ページ読み込み完了後）
        setTimeout(() => {
            autoApplySaleStatusFilter();
        }, 2000);
        // 進行状況インジケーターを表示（念のため）
        setTimeout(() => {
            createPersistentProgressIndicator();
        }, 2000);
    } else {
        console.log('🏠 その他のメルカリページ - 管理画面ボタンのみ追加');
        // その他のページでも管理画面ボタンを追加
        addAdminButtonToAnyPage();
    }
}

// 詳細ページで商品データを処理（従来の方式）
async function processDetailedProductData(productData, returnUrl) {
    try {
        console.log('🔄 詳細ページで商品データを処理中:', productData);
        
        // 詳細情報を取得
        const detailedInfo = fetchDetailedProductInfoFromCurrentPage();
        
        // 詳細情報でデータを補完
        productData.seller = detailedInfo.seller || productData.seller;
        productData.sellerCode = detailedInfo.sellerCode || productData.sellerCode;
        productData.productInfo = detailedInfo.productCondition || productData.productInfo;
        productData.description = detailedInfo.description || productData.description;
        productData.category = detailedInfo.category || '';
        productData.brand = detailedInfo.brand || '';
        productData.images = detailedInfo.images.length > 0 ? detailedInfo.images : productData.images;
        
        console.log('📋 詳細情報で補完されたデータ:', productData);
        
        // NG出品者チェック
        if (detailedInfo.seller || detailedInfo.sellerCode) {
            const isNGSeller = await checkNGSeller(detailedInfo.seller, detailedInfo.sellerCode);
            if (isNGSeller) {
                disableListingButton('NG出品者', `出品者: ${detailedInfo.seller}`);
                if (returnUrl) {
                    setTimeout(() => {
                        window.location.href = returnUrl;
                    }, 3000);
                }
                return;
            }
        }
        
        // NGワードチェック
        const keywordCheck = await checkNGKeywords(productData.title || productData.name, detailedInfo.seller);
        if (keywordCheck.isNG) {
            disableListingButton('NGキーワード検出', `検出キーワード: ${keywordCheck.matchedKeywords.join(', ')}`);
            if (returnUrl) {
                setTimeout(() => {
                    window.location.href = returnUrl;
                }, 3000);
            }
            return;
        }
        
        // 商品を保存
        const result = await saveProductForListing(productData, true);
        
        if (result.success) {
            alert('出品準備が完了しました！元のページに戻ります。');
        } else {
            alert('出品準備に失敗しました: ' + result.error);
        }
        
        // 元のページに戻る
        if (returnUrl) {
            setTimeout(() => {
                window.location.href = returnUrl;
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ 詳細ページ処理エラー:', error);
        alert('処理中にエラーが発生しました: ' + error.message);
        if (returnUrl) {
            window.location.href = returnUrl;
        }
    }
}

// 別タブでの詳細ページ処理
async function processDetailedProductDataInSeparateTab(processingId) {
    try {
        console.log('🔄 別タブで詳細情報を処理中 - ID:', processingId);
        
        // 一時データから商品情報を取得
        const tempDataStr = localStorage.getItem('mercari_temp_' + processingId);
        if (!tempDataStr) {
            console.error('一時データが見つかりません:', processingId);
            window.close();
            return;
        }
        
        const tempData = JSON.parse(tempDataStr);
        const productData = tempData.productData;
        
        // 詳細情報を取得
        const detailedInfo = fetchDetailedProductInfoFromCurrentPage();
        
        // 詳細情報でデータを補完
        productData.seller = detailedInfo.seller || productData.seller;
        productData.sellerCode = detailedInfo.sellerCode || productData.sellerCode;
        productData.productInfo = detailedInfo.productCondition || productData.productInfo;
        productData.description = detailedInfo.description || productData.description;
        productData.category = detailedInfo.category || '';
        productData.brand = detailedInfo.brand || '';
        productData.images = detailedInfo.images.length > 0 ? detailedInfo.images : productData.images;
        
        console.log('📋 別タブで取得した詳細情報:', detailedInfo);
        
        // 商品を保存（包括的NGチェック付き）
        const result = await saveProductForListingBulkWithDetails(productData);
        
        // 結果を元のタブに送信
        const resultData = {
            success: result.success,
            error: result.error,
            listingPrice: result.listingPrice,
            filtered: result.isFiltered,
            filterReason: result.filterReason || '',
            seller: detailedInfo.seller,
            productCondition: detailedInfo.productCondition,
            amazonData: result.amazonData,
            detailedInfo: true
        };
        
        localStorage.setItem('mercari_result_' + processingId, JSON.stringify(resultData));
        
        console.log('✅ 別タブでの処理完了:', resultData);
        
        // 3秒後にタブを閉じる
        setTimeout(() => {
            window.close();
        }, 3000);
        
    } catch (error) {
        console.error('❌ 別タブ処理エラー:', error);
        
        // エラー結果を送信
        const errorResult = {
            success: false,
            error: error.message,
            detailedInfo: false
        };
        
        localStorage.setItem('mercari_result_' + processingId, JSON.stringify(errorResult));
        
        // タブを閉じる
        setTimeout(() => {
            window.close();
        }, 2000);
    }
}

// 処理結果をUIに表示
function displayProcessingResult(button, resultData, productData, price) {
    try {
        if (resultData.isNGSeller) {
            button.textContent = 'NG出品者';
            button.style.background = '#dc3545';
            button.style.color = 'white';
            
            // NG出品者の詳細表示
            const ngDiv = document.createElement('div');
            ngDiv.style.marginTop = '8px';
            ngDiv.style.fontSize = '0.7rem';
            ngDiv.style.padding = '8px';
            ngDiv.style.backgroundColor = '#f8d7da';
            ngDiv.style.color = '#721c24';
            ngDiv.style.borderRadius = '4px';
            ngDiv.style.border = '1px solid #dc3545';
            ngDiv.innerHTML = `
                <div style="font-weight: bold;">⚠️ NG出品者</div>
                <div>出品者: ${resultData.seller || '取得失敗'}</div>
                <div>管理画面で確認してください</div>
            `;
            
            button.parentNode.insertBefore(ngDiv, button.nextSibling);
            return;
        }
        
        if (resultData.success) {
            button.textContent = '詳細出品完了';
            button.style.color = 'white';
            button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            button.style.border = '2px solid #28a745';
            button.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.5)';
            
            // 詳細結果表示
            const resultDiv = document.createElement('div');
            resultDiv.style.marginTop = '8px';
            resultDiv.style.fontSize = '0.7rem';
            resultDiv.style.padding = '8px';
            resultDiv.style.borderRadius = '4px';
            resultDiv.style.backgroundColor = '#e8f5e8';
            resultDiv.style.border = '1px solid #28a745';
            
            const profit = resultData.listingPrice - parseInt(price);
            
            if (resultData.isFiltered) {
                resultDiv.innerHTML = `
                    <div style="color: #dc3545; font-weight: bold;">⚠️ フィルター対象商品</div>
                    <div>出品者: ${resultData.seller || '取得失敗'}</div>
                    <div>状態: ${resultData.productCondition || '取得失敗'}</div>
                    <div>Amazon出品価格: ¥${resultData.listingPrice?.toLocaleString()}</div>
                    <div>利益予想: ¥${profit.toLocaleString()}</div>
                    <div style="font-size: 0.6rem; color: #666;">✅ 詳細情報取得済み - 管理画面で確認</div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div style="color: #28a745; font-weight: bold;">✅ 詳細出品完了</div>
                    <div>出品者: ${resultData.seller || '取得失敗'}</div>
                    <div>状態: ${resultData.productCondition || '取得失敗'}</div>
                    <div>Amazon出品価格: ¥${resultData.listingPrice?.toLocaleString()}</div>
                    <div>利益予想: ¥${profit.toLocaleString()}</div>
                    <div>Amazon状態: ${resultData.amazonData?.condition || 'Used'}</div>
                    <div style="font-size: 0.6rem; color: #666;">✅ 詳細情報取得済み - CSV出力可能</div>
                `;
            }
            
            button.parentNode.insertBefore(resultDiv, button.nextSibling);
        } else {
            button.textContent = '処理失敗';
            button.style.color = 'white';
            button.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            button.disabled = false;
            
            // エラー表示
            const errorDiv = document.createElement('div');
            errorDiv.style.marginTop = '8px';
            errorDiv.style.fontSize = '0.7rem';
            errorDiv.style.padding = '8px';
            errorDiv.style.backgroundColor = '#f8d7da';
            errorDiv.style.color = '#721c24';
            errorDiv.style.borderRadius = '4px';
            errorDiv.style.border = '1px solid #dc3545';
            errorDiv.innerHTML = `
                <div style="font-weight: bold;">❌ 処理エラー</div>
                <div>${resultData.error || '不明なエラー'}</div>
            `;
            
            button.parentNode.insertBefore(errorDiv, button.nextSibling);
        }
    } catch (error) {
        console.error('結果表示エラー:', error);
        button.textContent = '表示エラー';
        button.style.background = '#ffc107';
        button.disabled = false;
    }
}

// 一覧画面の機能をセットアップ
function setupListingPageFeatures() {
    // データ更新監視を開始
    startDataUpdateMonitoring();
    
    // 初期データ数を記録
    lastDataCount = document.querySelectorAll('[data-testid="item-cell"]').length;
    
    console.log('一覧画面機能を初期化しました');
}

/**
 * メルカリ商品詳細ページ
 */
async function setResearchToolButtonMerucari() {
    try {
        // 要素が読み込まれるまで待機
        await waitForElement('#item-info');
        
        console.log('商品詳細ページにボタンを追加中...');
        
        // 既に追加済みかチェック
        if (document.querySelector('.research-tool')) {
            console.log('ボタンは既に追加済みです');
            return;
        }

        // リサーチツール用コンテナを作成
        const div = document.createElement('div');
        div.className = 'research-tool';

        // 売り切れチェック
        const checkoutButton = document.querySelector('#main div[data-testid=checkout-button] button');
        const checkoutText = checkoutButton ? checkoutButton.textContent : '';
        
        if (checkoutText !== '売り切れました') {
            // 出品するボタン（詳細情報を取得して出品）
            const btn1 = document.createElement('button');
            btn1.className = 'listing-btn';
            btn1.textContent = '📦 出品する';
            btn1.addEventListener('click', addToListingQueue);
            div.appendChild(btn1);
        }

        // Amazon検索ボタン
        const btn2 = document.createElement('button');
        btn2.className = 'amazon-btn';
        btn2.textContent = '🛒 Amazon検索';
        btn2.style.fontSize = '0.85rem';
        btn2.addEventListener('click', findAmazonForMerucari);
        div.appendChild(btn2);

        // 管理画面ボタン
        const btn3 = document.createElement('button');
        btn3.className = 'admin-btn';
        btn3.textContent = '📊 管理画面';
        btn3.style.fontSize = '0.85rem';
        btn3.addEventListener('click', openAdminPanel);
        div.appendChild(btn3);

        // ボタンを追加
        const itemInfo = document.querySelector('#item-info');
        if (itemInfo) {
            itemInfo.insertBefore(div, itemInfo.firstChild);
            console.log('ボタンを追加しました');
        } else {
            console.log('#item-info要素が見つかりません');
        }
    } catch (error) {
        console.error('ボタン追加エラー:', error);
    }
}

/**
 * メルカリ商品一覧ページ
 */
async function setResearchToolButtonMerucariList() {
    try {
        // 要素が読み込まれるまで待機
        await waitForElement('#main');
        
        console.log('商品一覧ページにボタンを追加中...');
        
        // 既に追加済みかチェック
        if (document.querySelector('.research-tool')) {
            console.log('ボタンは既に追加済みです');
            return;
        }

        // リサーチツール用コンテナを作成
        const div = document.createElement('div');
        div.className = 'research-tool';

        // 管理画面ボタン
        const btn2 = document.createElement('button');
        btn2.className = 'admin-btn';
        btn2.textContent = '📊 管理画面';
        btn2.addEventListener('click', openAdminPanel);
        div.appendChild(btn2);

        // 一括取得ボタン（初期状態で無効化）
        const btn3 = document.createElement('button');
        btn3.className = 'bulk-process-btn';
        btn3.textContent = '🚀 一括取得（情報取得後に有効化）';
        btn3.style.marginLeft = '10px';
        btn3.disabled = true; // 初期状態で無効化
        btn3.style.opacity = '0.5'; // 視覚的に無効化を表示
        btn3.style.cursor = 'not-allowed';
        btn3.addEventListener('click', startBulkProcessing);
        
        // グローバル参照を保存（他の関数から参照できるように）
        bulkProcessingState.button = btn3;
        
        div.appendChild(btn3);

        // ボタンを追加
        const main = document.querySelector('#main');
        if (main) {
            main.insertBefore(div, main.firstChild);
            console.log('一覧ページにボタンを追加しました');
        } else {
            console.log('#main要素が見つかりません');
        }

        // 自動的に商品にボタンを表示
        setTimeout(setResearchToolButtonMerucariListDetail, 1000);
        
        // 進行状況インジケーターを作成
        createPersistentProgressIndicator();
    } catch (error) {
        console.error('一覧ページボタン追加エラー:', error);
    }
}

function setResearchToolButtonMerucariListDetail() {
    console.log('商品一覧の詳細ボタンを表示中...');
    
    // 既存のボタンを削除
    const existingButtons = document.querySelectorAll('.research-tool-list');
    existingButtons.forEach(button => button.remove());

    // 複数のセレクターで商品セルを取得
    let itemCells = document.querySelectorAll('[data-testid="item-cell"]');
    
    // 代替セレクターを試す
    if (itemCells.length === 0) {
        itemCells = document.querySelectorAll('li[data-testid="item-cell"]');
    }
    if (itemCells.length === 0) {
        itemCells = document.querySelectorAll('a[data-testid="thumbnail-link"]');
    }
    if (itemCells.length === 0) {
        itemCells = document.querySelectorAll('a[href^="/item/"]');
    }
    
    console.log('商品セル数:', itemCells.length);
    console.log('使用したセレクター:', itemCells.length > 0 ? '商品セルを発見' : '商品セルが見つかりません');

    if (itemCells.length === 0) {
        console.log('5秒後に再試行します...');
        setTimeout(setResearchToolButtonMerucariListDetail, 5000);
        return;
    }

    itemCells.forEach((element, index) => {
        // 既にボタンが追加されているかチェック
        if (element.querySelector('.research-tool-list')) {
            return;
        }

        // 商品リンクの場合は親要素を使用
        let targetElement = element;
        if (element.tagName === 'A') {
            targetElement = element.closest('li') || element.parentElement;
        }

        // リサーチツール用コンテナを作成
        const div = document.createElement('div');
        div.className = 'research-tool-list';
        div.style.marginTop = '8px';
        div.style.marginBottom = '8px';

        // 出品するボタン（詳細情報を取得して出品）
        const btn1 = document.createElement('button');
        btn1.className = 'listing-btn';
        btn1.textContent = '📦 出品する';
        btn1.addEventListener('click', function(event) {
            addToListingQueueFromListNative(event, targetElement, true);
        });
        div.appendChild(btn1);

        // Amazonボタン
        const btn2 = document.createElement('button');
        btn2.className = 'amazon-btn';
        btn2.textContent = '🛒 Amazon';
        btn2.style.fontSize = '0.85rem';
        btn2.addEventListener('click', function(event) {
            findAmazonForMerucariList(event, targetElement);
        });
        div.appendChild(btn2);

        // ボタンを商品セルに追加
        targetElement.appendChild(div);
        targetElement.style.border = '1px solid #667eea';
        targetElement.style.borderRadius = '5px';
        targetElement.style.padding = '5px';
        targetElement.style.margin = '5px';
        
        console.log(`商品 ${index + 1} にボタンを追加しました`);
    });
}

// データ収集機能は削除（出品機能に統合）

/**
 * Amazon検索
 */
async function findAmazonForMerucari() {
    let title = document.title;
    title = title.replace(' by メルカリ', '').trim();
    title = title.replace(' - メルカリ', '').trim();
    title = titleConvert(title);
    const url = 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(title);
    window.open(url, 'amazon_research');
}

async function findAmazonForMerucariList(event, itemCell) {
    const button = event.target;
    
    let title = '';
    const titleElement = itemCell.querySelector('[data-testid="thumbnail-item-name"]');
    if (titleElement) {
        title = titleElement.textContent.trim();
    }

    if (!title) {
        const imgElement = itemCell.querySelector('picture img');
        if (imgElement && imgElement.alt) {
            title = imgElement.alt.replace('のサムネイル', '');
        }
    }

    if (title) {
        title = titleConvert(title);
        const url = 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(title);
        window.open(url, 'amazon_research');
    } else {
        console.error('商品タイトルが取得できませんでした');
    }
}

/**
 * 管理画面を開く
 */
async function openAdminPanel() {
    try {
        const config = await getStoredConfig();
        const adminUrl = config.adminPanelUrl || 'https://mercari-listing-tool-admin.vercel.app';
        window.open(adminUrl, 'admin_panel');
    } catch (error) {
        console.error('管理画面URL取得エラー:', error);
        window.open('https://mercari-listing-tool-admin.vercel.app', 'admin_panel');
    }
}

/**
 * 出品用データ追加（詳細ページ）
 */
async function addToListingQueue(event) {
    const button = event.target;
    button.textContent = '出品準備中...';
    button.disabled = true;

    try {
        // 現在のページから情報を直接取得
        button.textContent = '詳細情報取得中...';
        const detailedInfo = fetchDetailedProductInfoFromCurrentPage();
        
        // 基本情報も取得
        const titleElement = document.querySelector('#main .merHeading h1, h1');
        const title = titleElement ? titleElement.textContent.trim() : '';
        
        const priceElement = document.querySelector('#main div[data-testid="price"], .price, [data-testid="price"]');
        let price = priceElement ? priceElement.textContent : '';
        if (price) {
            price = price.replace('¥', '').replace(/,/g, "");
        }

        const checkoutElement = document.querySelector('#main div[data-testid="checkout-button"] button, .checkout-button');
        const checkout = checkoutElement ? checkoutElement.textContent : '';

        // 詳細情報と基本情報を統合
        const productData = {
            url: window.location.href,
            title: title,
            seller: detailedInfo.seller,
            price: price,
            images: detailedInfo.images,
            productInfo: detailedInfo.productCondition,
            description: detailedInfo.description,
            checkout: checkout,
            sellerCode: detailedInfo.sellerCode,
            category: detailedInfo.category,
            brand: detailedInfo.brand
        };
        
        console.log('📋 詳細ページから取得したデータ:', productData);
        
        // NG出品者チェック
        if (detailedInfo.seller || detailedInfo.sellerCode) {
            const isNGSeller = await checkNGSeller(detailedInfo.seller, detailedInfo.sellerCode);
            if (isNGSeller) {
                button.textContent = 'NG出品者';
                button.style.background = '#dc3545';
                button.style.color = 'white';
                button.disabled = true; // 明示的に無効化
                
                // NG出品者の詳細表示
                const ngDiv = document.createElement('div');
                ngDiv.style.marginTop = '8px';
                ngDiv.style.fontSize = '0.7rem';
                ngDiv.style.padding = '8px';
                ngDiv.style.backgroundColor = '#f8d7da';
                ngDiv.style.color = '#721c24';
                ngDiv.style.borderRadius = '4px';
                ngDiv.style.border = '1px solid #dc3545';
                ngDiv.innerHTML = `
                    <div style="font-weight: bold;">⚠️ NG出品者</div>
                    <div>出品者: ${detailedInfo.seller}</div>
                    <div>管理画面で確認してください</div>
                `;
                
                button.parentNode.insertBefore(ngDiv, button.nextSibling);
                return;
            }
        }

        // NGワードチェック（タイトルと説明文）
        const keywordCheck = await checkNGKeywords(title, detailedInfo.description);
        if (keywordCheck.isNG) {
            button.textContent = 'NGワード検出';
            button.style.background = '#dc3545';
            button.style.color = 'white';
            button.disabled = true; // 明示的に無効化
            
            // NGワードの詳細表示
            const ngDiv = document.createElement('div');
            ngDiv.style.marginTop = '8px';
            ngDiv.style.fontSize = '0.7rem';
            ngDiv.style.padding = '8px';
            ngDiv.style.backgroundColor = '#f8d7da';
            ngDiv.style.color = '#721c24';
            ngDiv.style.borderRadius = '4px';
            ngDiv.style.border = '1px solid #dc3545';
            ngDiv.innerHTML = `
                <div style="font-weight: bold;">⚠️ NGワード検出</div>
                <div>検出キーワード: ${keywordCheck.matchedKeywords.join(', ')}</div>
                <div>出品できません</div>
            `;
            
            button.parentNode.insertBefore(ngDiv, button.nextSibling);
            return;
        }

        // 出品用データとしてSupabaseに保存
        const result = await saveProductForListing(productData);
        
        if (result.success) {
            // 商品情報が正常に取得できたことを記録
            bulkProcessingState.hasValidProducts = true;
            
            // 一括取得ボタンを有効化（まだ有効化されていない場合）
            if (!detailedProgressState.bulkButtonEnabled) {
                enableBulkProcessingButton();
                detailedProgressState.bulkButtonEnabled = true;
            }
            
            // 詳細情報取得完了数を更新
            detailedProgressState.detailedInfoReady++;
            
            // 一括処理中でない場合は個別に進行状況を更新
            if (!bulkProcessingState.isRunning) {
                updateDetailedProgressIndicator();
            }
            
            button.textContent = '出品準備完了';
            button.style.color = 'white';
            button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            button.setAttribute('data-completed', 'true'); // 完了マーカーを追加
            
            // 詳細結果表示
            const resultDiv = document.createElement('div');
            resultDiv.style.marginTop = '8px';
            resultDiv.style.fontSize = '0.7rem';
            resultDiv.style.padding = '8px';
            resultDiv.style.borderRadius = '4px';
            resultDiv.style.backgroundColor = '#e8f5e8';
            resultDiv.style.border = '1px solid #28a745';
            
            if (result.isFiltered) {
                resultDiv.innerHTML = `
                    <div style="color: #dc3545; font-weight: bold;">⚠️ フィルター対象商品</div>
                    <div>出品者: ${productData.seller || '取得失敗'}</div>
                    <div>状態: ${productData.productInfo || '取得失敗'}</div>
                    <div>Amazon出品価格: ¥${result.listingPrice?.toLocaleString()}</div>
                    <div>利益予想: ¥${(result.listingPrice - parseInt(price)).toLocaleString()}</div>
                    <div style="font-size: 0.6rem; color: #666;">管理画面で詳細確認してください</div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div style="color: #28a745; font-weight: bold;">✅ 出品準備完了</div>
                    <div>出品者: ${productData.seller || '取得失敗'}</div>
                    <div>状態: ${productData.productInfo || '取得失敗'}</div>
                    <div>Amazon出品価格: ¥${result.listingPrice?.toLocaleString()}</div>
                    <div>利益予想: ¥${(result.listingPrice - parseInt(price)).toLocaleString()}</div>
                    <div>Amazon状態: ${result.amazonData?.condition || 'Used'}</div>
                    <div style="font-size: 0.6rem; color: #666;">管理画面でCSV出力・出品処理が可能です</div>
                `;
            }
            
            button.parentNode.insertBefore(resultDiv, button.nextSibling);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('出品準備エラー:', error);
        button.textContent = '出品準備失敗';
        button.style.color = 'white';
        button.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        button.disabled = false;
    }
}

/**
 * 出品用データ追加（一覧ページ・ネイティブJS版）
 */
async function addToListingQueueFromListNative(event, itemCell, fetchDetails = false) {
    const button = event.target;
    
    // 一括処理済みチェック
    const container = button.closest('.research-tool-list') || button.closest('.research-tool');
    if (container && container.getAttribute('data-bulk-processed') === 'true') {
        const processedUrl = container.getAttribute('data-processed-url');
        console.log('🚫 一括処理済み商品への個別処理を阻止:', processedUrl);
        showDataNotification('この商品は既に出品済みです', 'warning');
        return;
    }
    
    button.textContent = '出品準備中...';
    button.disabled = true;
    
    try {
        // 商品ページURLを取得
        const linkElement = itemCell.querySelector('a[href^="/item/"]');
        const href = linkElement ? linkElement.getAttribute('href') : '';
        const url = 'https://jp.mercari.com' + href;
        
        // 簡易データ収集（一覧ページからの情報のみ）
        const titleElement = itemCell.querySelector('[data-testid="thumbnail-item-name"]');
        let title = titleElement ? titleElement.textContent.trim() : '';
        
        // mobile対応
        if (!title) {
            const imgElement = itemCell.querySelector('picture img');
            if (imgElement && imgElement.alt) {
                title = imgElement.alt.replace('のサムネイル', '');
            }
        }
        
        // 価格を取得（複数の方法で試行）
        let price = '';
        const priceElement = itemCell.querySelector('.number__6b270ca7');
        if (priceElement) {
            price = priceElement.textContent.trim();
        } else {
            // 代替セレクター
            const altPriceElement = itemCell.querySelector('[data-testid="thumbnail-item-price"]');
            if (altPriceElement) {
                price = altPriceElement.textContent.replace('¥', '').replace(/,/g, "");
            }
        }
        
        // 画像URL取得
        const imgElement = itemCell.querySelector('picture img');
        const imageSrc = imgElement ? imgElement.src : '';
        
        const productData = {
            url: url,
            title: title,
            price: price,
            images: [imageSrc],
            seller: '', // 一覧ページでは取得困難
            productInfo: '状態不明', // 一覧ページでは取得困難
            description: '詳細ページから情報を取得してください',
            checkout: '',
            sellerCode: ''
        };
        
        console.log('出品用データ:', productData);
        console.log('詳細情報取得:', fetchDetails);
        
        // 詳細情報が必要な場合は別タブで処理
        if (fetchDetails) {
            button.textContent = '別タブで処理中...';
            
            // 処理結果を受け取るためのユニークIDを生成
            const processingId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 一時的に商品データを保存（別タブとの通信用）
            const tempData = {
                productData: productData,
                processingId: processingId,
                timestamp: Date.now()
            };
            localStorage.setItem('mercari_temp_' + processingId, JSON.stringify(tempData));
            
            // 別タブで詳細ページを開く
            const detailTab = window.open(url + '?processing_id=' + processingId, '_blank');
            
            // 処理結果を監視
            const checkResult = setInterval(() => {
                const result = localStorage.getItem('mercari_result_' + processingId);
                if (result) {
                    clearInterval(checkResult);
                    
                    // 結果を処理
                    const resultData = JSON.parse(result);
                    
                    // 一時データをクリーンアップ
                    localStorage.removeItem('mercari_temp_' + processingId);
                    localStorage.removeItem('mercari_result_' + processingId);
                    
                    // 処理結果をUIに反映
                    displayProcessingResult(button, resultData, productData, price);
                }
            }, 1000);
            
            // 30秒後にタイムアウト
            setTimeout(() => {
                clearInterval(checkResult);
                const result = localStorage.getItem('mercari_result_' + processingId);
                if (!result) {
                    button.textContent = 'タイムアウト';
                    button.style.background = '#ffc107';
                    button.disabled = false;
                    
                    // クリーンアップ
                    localStorage.removeItem('mercari_temp_' + processingId);
                    localStorage.removeItem('mercari_result_' + processingId);
                }
            }, 30000);
            
            return;
        }
        
        // 詳細情報なしで保存
        const result = await saveProductForListing(productData, fetchDetails);
        
        if (result.success) {
            const completedText = '簡易出品完了';
            button.textContent = completedText;
            button.style.color = 'white';
            button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            
            // 簡易結果表示
            const resultDiv = document.createElement('div');
            resultDiv.style.marginTop = '4px';
            resultDiv.style.fontSize = '0.6rem';
            resultDiv.style.padding = '4px';
            resultDiv.style.backgroundColor = '#e8f5e8';
            resultDiv.style.borderRadius = '3px';
            resultDiv.style.textAlign = 'center';
            resultDiv.style.border = '1px solid #28a745';
            
            const profit = result.listingPrice - parseInt(price);
            let resultText = `出品価格: ¥${result.listingPrice?.toLocaleString()}<br>利益予想: ¥${profit.toLocaleString()}`;
            
            resultDiv.innerHTML = resultText;
            
            button.parentNode.insertBefore(resultDiv, button.nextSibling);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('出品準備エラー:', error);
        button.textContent = '準備失敗';
        button.style.color = 'white';
        button.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        button.disabled = false;
    }
}

/**
 * 出品用データ追加（一覧ページ・jQuery版・後方互換性のため保持）
 */
async function addToListingQueueFromList() {
    // この関数は後方互換性のために保持
    console.log('jQuery版のaddToListingQueueFromListが呼ばれました（非推奨）');
}

// 任意のページに管理画面ボタンを追加
function addAdminButtonToAnyPage() {
    console.log('🔧 任意のページに管理画面ボタンを追加中...');
    
    // 既に追加済みかチェック
    if (document.querySelector('.research-tool-global')) {
        console.log('✅ ボタンは既に追加済みです');
        return;
    }

    // 管理画面ボタンを画面右下に追加
    const div = document.createElement('div');
    div.className = 'research-tool-global';
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        overflow: hidden;
    `;

    // 管理画面ボタン
    const adminBtn = document.createElement('button');
    adminBtn.className = 'admin-btn-global';
    adminBtn.textContent = '📊 管理画面';
    adminBtn.style.cssText = `
        background: transparent;
        color: white;
        border: none;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    `;
    adminBtn.addEventListener('click', openAdminPanel);
    adminBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255,255,255,0.1)';
    });
    adminBtn.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
    });

    div.appendChild(adminBtn);
    document.body.appendChild(div);
    
    console.log('✅ 管理画面ボタンを追加しました');
}

// 一括処理機能
let bulkProcessingState = {
    isRunning: false,
    currentIndex: 0,
    totalItems: 0,
    processed: 0,
    failed: 0,
    skipped: 0,  // スキップした商品数を追加
    button: null,
    progressDiv: null,
    hasValidProducts: false,  // 有効な商品があるかどうか
    skipReasons: {
        sold: 0,           // SOLD商品
        priceFilter: 0,    // 価格フィルター
        ngItems: 0         // NGワード・NG出品者・商品状態など
    }
};

// 一括処理開始
async function startBulkProcessing() {
    if (bulkProcessingState.isRunning) {
        alert('一括処理が既に実行中です');
        return;
    }

    // 商品情報が取得されているかチェック
    if (!bulkProcessingState.hasValidProducts) {
        alert('商品情報を先に取得してください。\n\n先に個別の商品詳細ページを確認して、商品情報が正常に取得できることを確認してから一括処理を開始してください。');
        return;
    }

    try {
        const allItems = await getAllProductItems();
        if (allItems.length === 0) {
            alert('商品が見つかりませんでした');
            return;
        }

        const result = confirm(`一覧にある商品を上から順番に自動で出品準備します。\n\n対象商品: ${allItems.length}件\n\n続行しますか？`);
        if (!result) return;
        
        const items = allItems; // 全商品を処理
        console.log(`🚀 全商品処理モード: ${items.length}件を処理します`);

        // セッションストレージから再開データをチェック
        const sessionKey = 'mercari_bulk_processing_session';
        const savedSession = sessionStorage.getItem(sessionKey);
        
        let startIndex = 0;
        let processed = 0;
        let failed = 0;
        
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            const shouldResume = confirm(`前回の処理が途中で終了しています。\n\n進行状況: ${sessionData.processed + sessionData.failed}/${sessionData.totalItems}件\n成功: ${sessionData.processed}件\n失敗: ${sessionData.failed}件\n\n続きから再開しますか？`);
            
            if (shouldResume) {
                startIndex = sessionData.currentIndex;
                processed = sessionData.processed;
                failed = sessionData.failed;
                console.log(`📄 セッション復元: ${startIndex}番目から再開`);
            } else {
                sessionStorage.removeItem(sessionKey);
            }
        }

        // 処理状態を初期化
        bulkProcessingState = {
            isRunning: true,
            currentIndex: startIndex,
            totalItems: items.length,
            processed: processed,
            failed: failed,
            button: event.target,
            progressDiv: null,
            hasValidProducts: true,
            sessionKey: sessionKey
        };
        
        // 常時表示インジケーターを初期化
        updateProgressIndicator(0, 0, items.length, '一括取得開始');

        // ボタンを無効化
        bulkProcessingState.button.textContent = '処理中...';
        bulkProcessingState.button.disabled = true;

        // 進捗表示を作成
        createProgressDisplay();

        // セッション保存関数
        const saveSession = () => {
            const sessionData = {
                currentIndex: bulkProcessingState.currentIndex,
                totalItems: bulkProcessingState.totalItems,
                processed: bulkProcessingState.processed,
                failed: bulkProcessingState.failed,
                timestamp: Date.now()
            };
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
        };

        console.log(`🚀 一括処理開始: ${items.length}件の商品を処理します (${startIndex}番目から)`);

        // 商品を順次処理
        for (let i = startIndex; i < items.length; i++) {
            if (!bulkProcessingState.isRunning) {
                console.log('一括処理が停止されました');
                break;
            }

            bulkProcessingState.currentIndex = i;
            updateProgressDisplay();

            try {
                const result = await processSingleItemInBulk(items[i], i);
                if (result.skipped) {
                    console.log(`商品 ${i + 1} をスキップ: ${result.reason}`);
                    
                    // スキップ理由別にカウント
                    if (result.reason === 'SOLD商品') {
                        bulkProcessingState.skipReasons.sold++;
                    } else if (result.reason === '価格フィルタ（1万円以下）') {
                        bulkProcessingState.skipReasons.priceFilter++;
                    }
                    
                    bulkProcessingState.processed++; // スキップも処理済みとしてカウント
                } else if (result.filtered) {
                    // NGワード等でフィルタされた場合
                    console.log(`商品 ${i + 1} はフィルタされました`);
                    bulkProcessingState.skipReasons.ngItems++;
                    bulkProcessingState.processed++;
                } else {
                    bulkProcessingState.processed++;
                }
            } catch (error) {
                console.error(`商品 ${i + 1} の処理エラー:`, error);
                bulkProcessingState.failed++;
            }
            
            // 常時表示インジケーターを更新
            updateProgressIndicator(
                bulkProcessingState.processed, 
                bulkProcessingState.failed, 
                bulkProcessingState.totalItems, 
                '一括取得中'
            );

            // セッションストレージに進行状況を保存
            saveSession();

            // 次の商品処理前に待機（詳細ページ取得のため3秒）
            console.log('⏳ 次の商品処理まで3秒待機...');
            
            // 一時停止対応の待機ループ
            for (let waitTime = 0; waitTime < 3000; waitTime += 100) {
                if (!bulkProcessingState.isRunning) {
                    console.log('⏸️ 一時停止中...');
                    // 一時停止中は待機を続ける
                    while (!bulkProcessingState.isRunning) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    console.log('▶️ 処理再開');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // 完了処理
        completeBulkProcessing();

    } catch (error) {
        console.error('一括処理開始エラー:', error);
        alert('一括処理の開始に失敗しました: ' + error.message);
        resetBulkProcessingState();
    }
}

// 全商品アイテムを取得
async function getAllProductItems() {
    // 複数のセレクターで商品を取得
    const selectors = [
        '[data-testid="item-cell"]',
        'li[data-testid="item-cell"]',
        'a[data-testid="thumbnail-link"]',
        'a[href^="/item/"]'
    ];

    let items = [];
    for (const selector of selectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 0) {
            console.log(`商品取得: ${items.length}件 (セレクター: ${selector})`);
            break;
        }
    }

    return Array.from(items);
}

// 単一商品の処理（一括処理用）
async function processSingleItemInBulk(item, index) {
    console.log(`🔄 商品 ${index + 1} 処理開始:`, item);

    try {
        // 商品URLを取得
        let productUrl = '';
        const linkElement = item.querySelector('a[href^="/item/"]') || (item.tagName === 'A' ? item : null);
        
        if (linkElement) {
            productUrl = linkElement.href || linkElement.getAttribute('href');
            if (productUrl && !productUrl.startsWith('http')) {
                productUrl = 'https://jp.mercari.com' + productUrl;
            }
        }

        console.log(`🔗 商品URL取得: ${productUrl}`);
        
        if (!productUrl) {
            console.error('❌ 商品URLが取得できませんでした');
            throw new Error('商品URLが取得できませんでした');
        }

        // 商品の基本情報を取得
        console.log('📦 基本情報抽出開始...');
        const productData = extractProductDataFromListItem(item);
        productData.url = productUrl;

        console.log(`✅ 商品 ${index + 1} データ抽出完了:`, productData);

        // SOLD商品のチェック
        if (productData.isSold) {
            console.log(`🚫 商品 ${index + 1} はSOLD商品のためスキップ:`, productData.title);
            
            // SOLD商品として視覚的にマーク
            item.style.background = '#ffebee';
            item.style.border = '2px solid #f44336';
            item.style.opacity = '0.6';
            
            const soldMark = document.createElement('div');
            soldMark.textContent = '🚫 SOLD商品（スキップ）';
            soldMark.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #f44336;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: bold;
                z-index: 1000;
            `;
            
            item.style.position = 'relative';
            item.appendChild(soldMark);
            
            // SOLD商品として成功扱い（スキップしたことを示す）
            return { success: true, skipped: true, reason: 'SOLD商品' };
        }

        // 価格フィルタのチェック（1万円以下を除外）
        if (productData.isPriceTooLow) {
            console.log(`🚫 商品 ${index + 1} は価格が低すぎるためスキップ:`, productData.title, `価格: ${productData.price}`);
            
            // 価格が低い商品として視覚的にマーク
            item.style.background = '#fff3e0';
            item.style.border = '2px solid #ff9800';
            item.style.opacity = '0.6';
            
            const priceMark = document.createElement('div');
            priceMark.textContent = '💰 価格低（スキップ）';
            priceMark.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #ff9800;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: bold;
                z-index: 1000;
            `;
            
            item.style.position = 'relative';
            item.appendChild(priceMark);
            
            // 価格フィルタとして成功扱い（スキップしたことを示す）
            return { success: true, skipped: true, reason: '価格フィルタ（1万円以下）' };
        }

        // 別タブで詳細情報を取得して保存
        // Fetching detailed product information
        
        const result = await processSingleItemWithDetailedInfo(productData, index);
        
        if (!result.success) {
            console.error('❌ 保存失敗:', result.error);
            throw new Error(result.error || '保存に失敗しました');
        }


        // 結果に応じて適切なマークを追加
        
        if (result.filtered) {
            // NGでフィルタされた場合
            
            item.style.background = '#ffebee';
            item.style.border = '3px solid #f44336';
            item.style.opacity = '0.8';
            
            // フィルタ理由を表示するバッジ
            const filteredMark = document.createElement('div');
            let reasonText = '🚫 フィルタ済み';
            if (result.filterReason) {
                reasonText += `\n理由: ${result.filterReason}`;
            }
            filteredMark.textContent = reasonText;
            filteredMark.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #f44336;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.65rem;
                font-weight: bold;
                z-index: 1000;
                white-space: pre-line;
                max-width: 120px;
                line-height: 1.2;
                box-shadow: 0 2px 4px rgba(244,67,54,0.3);
            `;
            
            // より目立つオーバーレイを追加
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(244,67,54,0.1);
                border-radius: 8px;
                z-index: 999;
            `;
            
            item.style.position = 'relative';
            item.appendChild(overlay);
            item.appendChild(filteredMark);
        } else {
            // 正常に処理された場合
            item.style.background = '#e8f5e8';
            item.style.border = '2px solid #28a745';
            
            const processedMark = document.createElement('div');
            processedMark.textContent = '✅ 出品済み';
            processedMark.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #28a745;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: bold;
                z-index: 1000;
            `;
            
            item.style.position = 'relative';
            item.appendChild(processedMark);
        }
        
        // この商品の個別出品ボタンを無効化
        disableIndividualButtonsForItem(item, productData.url, result.filtered, result.filterReason);

        return result;
        
    } catch (error) {
        console.error(`❌ 商品 ${index + 1} 処理エラー:`, error);
        throw error;
    }
}

// 別タブで詳細情報を取得して処理する関数（一括処理用）
async function processSingleItemWithDetailedInfo(productData, index) {
    return new Promise((resolve) => {
        console.log(`🆕 商品 ${index + 1} の別タブ処理開始:`, productData.url);
        
        // 処理結果を受け取るためのユニークIDを生成
        const processingId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // 一時的に商品データを保存（別タブとの通信用）
        const tempData = {
            productData: productData,
            processingId: processingId,
            timestamp: Date.now(),
            isBulkProcessing: true // 一括処理フラグ
        };
        localStorage.setItem('mercari_temp_' + processingId, JSON.stringify(tempData));
        
        // 別タブで詳細ページを開く
        console.log(`🔗 商品 ${index + 1} の詳細ページを別タブで開く`);
        const detailTab = window.open(productData.url + '?processing_id=' + processingId, '_blank');
        
        // 処理結果を監視
        const checkResult = setInterval(() => {
            const result = localStorage.getItem('mercari_result_' + processingId);
            if (result) {
                clearInterval(checkResult);
                
                console.log(`✅ 商品 ${index + 1} の別タブ処理完了`);
                
                // 結果を処理
                const resultData = JSON.parse(result);
                
                // 一時データをクリーンアップ
                localStorage.removeItem('mercari_temp_' + processingId);
                localStorage.removeItem('mercari_result_' + processingId);
                
                // 別タブを閉じる
                if (detailTab && !detailTab.closed) {
                    detailTab.close();
                }
                
                resolve(resultData);
            }
        }, 1000);
        
        // 30秒後にタイムアウト
        setTimeout(() => {
            clearInterval(checkResult);
            const result = localStorage.getItem('mercari_result_' + processingId);
            if (!result) {
                console.warn(`⏰ 商品 ${index + 1} の処理がタイムアウト`);
                
                // クリーンアップ
                localStorage.removeItem('mercari_temp_' + processingId);
                localStorage.removeItem('mercari_result_' + processingId);
                
                // 別タブを閉じる
                if (detailTab && !detailTab.closed) {
                    detailTab.close();
                }
                
                resolve({ 
                    success: false, 
                    error: 'タイムアウト - 別タブでの処理が完了しませんでした' 
                });
            }
        }, 30000);
    });
}

// 個別の出品ボタンを無効化する関数
function disableIndividualButtonsForItem(item, productUrl, isFiltered = false, filterReason = '') {
    
    try {
        const buttonText = isFiltered ? '弾かれました' : '出品済み';
        const notificationMessage = isFiltered ? 'この商品はNGで弾かれました' : 'この商品は既に出品済みです';
        
        // この商品アイテム内の出品ボタンを探して無効化
        const buttonContainer = item.querySelector('.research-tool-list');
        if (buttonContainer) {
            const listingButton = buttonContainer.querySelector('.listing-btn');
            if (listingButton) {
                // ボタンを無効化
                listingButton.disabled = true;
                listingButton.textContent = buttonText;
                listingButton.style.background = '#6c757d';
                listingButton.style.color = 'white';
                listingButton.style.cursor = 'not-allowed';
                listingButton.style.opacity = '0.6';
                
                // クリックイベントを無効化
                listingButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showDataNotification(notificationMessage, 'info');
                    return false;
                };
                
                // 処理済みマークを追加
                buttonContainer.setAttribute('data-bulk-processed', 'true');
                buttonContainer.setAttribute('data-processed-url', productUrl);
                
                // Button disabled
            }
        }
        
        // 全体のボタンコンテナにも処理済みマークを追加
        const toolContainer = item.querySelector('.research-tool');
        if (toolContainer) {
            const listingButton = toolContainer.querySelector('.listing-btn');
            if (listingButton) {
                listingButton.disabled = true;
                listingButton.textContent = buttonText;
                listingButton.style.background = '#6c757d';
                listingButton.style.color = 'white';
                listingButton.style.cursor = 'not-allowed';
                listingButton.style.opacity = '0.6';
                
                listingButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showDataNotification(notificationMessage, 'info');
                    return false;
                };
            }
        }
        
    } catch (error) {
        console.error('❌ 個別ボタン無効化エラー:', error);
    }
}

// 一覧アイテムから商品データを抽出
function extractProductDataFromListItem(item) {
    
    // 商品名を取得
    let title = '';
    const titleSelectors = [
        'img[alt]',
        '[data-testid="item-name"]',
        '[data-testid="thumbnail-item-name"]',
        '.item-name',
        'h3',
        '.merText'
    ];
    
    for (const selector of titleSelectors) {
        const element = item.querySelector(selector);
        if (element) {
            title = element.textContent?.trim() || element.alt?.trim() || '';
            if (title) {
                break;
            }
        }
    }
    
    if (!title) {
        console.warn('⚠️ タイトル取得失敗');
    }

    // 価格を取得
    let price = '';
    const priceSelectors = [
        '[data-testid="price"]',
        '.item-price',
        '.price',
        'span'
    ];
    
    for (const selector of priceSelectors) {
        const elements = item.querySelectorAll(selector);
        for (const element of elements) {
            if (element && element.textContent.includes('¥')) {
                price = element.textContent.replace('¥', '').replace(/,/g, '').trim();
                // Price found
                break;
            }
        }
        if (price) break;
    }
    
    if (!price) {
        console.warn('⚠️ 価格取得失敗');
    }

    // 画像URLを取得
    const images = [];
    const imgElements = item.querySelectorAll('img');
    imgElements.forEach(img => {
        if (img.src && !img.src.includes('data:')) {
            images.push(img.src);
        }
    });
    
    // Images extracted

    // SOLD商品のチェック
    let isSold = false;
    const soldIndicators = [
        '.item-sold-out-badge',
        '.sold-out',
        '[data-testid="item-sold-out"]',
        '.item-status-sold',
        'img[alt*="SOLD"]',
        'img[src*="sold"]',
        '.badge-sold'
    ];
    
    for (const selector of soldIndicators) {
        const soldElement = item.querySelector(selector);
        if (soldElement) {
            isSold = true;
            console.log(`🚫 SOLD商品検出 (${selector}):`, title);
            break;
        }
    }
    
    // テキストベースでのSOLD検出
    if (!isSold) {
        const allText = item.textContent || '';
        if (allText.includes('SOLD') || allText.includes('売り切れ') || allText.includes('完売')) {
            isSold = true;
            console.log(`🚫 SOLD商品検出 (テキスト):`, title);
        }
    }

    // 価格フィルタチェック（1万円以下を除外）
    const priceNumber = parseInt(price.replace(/[^\d]/g, '')) || 0;
    const isPriceTooLow = priceNumber < 10000;
    
    if (isPriceTooLow) {
        console.log(`🚫 価格フィルタで除外: ${title}, 価格: ${priceNumber}円`);
    }

    const result = {
        title: title,
        price: price,
        images: images,
        seller: '', // 一覧では取得困難
        sellerCode: '', // 詳細ページで取得
        productInfo: '',
        description: '',
        checkout: '',
        category: '',
        brand: '',
        isSold: isSold,  // SOLD状態を追加
        isPriceTooLow: isPriceTooLow  // 価格フィルタ結果を追加
    };
    
    // Data extraction complete
    return result;
}

// 一括処理用の商品保存
async function saveProductForListingBulk(productData) {
    try {
        // Supabase初期化チェック
        const supabase = await initSupabase();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }

        // 設定チェック
        if (!window.RESEARCH_TOOL_CONFIG) {
            throw new Error('設定が読み込まれていません');
        }

        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;

        // 価格変換
        const numericPrice = parseInt(productData.price?.toString().replace(/[¥,]/g, '') || '0');
        console.log('💰 価格変換:', productData.price, '→', numericPrice);

        // 保存データ準備
        const saveData = {
            url: productData.url,
            title: productData.title,
            seller_name: productData.seller || '取得予定',
            price: numericPrice,
            images: productData.images,
            product_condition: productData.productInfo || '取得予定',
            description: productData.description || '取得予定',
            checkout_status: productData.checkout,
            seller_code: productData.sellerCode,
            listing_price: Math.round(numericPrice * 1.3), // 仮の出品価格
            is_filtered: false, // 後でNGチェック
            updated_at: new Date().toISOString()
        };
        
        console.log('📝 保存データ:', saveData);

        // データベースに保存
        console.log('🗄️ データベース保存実行...');
        const { data, error } = await supabase
            .from(TABLE_NAMES.PRODUCTS)
            .upsert(saveData, { onConflict: 'url' })
            .select()
            .single();

        if (error) {
            console.error('❌ データベース保存エラー:', error);
            throw error;
        }

        console.log('✅ データベース保存成功:', data);

        return {
            success: true,
            id: data.id,
            productData: data
        };
    } catch (error) {
        console.error('❌ 一括処理用商品保存エラー:', error);
        console.error('📊 エラー詳細:', {
            message: error.message,
            stack: error.stack,
            productData: productData
        });
        return {
            success: false,
            error: error.message
        };
    }
}

// 詳細情報込みの一括処理用商品保存
async function saveProductForListingBulkWithDetails(productData) {
    try {
        // Supabase初期化チェック
        const supabase = await initSupabase();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }

        // 設定チェック
        if (!window.RESEARCH_TOOL_CONFIG) {
            throw new Error('設定が読み込まれていません');
        }

        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        const numericPrice = parseInt(productData.price?.toString().replace(/[¥,]/g, '') || '0');

        // 出品価格計算（詳細版）
        const listingPrice = await calculateListingPrice(numericPrice);

        // 包括的NGチェック実行
        let ngDetected = false;
        const ngReasons = [];
        
        // NG出品者チェック
        if (productData.sellerCode) {
            const isNGSeller = await checkNGSeller(productData.seller, productData.sellerCode);
            if (isNGSeller) {
                ngDetected = true;
                ngReasons.push(`NG出品者: ${productData.seller}`);
                console.log(`🚫 NG出品者検出: ${productData.seller} (${productData.sellerCode})`);
            }
        }
        
        // NGワードチェック
        const keywordCheck = await checkNGKeywords(productData.title || '', productData.seller || '');
        if (keywordCheck.isNG) {
            ngDetected = true;
            ngReasons.push(`NGワード: ${keywordCheck.matchedKeywords.join(', ')}`);
            console.log(`🚫 NGワード検出: ${keywordCheck.matchedKeywords.join(', ')} - 商品: ${productData.title}`);
        }
        
        // 説明文NGワードチェック
        if (productData.description) {
            const descCheck = await checkNGKeywords(productData.description, '');
            if (descCheck.isNG) {
                ngDetected = true;
                ngReasons.push(`説明文NGワード: ${descCheck.matchedKeywords.join(', ')}`);
                console.log(`🚫 説明文NGワード検出: ${descCheck.matchedKeywords.join(', ')} - 商品: ${productData.title}`);
            }
        }
        
        // コンディションフィルタリング（新品以外をフィルタ）
        const conditionFiltered = productData.productInfo && productData.productInfo !== '新品、未使用';
        if (conditionFiltered) {
            ngDetected = true;
            ngReasons.push(`商品状態: ${productData.productInfo}`);
            console.log(`🚫 商品状態NG: ${productData.productInfo} - 商品: ${productData.title}`);
        }
        
        // 価格フィルタリング（1万円以下）
        const priceFiltered = numericPrice < 10000;
        if (priceFiltered) {
            ngDetected = true;
            ngReasons.push(`価格: ${numericPrice}円（1万円以下）`);
            console.log(`🚫 価格フィルタ: ${numericPrice}円 - 商品: ${productData.title}`);
        }
        
        const isFiltered = ngDetected;
        const filterReason = ngReasons.length > 0 ? ngReasons[0] : '';
        
        if (ngDetected) {
            console.log(`🚫 商品が弾かれました: ${productData.title} - 理由: ${filterReason}`);
        }

        // Amazon出品用データを生成
        const amazonData = generateAmazonListingData(productData, listingPrice);

        // 保存データ準備（詳細情報込み）
        const saveData = {
            url: productData.url,
            title: productData.title,
            seller_name: productData.seller || '取得失敗',
            price: numericPrice,
            images: productData.images,
            product_condition: productData.productInfo || '取得失敗',
            description: productData.description || '取得失敗',
            checkout_status: productData.checkout,
            seller_code: productData.sellerCode,
            listing_price: listingPrice,
            is_filtered: isFiltered,
            
            // Amazon出品用フィールド
            amazon_title: amazonData.title,
            amazon_description: amazonData.description,
            amazon_condition: amazonData.condition,
            amazon_condition_note: amazonData.conditionNote,
            amazon_keywords: amazonData.keywords,
            amazon_bullet_point_1: amazonData.bulletPoints[0],
            amazon_bullet_point_2: amazonData.bulletPoints[1],
            amazon_bullet_point_3: amazonData.bulletPoints[2],
            amazon_bullet_point_4: amazonData.bulletPoints[3],
            amazon_bullet_point_5: amazonData.bulletPoints[4],
            amazon_main_image_url: productData.images?.[0],
            amazon_other_image_urls: productData.images?.slice(1).join(','),
            amazon_status: isFiltered ? 'filtered' : 'ready',
            amazon_profit_margin: listingPrice > 0 ? ((listingPrice - numericPrice) / listingPrice * 100) : 0,
            amazon_roi: numericPrice > 0 ? ((listingPrice - numericPrice) / numericPrice * 100) : 0,
            
            updated_at: new Date().toISOString()
        };

        // カテゴリとブランド情報があれば追加
        if (productData.category || productData.brand) {
            let additionalInfo = '';
            if (productData.category) {
                additionalInfo += `【カテゴリ】${productData.category}\n`;
            }
            if (productData.brand) {
                additionalInfo += `【ブランド】${productData.brand}\n`;
            }
            saveData.description = additionalInfo + (saveData.description || '');
            saveData.amazon_description = additionalInfo + (saveData.amazon_description || '');
        }
        
        // データベースに保存
        const { data, error } = await supabase
            .from(TABLE_NAMES.PRODUCTS)
            .upsert(saveData, { onConflict: 'url' })
            .select()
            .single();

        if (error) {
            console.error('❌ データベース保存エラー:', error);
            throw error;
        }

        // Product saved successfully

        return {
            success: true,
            id: data.id,
            listingPrice,
            filtered: isFiltered,
            filterReason: filterReason,
            amazonData,
            productData: data
        };
    } catch (error) {
        console.error('❌ 詳細情報込み商品保存エラー:', error);
        console.error('📊 エラー詳細:', {
            message: error.message,
            stack: error.stack,
            productData: productData
        });
        return {
            success: false,
            error: error.message
        };
    }
}

// 進捗表示を作成
function createProgressDisplay() {
    // 既存の進捗表示があれば削除
    const existing = document.querySelector('.bulk-progress');
    if (existing) existing.remove();

    const progressDiv = document.createElement('div');
    progressDiv.className = 'bulk-progress';
    progressDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        min-width: 320px;
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;

    progressDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #007bff;">🚀 一括処理中</h3>
            <div style="display: flex; gap: 8px;">
                <button id="pause-resume-btn" 
                        style="background: #ffc107; color: #000; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; min-width: 80px; z-index: 999999; position: relative;" 
                        class="pause-resume-btn">一時停止</button>
                <button id="stop-processing-btn" 
                        style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; min-width: 60px; z-index: 999999; position: relative;">停止</button>
            </div>
        </div>
        <div class="progress-info" style="margin-bottom: 10px;">
            <div style="margin-bottom: 5px;">進捗: <span class="current">0</span> / <span class="total">${bulkProcessingState.totalItems}</span></div>
            <div style="margin-bottom: 5px;">成功: <span class="processed">0</span>件</div>
            <div>失敗: <span class="failed">0</span>件</div>
        </div>
        <div style="background: #e9ecef; border-radius: 4px; margin: 10px 0; overflow: hidden;">
            <div class="progress-bar" style="background: #007bff; height: 20px; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div class="current-item" style="margin: 8px 0; font-size: 0.8rem; color: #666;">準備中...</div>
        <div class="session-info" style="margin-top: 5px; font-size: 0.7rem; color: #999;">セッション保存中</div>
    `;

    // ドラッグ可能にする
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    progressDiv.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // ボタンクリック時は無視
        
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        progressDiv.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            
            progressDiv.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            progressDiv.style.cursor = 'grab';
        }
    });

    progressDiv.style.cursor = 'grab';
    progressDiv.title = 'ドラッグして移動できます';

    document.body.appendChild(progressDiv);
    bulkProcessingState.progressDiv = progressDiv;
    
    // ボタンのイベントリスナーを設定
    const pauseBtn = progressDiv.querySelector('#pause-resume-btn');
    const stopBtn = progressDiv.querySelector('#stop-processing-btn');
    
    if (pauseBtn) {
        console.log('一時停止ボタンにイベントリスナーを設定しました');
        pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // ドラッグイベントを防ぐ
            e.preventDefault();
            console.log('一時停止ボタンクリックイベント発生');
            pauseResumeProcessing();
        });
        
        // ボタンが機能するかテスト用の視覚的フィードバック
        pauseBtn.addEventListener('mousedown', () => {
            pauseBtn.style.transform = 'scale(0.95)';
        });
        pauseBtn.addEventListener('mouseup', () => {
            pauseBtn.style.transform = 'scale(1)';
        });
    } else {
        console.error('一時停止ボタンが見つかりませんでした');
    }
    
    if (stopBtn) {
        console.log('停止ボタンにイベントリスナーを設定しました');
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // ドラッグイベントを防ぐ
            e.preventDefault();
            console.log('停止ボタンクリックイベント発生');
            stopBulkProcessing();
        });
        
        // ボタンが機能するかテスト用の視覚的フィードバック
        stopBtn.addEventListener('mousedown', () => {
            stopBtn.style.transform = 'scale(0.95)';
        });
        stopBtn.addEventListener('mouseup', () => {
            stopBtn.style.transform = 'scale(1)';
        });
    } else {
        console.error('停止ボタンが見つかりませんでした');
    }
}

// 進捗表示を更新
function updateProgressDisplay() {
    if (!bulkProcessingState.progressDiv) return;

    const current = bulkProcessingState.currentIndex + 1;
    const total = bulkProcessingState.totalItems;
    const processed = bulkProcessingState.processed;
    const failed = bulkProcessingState.failed;
    const progress = (current / total) * 100;

    const progressDiv = bulkProcessingState.progressDiv;
    progressDiv.querySelector('.current').textContent = current;
    progressDiv.querySelector('.processed').textContent = processed;
    progressDiv.querySelector('.failed').textContent = failed;
    progressDiv.querySelector('.progress-bar').style.width = progress + '%';
    progressDiv.querySelector('.current-item').textContent = `商品 ${current} を処理中...`;
}

// 一時停止・再開機能
function pauseResumeProcessing() {
    const pauseBtn = document.querySelector('#pause-resume-btn');
    if (!pauseBtn) {
        console.error('一時停止ボタンが見つかりません');
        return;
    }
    
    console.log('一時停止ボタンがクリックされました。現在の状態:', bulkProcessingState.isRunning);
    
    if (bulkProcessingState.isRunning) {
        // 一時停止
        bulkProcessingState.isRunning = false;
        pauseBtn.textContent = '再開';
        pauseBtn.style.background = '#28a745';
        pauseBtn.style.color = 'white';
        
        const sessionInfo = document.querySelector('.session-info');
        if (sessionInfo) {
            sessionInfo.textContent = '一時停止中 - セッション保存済み';
            sessionInfo.style.color = '#ffc107';
            sessionInfo.style.fontWeight = 'bold';
        }
        
        console.log('⏸️ 処理を一時停止しました');
    } else {
        // 再開
        bulkProcessingState.isRunning = true;
        pauseBtn.textContent = '一時停止';
        pauseBtn.style.background = '#ffc107';
        pauseBtn.style.color = '#000';
        
        const sessionInfo = document.querySelector('.session-info');
        if (sessionInfo) {
            sessionInfo.textContent = 'セッション保存中';
            sessionInfo.style.color = '#999';
            sessionInfo.style.fontWeight = 'normal';
        }
        
        console.log('▶️ 処理を再開しました');
    }
}

// 一括処理停止
function stopBulkProcessing() {
    if (confirm('一括処理を停止しますか？\n\n進行状況はセッションに保存されており、次回再開できます。')) {
        bulkProcessingState.isRunning = false;
        
        // セッション情報をコンソールに表示
        const { processed, failed, totalItems, currentIndex } = bulkProcessingState;
        console.log('🛑 処理を停止しました');
        console.log(`📊 現在の進行状況: ${processed + failed}/${totalItems}件 (${currentIndex + 1}番目まで)`);
        
        resetBulkProcessingState();
    }
}

// 一括処理完了
function completeBulkProcessing() {
    const { processed, failed, totalItems, skipReasons, sessionKey } = bulkProcessingState;
    
    // セッション完了時は保存データを削除
    if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
        console.log('📄 セッションデータを削除しました');
    }
    
    // スキップ合計数を計算
    const totalSkipped = skipReasons.sold + skipReasons.priceFilter + skipReasons.ngItems;
    const actualProcessed = processed - totalSkipped;
    
    // 常時表示インジケーターを完了状態に更新
    updateProgressIndicator(processed, failed, totalItems, '一括取得完了');
    
    // 詳細な集計通知を表示
    let message = `一括処理完了！\n\n`;
    message += `📊 処理結果\n`;
    message += `　✅ 正常処理: ${actualProcessed}件\n`;
    if (totalSkipped > 0) {
        message += `　⏭️ スキップ: ${totalSkipped}件\n`;
        if (skipReasons.sold > 0) {
            message += `　　├ SOLD商品: ${skipReasons.sold}件\n`;
        }
        if (skipReasons.priceFilter > 0) {
            message += `　　├ 価格フィルター: ${skipReasons.priceFilter}件\n`;
        }
        if (skipReasons.ngItems > 0) {
            message += `　　└ NGワード等: ${skipReasons.ngItems}件\n`;
        }
    }
    if (failed > 0) {
        message += `　❌ 失敗: ${failed}件\n`;
    }
    message += `\n📈 合計: ${totalItems}件`;
    
    alert(message);
    
    // showDataNotificationでも通知表示
    let shortMessage = `処理完了: ${actualProcessed}件成功`;
    if (totalSkipped > 0) {
        shortMessage += `, ${totalSkipped}件スキップ`;
    }
    if (failed > 0) {
        shortMessage += `, ${failed}件失敗`;
    }
    showDataNotification(shortMessage, 'success');
    
    // 進捗表示を成功メッセージに変更
    if (bulkProcessingState.progressDiv) {
        bulkProcessingState.progressDiv.innerHTML = `
            <div style="text-align: center; color: #28a745;">
                <h3 style="margin: 0;">✅ デバッグ完了</h3>
                <div style="margin-top: 10px;">
                    <div>成功: ${actualProcessed}件</div>
                    ${totalSkipped > 0 ? `<div>スキップ: ${totalSkipped}件</div>` : ''}
                    ${failed > 0 ? `<div>失敗: ${failed}件</div>` : ''}
                    <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">※最大5件まで処理</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">閉じる</button>
            </div>
        `;
    }

    resetBulkProcessingState();
}

// 処理状態をリセット
function resetBulkProcessingState() {
    if (bulkProcessingState.button) {
        if (bulkProcessingState.hasValidProducts) {
            bulkProcessingState.button.textContent = '🚀 一括取得';
            bulkProcessingState.button.disabled = false;
            bulkProcessingState.button.style.opacity = '1';
            bulkProcessingState.button.style.cursor = 'pointer';
        } else {
            bulkProcessingState.button.textContent = '🚀 一括取得（情報取得後に有効化）';
            bulkProcessingState.button.disabled = true;
            bulkProcessingState.button.style.opacity = '0.5';
            bulkProcessingState.button.style.cursor = 'not-allowed';
        }
    }
    
    // スキップ理由のカウンターをリセット
    bulkProcessingState.skipReasons = {
        sold: 0,
        priceFilter: 0,
        ngItems: 0
    };
    
    bulkProcessingState.isRunning = false;
    bulkProcessingState.currentIndex = 0;
    bulkProcessingState.processed = 0;
    bulkProcessingState.failed = 0;
}

// 一括取得ボタンを有効化
function enableBulkProcessingButton() {
    if (bulkProcessingState.button && !bulkProcessingState.isRunning) {
        bulkProcessingState.button.textContent = '🚀 一括取得';
        bulkProcessingState.button.disabled = false;
        bulkProcessingState.button.style.opacity = '1';
        bulkProcessingState.button.style.cursor = 'pointer';
        
        // 有効化の通知
        showDataNotification('一括取得が有効になりました！', 'success');
    }
}

// グローバル関数として停止機能を追加
window.stopBulkProcessing = stopBulkProcessing;

// 設定更新メッセージリスナー
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'CONFIG_UPDATE') {
            clearConfigCache();
            console.log('設定が更新されました:', request.config);
            sendResponse({ success: true });
        }
    });
}

// 初期化処理
// 初期化状態管理
let isInitializing = false;
let initializationTimeout = null;

function initializeExtension() {
    console.log('🚀 拡張機能初期化開始');
    console.log('🌐 現在のURL:', window.location.href);
    console.log('📄 document.readyState:', document.readyState);
    
    // 初期化中の場合は重複実行を防ぐ
    if (isInitializing) {
        console.log('⚠️ 初期化中のため処理をスキップ');
        return;
    }
    
    // 前回のタイムアウトをクリア
    if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        initializationTimeout = null;
    }
    
    isInitializing = true;
    
    try {
        // バージョン情報を表示
        console.log('📋 バージョン情報表示開始');
        showVersionInfo();
        
        // 進行状況インジケーターを初期化（常に表示）
        console.log('📊 進行状況インジケーター初期化開始');
        const indicator = createPersistentProgressIndicator();
        
        if (indicator) {
            // 初期状態で表示（データなしでも表示）
            console.log('📍 初期表示テスト開始');
            updateProgressIndicator(0, 0, 0, '拡張機能読み込み完了');
            
            // 1秒後に商品数をチェックして表示
            setTimeout(() => {
                console.log('🧪 1秒後: 商品数チェック');
                try {
                    const itemCount = document.querySelectorAll('[data-testid="item-cell"]').length;
                    console.log('🔍 検出された商品数:', itemCount);
                    if (itemCount > 0) {
                        updateProgressIndicator(itemCount, 0, 0, `${itemCount}件の商品を検出`);
                        lastDataCount = itemCount;
                    } else {
                        updateProgressIndicator(0, 0, 0, '商品を検索中...');
                    }
                } catch (error) {
                    console.error('❌ 商品数チェックエラー:', error);
                    updateProgressIndicator(0, 0, 0, '待機中');
                }
            }, 1000);
        } else {
            console.error('❌ インジケーター初期化失敗');
        }
        
        // 拡張機能の状態を確認・表示
        console.log('🔍 拡張機能状態確認開始');
        showExtensionStatus();
        
        // データ更新監視を開始
        console.log('👀 データ更新監視開始');
        startDataUpdateMonitoring();
        
        console.log('✅ 拡張機能初期化完了');
        
    } catch (error) {
        console.error('❌ 拡張機能初期化エラー:', error);
    } finally {
        // 初期化完了フラグをリセット
        isInitializing = false;
        console.log('🏁 初期化フラグリセット完了');
    }
}

// ページ読み込み完了時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    // すでに読み込み完了している場合は即座に実行
    initializeExtension();
}

// ページ内容変更時の再初期化（SPAサイト対応）
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔄 ページ変更を検出、再初期化準備中...');
        
        // 前回のタイムアウトをクリア
        if (initializationTimeout) {
            clearTimeout(initializationTimeout);
        }
        
        // 重複防止のため少し待ってから初期化
        initializationTimeout = setTimeout(() => {
            console.log('🔄 ページ変更後の再初期化実行');
            initializeExtension();
        }, 1500); // 1.5秒後に再初期化（より安全な間隔）
    }
}).observe(document, { subtree: true, childList: true });