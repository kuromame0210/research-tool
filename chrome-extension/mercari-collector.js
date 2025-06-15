// メルカリデータ収集スクリプト
console.log('🚀 メルカリリサーチツール: スクリプトが読み込まれました', window.location.href);

// データ更新通知UI
let notificationElement = null;
let lastDataCount = 0;

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

// 5秒間隔でデータ更新をチェック
function startDataUpdateMonitoring() {
    setInterval(async () => {
        try {
            const currentCount = document.querySelectorAll('[data-testid="item-cell"]').length;
            
            if (currentCount > lastDataCount) {
                const newItems = currentCount - lastDataCount;
                showDataNotification(`新しい商品が${newItems}件読み込まれました`, 'success');
                lastDataCount = currentCount;
            }
        } catch (error) {
            console.error('データ更新監視エラー:', error);
        }
    }, 5000);
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
            .from('ng_sellers')
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
            .from('ng_keywords')
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
        
        // 4. NG判定結果の処理
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

// 一覧ページでのNGチェック
async function performListPageNGCheck() {
    try {
        console.log('🔍 一覧ページでのNGチェック開始');
        
        // 商品アイテムが読み込まれるまで待機
        await waitForElement('[data-testid="item-cell"], .items-box, .item-box', 5000);
        
        // 定期的に新しい商品をチェック
        const checkInterval = setInterval(async () => {
            await checkItemsInList();
        }, 2000);
        
        // 初回実行
        await checkItemsInList();
        
        // ページ変更時にクリーンアップ
        const currentUrl = window.location.href;
        const checkUrlChange = setInterval(() => {
            if (window.location.href !== currentUrl) {
                clearInterval(checkInterval);
                clearInterval(checkUrlChange);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ 一覧ページNGチェックエラー:', error);
    }
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
        // 一覧ページでもNGワードチェックを実行
        performListPageNGCheck();
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
        
        // NG出品者チェック
        let isNGSeller = false;
        if (detailedInfo.seller || detailedInfo.sellerCode) {
            isNGSeller = await checkNGSeller(detailedInfo.seller, detailedInfo.sellerCode);
        }
        
        // 商品を保存
        const result = await saveProductForListing(productData, true);
        
        // 結果を元のタブに送信
        const resultData = {
            success: result.success,
            error: result.error,
            listingPrice: result.listingPrice,
            isFiltered: result.isFiltered,
            isNGSeller: isNGSeller,
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
            enableBulkProcessingButton(); // 一括取得ボタンを有効化
            
            button.textContent = '出品準備完了';
            button.style.color = 'white';
            button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            
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
    button: null,
    progressDiv: null,
    hasValidProducts: false  // 有効な商品があるかどうか
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
        const result = confirm('一覧にある商品を上から順番に自動で出品準備します。\n\n【デバッグモード: 最大5件まで処理】\n\n続行しますか？');
        if (!result) return;

        // 商品リストを取得（デバッグ用に5件に制限）
        const allItems = await getAllProductItems();
        if (allItems.length === 0) {
            alert('商品が見つかりませんでした');
            return;
        }
        
        const items = allItems.slice(0, 5); // デバッグ用に最初の5件のみ
        console.log(`🛠️ デバッグモード: ${allItems.length}件中${items.length}件を処理します`);

        // 処理状態を初期化
        bulkProcessingState = {
            isRunning: true,
            currentIndex: 0,
            totalItems: items.length,
            processed: 0,
            failed: 0,
            button: event.target,
            progressDiv: null,
            hasValidProducts: true
        };

        // ボタンを無効化
        bulkProcessingState.button.textContent = '処理中...';
        bulkProcessingState.button.disabled = true;

        // 進捗表示を作成
        createProgressDisplay();

        console.log(`🛠️ デバッグモード一括処理開始: ${items.length}件の商品を処理します`);

        // 商品を順次処理
        for (let i = 0; i < items.length; i++) {
            if (!bulkProcessingState.isRunning) {
                console.log('一括処理が停止されました');
                break;
            }

            bulkProcessingState.currentIndex = i;
            updateProgressDisplay();

            try {
                await processSingleItemInBulk(items[i], i);
                bulkProcessingState.processed++;
            } catch (error) {
                console.error(`商品 ${i + 1} の処理エラー:`, error);
                bulkProcessingState.failed++;
            }

            // 次の商品処理前に少し待機（デバッグ用: 1秒）
            await new Promise(resolve => setTimeout(resolve, 1000));
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
    console.log(`📦 商品 ${index + 1} を処理中...`);

    // 商品URLを取得
    let productUrl = '';
    const linkElement = item.querySelector('a[href^="/item/"]') || (item.tagName === 'A' ? item : null);
    
    if (linkElement) {
        productUrl = linkElement.href || linkElement.getAttribute('href');
        if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://jp.mercari.com' + productUrl;
        }
    }

    if (!productUrl) {
        throw new Error('商品URLが取得できませんでした');
    }

    // 商品の基本情報を取得
    const productData = extractProductDataFromListItem(item);
    productData.url = productUrl;

    console.log(`商品 ${index + 1} データ:`, productData);

    // 商品データを保存（詳細情報は後で別タブで取得）
    const result = await saveProductForListingBulk(productData);
    
    if (!result.success) {
        throw new Error(result.error || '保存に失敗しました');
    }

    // 処理済みマークをアイテムに追加
    item.style.background = '#e8f5e8';
    item.style.border = '2px solid #28a745';
    
    const processedMark = document.createElement('div');
    processedMark.textContent = '✅ 処理完了';
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

    return result;
}

// 一覧アイテムから商品データを抽出
function extractProductDataFromListItem(item) {
    // 商品名を取得
    let title = '';
    const titleSelectors = [
        'img[alt]',
        '[data-testid="item-name"]',
        '.item-name',
        'h3',
        '.merText'
    ];
    
    for (const selector of titleSelectors) {
        const element = item.querySelector(selector);
        if (element) {
            title = element.textContent?.trim() || element.alt?.trim() || '';
            if (title) break;
        }
    }

    // 価格を取得
    let price = '';
    const priceSelectors = [
        '[data-testid="price"]',
        '.item-price',
        '.price',
        'span:contains("¥")'
    ];
    
    for (const selector of priceSelectors) {
        const element = item.querySelector(selector);
        if (element && element.textContent.includes('¥')) {
            price = element.textContent.replace('¥', '').replace(/,/g, '').trim();
            break;
        }
    }

    // 画像URLを取得
    const images = [];
    const imgElement = item.querySelector('img');
    if (imgElement && imgElement.src) {
        images.push(imgElement.src);
    }

    return {
        title: title,
        price: price,
        images: images,
        seller: '', // 一覧では取得困難
        sellerCode: '', // 詳細ページで取得
        productInfo: '',
        description: '',
        checkout: '',
        category: '',
        brand: ''
    };
}

// 一括処理用の商品保存
async function saveProductForListingBulk(productData) {
    try {
        const supabase = await initSupabase();
        if (!supabase || !window.RESEARCH_TOOL_CONFIG) {
            throw new Error('Supabaseクライアントまたは設定が初期化されていません');
        }

        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        const numericPrice = parseInt(productData.price?.toString().replace(/[¥,]/g, '') || '0');

        // 基本データで一旦保存
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

        const { data, error } = await supabase
            .from(TABLE_NAMES.PRODUCTS)
            .upsert(saveData, { onConflict: 'url' })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            id: data.id,
            productData: data
        };
    } catch (error) {
        console.error('一括処理用商品保存エラー:', error);
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
        top: 10px;
        right: 10px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 280px;
        font-family: Arial, sans-serif;
    `;

    progressDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #007bff;">🛠️ デバッグ処理中</h3>
            <button onclick="stopBulkProcessing()" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">停止</button>
        </div>
        <div class="progress-info">
            <div>進捗: <span class="current">0</span> / <span class="total">${bulkProcessingState.totalItems}</span></div>
            <div>成功: <span class="processed">0</span>件</div>
            <div>失敗: <span class="failed">0</span>件</div>
        </div>
        <div style="background: #e9ecef; border-radius: 4px; margin-top: 10px; overflow: hidden;">
            <div class="progress-bar" style="background: #007bff; height: 20px; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div class="current-item" style="margin-top: 8px; font-size: 0.8rem; color: #666;">準備中...</div>
    `;

    document.body.appendChild(progressDiv);
    bulkProcessingState.progressDiv = progressDiv;
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

// 一括処理停止
function stopBulkProcessing() {
    if (confirm('一括処理を停止しますか？')) {
        bulkProcessingState.isRunning = false;
        resetBulkProcessingState();
    }
}

// 一括処理完了
function completeBulkProcessing() {
    const { processed, failed, totalItems } = bulkProcessingState;
    
    alert(`デバッグ処理完了！\n\n処理完了: ${processed}件\n失敗: ${failed}件\n合計: ${totalItems}件\n\n※デバッグモードでは最大5件まで処理`);
    
    // 進捗表示を成功メッセージに変更
    if (bulkProcessingState.progressDiv) {
        bulkProcessingState.progressDiv.innerHTML = `
            <div style="text-align: center; color: #28a745;">
                <h3 style="margin: 0;">✅ デバッグ完了</h3>
                <div style="margin-top: 10px;">
                    <div>成功: ${processed}件</div>
                    <div>失敗: ${failed}件</div>
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