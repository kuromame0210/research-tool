// ユーティリティ関数

// Supabaseクライアント初期化
let supabaseClient = null;
let cachedConfig = null;

// 設定を直接返す（Chrome Storageを使用しない）
async function getStoredConfig() {
    return {
        supabaseUrl: window.RESEARCH_TOOL_CONFIG?.SUPABASE_CONFIG?.url || 'https://ogtcktojdarzuigwrnkj.supabase.co',
        supabaseKey: window.RESEARCH_TOOL_CONFIG?.SUPABASE_CONFIG?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ndGNrdG9qZGFyenVpZ3dybmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjA1NjcsImV4cCI6MjA2Mjc5NjU2N30.1mJQ8ODIdPfrpTEQbxKwGnSyUKK4kg3TvPXfq-J1h08',
        adminPanelUrl: 'https://mercari-listing-tool-admin.vercel.app'
    };
}

async function initSupabase() {
    if (!supabaseClient) {
        // Supabaseライブラリが読み込まれているかチェック
        if (!window.supabase) {
            console.warn('Supabaseライブラリが読み込まれていません');
            return null;
        }
        
        if (!cachedConfig) {
            cachedConfig = await getStoredConfig();
        }
        
        // 設定から直接取得
        const url = cachedConfig.supabaseUrl;
        const key = cachedConfig.supabaseKey;
        
        if (url && key) {
            try {
                supabaseClient = window.supabase.createClient(url, key);
                console.log('Supabaseクライアント初期化成功');
            } catch (error) {
                console.error('Supabaseクライアント初期化エラー:', error);
                return null;
            }
        } else {
            console.warn('Supabase設定が不完全です');
            return null;
        }
    }
    return supabaseClient;
}

// 設定更新時にキャッシュをクリア
function clearConfigCache() {
    cachedConfig = null;
    supabaseClient = null;
}

// 価格計算関数
async function calculateListingPrice(originalPrice) {
    try {
        const supabase = await initSupabase();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません。デフォルト価格計算を使用します。');
            return Math.round(originalPrice * 1.5);
        }
        
        if (!window.RESEARCH_TOOL_CONFIG) {
            console.warn('設定が読み込まれていません。デフォルト価格計算を使用します。');
            return Math.round(originalPrice * 1.5);
        }
        
        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        
        // アクティブな価格表取得
        const { data: priceTables } = await supabase
            .from(TABLE_NAMES.PRICE_TABLES)
            .select(`
                id,
                ${TABLE_NAMES.PRICE_RANGES} (
                    min_price,
                    max_price,
                    profit_rate,
                    shipping_cost,
                    platform_fee_rate
                )
            `)
            .eq('is_active', true)
            .limit(1)
            .single();
        
        if (!priceTables) {
            return Math.round(originalPrice * 1.5);
        }
        
        // 価格帯に合う設定を検索
        const priceRanges = priceTables[TABLE_NAMES.PRICE_RANGES];
        const priceRange = priceRanges.find(range => {
            return originalPrice >= range.min_price && 
                   (range.max_price === null || originalPrice <= range.max_price);
        });
        
        if (!priceRange) {
            return Math.round(originalPrice * 1.5);
        }
        
        // 計算式: (仕入れ価格 + 送料) / (1 - 手数料率/100 - 利益率/100)
        const basePrice = originalPrice + (priceRange.shipping_cost || 0);
        const feeRate = (priceRange.platform_fee_rate || 10) / 100;
        const profitRate = (priceRange.profit_rate || 30) / 100;
        
        const listingPrice = basePrice / (1 - feeRate - profitRate);
        
        console.log('価格計算結果:', {
            originalPrice,
            priceRange,
            basePrice,
            feeRate,
            profitRate,
            listingPrice: Math.round(listingPrice)
        });
        
        return Math.round(listingPrice);
    } catch (error) {
        console.error('価格計算エラー:', error);
        return Math.round(originalPrice * 1.5);
    }
}

// キーワードフィルタリング関数
async function checkKeywordFilter(title, description) {
    try {
        const supabase = await initSupabase();
        if (!supabase) {
            console.warn('Supabaseクライアントが初期化されていません。キーワードフィルターをスキップします。');
            return false;
        }
        
        if (!window.RESEARCH_TOOL_CONFIG) {
            console.warn('設定が読み込まれていません。キーワードフィルターをスキップします。');
            return false;
        }
        
        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        
        const { data: filters } = await supabase
            .from(TABLE_NAMES.KEYWORD_FILTERS)
            .select('keyword, filter_type')
            .eq('is_active', true);
        
        if (!filters) return false;
        
        const text = `${title} ${description}`.toLowerCase();
        
        for (const filter of filters) {
            const keyword = filter.keyword.toLowerCase();
            const hasKeyword = text.includes(keyword);
            
            if (filter.filter_type === 'exclude' && hasKeyword) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('キーワードフィルタリングエラー:', error);
        return false;
    }
}

// 詳細ページから情報を取得する関数
async function fetchDetailedProductInfo(productUrl) {
    try {
        console.log('詳細ページから情報取得中:', productUrl);
        
        const response = await fetch(productUrl);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        console.log('取得したHTMLの長さ:', text.length);
        
        // 出品者名（複数のセレクターを試行）
        let seller = '';
        const sellerSelectors = [
            '#main .merUserObject p',
            '.merUserObject p',
            '[data-testid="user-name"]',
            '[data-testid="seller-name"]'
        ];
        for (const selector of sellerSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                seller = element.textContent.trim();
                console.log('出品者名取得成功:', seller, 'セレクター:', selector);
                break;
            }
        }
        if (!seller) console.log('出品者名取得失敗');
        
        // 商品の状態（新しい構造に対応）
        let productInfo = '';
        const conditionSelectors = [
            'span[data-testid="商品の状態"]',
            '#main #item-info span[data-testid="商品の状態"]',
            '[data-testid="商品の状態"]'
        ];
        for (const selector of conditionSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                productInfo = element.textContent.trim();
                console.log('商品状態取得成功:', productInfo, 'セレクター:', selector);
                break;
            }
        }
        if (!productInfo) console.log('商品状態取得失敗');
        
        // カテゴリー情報
        const categories = [];
        const categoryElements = doc.querySelectorAll('[data-testid="item-detail-category"] .merBreadcrumbItem a');
        categoryElements.forEach(element => {
            categories.push(element.textContent.trim());
        });
        const category = categories.join(' > ');
        console.log('カテゴリー取得:', category);
        
        // ブランド情報
        let brand = '';
        const brandElement = doc.querySelector('span[data-testid="ブランド"] a');
        if (brandElement) {
            brand = brandElement.textContent.trim();
            console.log('ブランド取得成功:', brand);
        } else {
            console.log('ブランド取得失敗');
        }
        
        
        // 商品説明
        let description = '';
        const descriptionSelectors = [
            '#main pre[data-testid="description"]',
            'pre[data-testid="description"]',
            '[data-testid="description"]'
        ];
        for (const selector of descriptionSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                description = element.textContent.trim();
                console.log('説明文取得成功（文字数:' + description.length + ')');
                break;
            }
        }
        if (!description) console.log('説明文取得失敗');
        
        // 購入状態
        let checkout = '';
        const checkoutSelectors = [
            '#main div[data-testid="checkout-button"] button',
            'div[data-testid="checkout-button"] button',
            '[data-testid="checkout-button"] button'
        ];
        for (const selector of checkoutSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                checkout = element.textContent.trim();
                console.log('購入状態取得成功:', checkout, 'セレクター:', selector);
                break;
            }
        }
        if (!checkout) console.log('購入状態取得失敗');
        
        // 出品者コード
        let sellerCode = '';
        const sellerLinkSelectors = [
            '#main a[data-location="item_details:seller_info"]',
            'a[data-location="item_details:seller_info"]'
        ];
        for (const selector of sellerLinkSelectors) {
            const element = doc.querySelector(selector);
            if (element && element.href) {
                const sellerHrefArray = element.href.split('/');
                sellerCode = sellerHrefArray[sellerHrefArray.length-1];
                console.log('出品者コード取得成功:', sellerCode);
                break;
            }
        }
        if (!sellerCode) console.log('出品者コード取得失敗');
        
        // 画像を取得（複数のセレクターを試行）
        const images = [];
        const imageSelectors = [
            '#main .slick-vertical .slick-list .slick-slide img',
            '.slick-vertical .slick-list .slick-slide img',
            '.slick-slide img',
            '#main img[src*="photos"]',
            'img[src*="photos"]'
        ];
        
        for (const selector of imageSelectors) {
            const imageElements = doc.querySelectorAll(selector);
            if (imageElements.length > 0) {
                imageElements.forEach(img => {
                    if (img.src && img.src.includes('photos')) {
                        images.push(img.src);
                    }
                });
                if (images.length > 0) {
                    console.log('画像取得成功:', images.length + '枚', 'セレクター:', selector);
                    break;
                }
            }
        }
        if (images.length === 0) console.log('画像取得失敗');
        
        const result = {
            seller,
            productInfo,
            description,
            checkout,
            sellerCode,
            category,
            brand,
            images: images.length > 0 ? images : null
        };
        
        console.log('詳細情報取得結果:', result);
        return result;
    } catch (error) {
        console.error('詳細ページ取得エラー:', error);
        return {
            seller: '',
            productInfo: '',
            description: '',
            checkout: '',
            sellerCode: '',
            category: '',
            brand: '',
            images: null
        };
    }
}

// 商品データ保存
async function saveProductData(productData, fetchDetails = false) {
    try {
        console.log('saveProductData開始:', productData);
        
        console.log('Supabase初期化中...');
        const supabase = await initSupabase();
        console.log('Supabaseクライアント:', !!supabase);
        
        if (!supabase) {
            console.error('Supabase初期化失敗。詳細チェック:', {
                supabaseLibrary: !!window.supabase,
                cachedConfig: cachedConfig,
                supabaseClient: supabaseClient
            });
            throw new Error('Supabaseクライアントが初期化されていません。設定を確認してください。');
        }
        
        console.log('設定チェック:', {
            configExists: !!window.RESEARCH_TOOL_CONFIG,
            tableNamesExists: !!(window.RESEARCH_TOOL_CONFIG && window.RESEARCH_TOOL_CONFIG.TABLE_NAMES),
            config: window.RESEARCH_TOOL_CONFIG
        });
        
        if (!window.RESEARCH_TOOL_CONFIG || !window.RESEARCH_TOOL_CONFIG.TABLE_NAMES) {
            console.error('設定オブジェクト:', window.RESEARCH_TOOL_CONFIG);
            throw new Error('設定が読み込まれていません。ページを再読み込みしてください。');
        }
        
        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        
        // 詳細情報を取得する場合
        let finalProductData = { ...productData };
        if (fetchDetails && productData.url) {
            console.log('詳細情報を取得中...');
            const detailedInfo = await fetchDetailedProductInfo(productData.url);
            
            // 詳細情報でデータを補完
            finalProductData = {
                ...finalProductData,
                seller: detailedInfo.seller || finalProductData.seller,
                productInfo: detailedInfo.productInfo || finalProductData.productInfo,
                description: detailedInfo.description || finalProductData.description,
                checkout: detailedInfo.checkout || finalProductData.checkout,
                sellerCode: detailedInfo.sellerCode || finalProductData.sellerCode,
                category: detailedInfo.category || finalProductData.category || '',
                brand: detailedInfo.brand || finalProductData.brand || '',
                images: detailedInfo.images || finalProductData.images
            };
            console.log('詳細情報取得完了:', detailedInfo);
        }
        
        const numericPrice = parseInt(finalProductData.price.toString().replace(/[¥,]/g, '')) || 0;
        
        // 出品価格計算
        const listingPrice = await calculateListingPrice(numericPrice);
        
        // キーワードフィルタリング
        const isFiltered = await checkKeywordFilter(
            finalProductData.title || '', 
            finalProductData.description || ''
        );
        
        // データベースに保存
        const saveData = {
            url: finalProductData.url,
            title: finalProductData.title,
            seller_name: finalProductData.seller,
            price: numericPrice,
            images: finalProductData.images,
            product_condition: finalProductData.productInfo,
            description: finalProductData.description,
            checkout_status: finalProductData.checkout,
            seller_code: finalProductData.sellerCode,
            listing_price: listingPrice,
            is_filtered: isFiltered,
            updated_at: new Date().toISOString()
        };
        
        // カテゴリとブランド情報があれば追加（description フィールドに含める）
        if (finalProductData.category || finalProductData.brand) {
            let additionalInfo = '';
            if (finalProductData.category) {
                additionalInfo += `【カテゴリ】${finalProductData.category}\n`;
            }
            if (finalProductData.brand) {
                additionalInfo += `【ブランド】${finalProductData.brand}\n`;
            }
            saveData.description = additionalInfo + (saveData.description || '');
        }
        
        const { data, error } = await supabase
            .from(TABLE_NAMES.PRODUCTS)
            .upsert(saveData, {
                onConflict: 'url'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            id: data.id,
            listingPrice,
            isFiltered,
            detailedInfo: fetchDetails ? true : false,
            productData: data
        };
    } catch (error) {
        console.error('商品データ保存エラー:', error);
        console.error('エラーの詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return {
            success: false,
            error: error.message
        };
    }
}

// CSV機能は管理画面で提供（拡張機能からは削除）

// 出品用商品データ保存
async function saveProductForListing(productData, fetchDetails = false) {
    try {
        const supabase = await initSupabase();
        if (!supabase) {
            throw new Error('Supabaseクライアントが初期化されていません。設定を確認してください。');
        }
        
        if (!window.RESEARCH_TOOL_CONFIG || !window.RESEARCH_TOOL_CONFIG.TABLE_NAMES) {
            console.error('設定オブジェクト:', window.RESEARCH_TOOL_CONFIG);
            throw new Error('設定が読み込まれていません。ページを再読み込みしてください。');
        }
        
        const { TABLE_NAMES } = window.RESEARCH_TOOL_CONFIG;
        
        // 詳細情報を取得する場合
        let finalProductData = { ...productData };
        if (fetchDetails && productData.url) {
            console.log('出品用：詳細情報を取得中...');
            const detailedInfo = await fetchDetailedProductInfo(productData.url);
            
            // 詳細情報でデータを補完
            finalProductData = {
                ...finalProductData,
                seller: detailedInfo.seller || finalProductData.seller,
                productInfo: detailedInfo.productInfo || finalProductData.productInfo,
                description: detailedInfo.description || finalProductData.description,
                checkout: detailedInfo.checkout || finalProductData.checkout,
                sellerCode: detailedInfo.sellerCode || finalProductData.sellerCode,
                category: detailedInfo.category || finalProductData.category || '',
                brand: detailedInfo.brand || finalProductData.brand || '',
                images: detailedInfo.images || finalProductData.images
            };
            console.log('出品用：詳細情報取得完了:', detailedInfo);
        }
        
        const numericPrice = parseInt(finalProductData.price.toString().replace(/[¥,]/g, '')) || 0;
        
        // 出品価格計算
        const listingPrice = await calculateListingPrice(numericPrice);
        
        // キーワードフィルタリング
        const isFiltered = await checkKeywordFilter(
            finalProductData.title || '', 
            finalProductData.description || ''
        );
        
        // Amazon出品用データを生成
        const amazonData = generateAmazonListingData(finalProductData, listingPrice);
        
        // データベース保存用データ
        const saveData = {
            url: finalProductData.url,
            title: finalProductData.title,
            seller_name: finalProductData.seller,
            price: numericPrice,
            images: finalProductData.images,
            product_condition: finalProductData.productInfo,
            description: finalProductData.description,
            checkout_status: finalProductData.checkout,
            seller_code: finalProductData.sellerCode,
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
            amazon_main_image_url: finalProductData.images?.[0],
            amazon_other_image_urls: finalProductData.images?.slice(1).join(','),
            amazon_status: isFiltered ? 'filtered' : 'ready',
            amazon_profit_margin: listingPrice > 0 ? ((listingPrice - numericPrice) / listingPrice * 100) : 0,
            amazon_roi: numericPrice > 0 ? ((listingPrice - numericPrice) / numericPrice * 100) : 0,
            
            updated_at: new Date().toISOString()
        };
        
        // カテゴリとブランド情報があれば追加（description フィールドに含める）
        if (finalProductData.category || finalProductData.brand) {
            let additionalInfo = '';
            if (finalProductData.category) {
                additionalInfo += `【カテゴリ】${finalProductData.category}\n`;
            }
            if (finalProductData.brand) {
                additionalInfo += `【ブランド】${finalProductData.brand}\n`;
            }
            saveData.description = additionalInfo + (saveData.description || '');
            
            // Amazon用の説明文にも追加
            saveData.amazon_description = additionalInfo + (saveData.amazon_description || '');
        }
        
        // データベースに保存
        const { data, error } = await supabase
            .from(TABLE_NAMES.PRODUCTS)
            .upsert(saveData, {
                onConflict: 'url'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            id: data.id,
            listingPrice,
            isFiltered,
            amazonData,
            detailedInfo: fetchDetails ? true : false
        };
    } catch (error) {
        console.error('出品用商品データ保存エラー:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Amazon出品用データ生成
function generateAmazonListingData(productData, listingPrice) {
    const title = titleConvert(productData.title || '');
    
    // 商品状態のマッピング
    const conditionMapping = {
        '新品、未使用': 'New',
        '未使用に近い': 'Used - Like New',
        '目立った傷や汚れなし': 'Used - Very Good',
        'やや傷や汚れあり': 'Used - Good',
        '傷や汚れあり': 'Used - Acceptable',
        '全体的に状態が悪い': 'Used - Acceptable'
    };
    
    const condition = conditionMapping[productData.productInfo] || 'Used - Good';
    
    // 商品説明の生成
    let description = productData.description || '';
    description += `\n\n【商品の状態】${productData.productInfo}\n`;
    description += `【仕入れ価格】¥${parseInt(productData.price).toLocaleString()}\n`;
    description += `【出品価格】¥${listingPrice.toLocaleString()}\n`;
    
    // キーワード生成
    const keywords = title.split(/[\s　]+/).slice(0, 5).join(' ');
    
    // 商品特徴ポイント生成
    const bulletPoints = [
        `商品状態: ${productData.productInfo}`,
        `メルカリから仕入れた商品です`,
        `安心・安全な取引を心がけています`,
        `迅速な発送を心がけています`,
        `ご質問がございましたらお気軽にお問い合わせください`
    ];
    
    return {
        title: title.slice(0, 80), // Amazonタイトルの文字数制限
        description: description.slice(0, 2000), // Amazonの説明文字数制限
        condition: condition,
        conditionNote: productData.productInfo,
        keywords: keywords,
        bulletPoints: bulletPoints
    };
}

// タイトル変換（既存のtitleConvert関数を移植）
function titleConvert(inTitle) {
    // 簡単な文字列クリーニング
    let outTitle = inTitle;
    const removePatterns = [
        'by メルカリ',
        '- メルカリ',
        '【送料無料】',
        '【即日発送】',
        '★',
        '☆',
        '◆',
        '◇',
        '■',
        '□'
    ];
    
    removePatterns.forEach(pattern => {
        outTitle = outTitle.replaceAll(pattern, '');
    });
    
    return outTitle.trim();
}