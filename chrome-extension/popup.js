document.addEventListener('DOMContentLoaded', function() {
    // 画像スライドショーの初期化
    initImageSlideshow();
    
    // 字幕表示の初期化
    initSubtitleDisplay();
    
    // 管理画面を開く
    document.getElementById('adminBtn').addEventListener('click', function() {
        const url = 'https://mercari-listing-tool-admin.vercel.app';
        chrome.tabs.create({ url: url });
    });
});

// 画像スライドショー機能
function initImageSlideshow() {
    const imageElement = document.getElementById('currentImage');
    const imagePath = '/Users/kurosawaryoufutoshi/MyDocument/study/youtubekirinuki/output/user_uploads/naganomei';
    
    // 画像ファイル名のリスト（実際の画像に合わせて調整）
    const imageFiles = [
        '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
        '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg'
    ];
    
    let currentIndex = 0;
    
    // 最初の画像を表示
    if (imageFiles.length > 0) {
        imageElement.src = `file://${imagePath}/${imageFiles[0]}`;
        imageElement.onerror = function() {
            // ファイルが見つからない場合のフォールバック
            imageElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuOBrueUu+WDj+OBjOimi+OBpOOBi+OCiuOBvuOBm+OCkzwvdGV4dD48L3N2Zz4=';
        };
    }
    
    // 5秒ごとに画像を切り替え
    setInterval(function() {
        if (imageFiles.length > 0) {
            currentIndex = (currentIndex + 1) % imageFiles.length;
            imageElement.style.opacity = '0';
            
            setTimeout(function() {
                imageElement.src = `file://${imagePath}/${imageFiles[currentIndex]}`;
                imageElement.style.opacity = '1';
            }, 250);
        }
    }, 5000);
}

// 字幕表示機能
function initSubtitleDisplay() {
    const subtitleElement = document.getElementById('subtitleDisplay');
    
    // サンプル字幕データ
    const subtitles = [
        'メルカリリサーチツールで効率的な商品調査',
        'データ収集から分析まで一括管理',
        '売上向上をサポートする便利機能',
        '簡単操作で誰でも使える設計',
        'リアルタイムで市場動向をチェック'
    ];
    
    let currentSubtitleIndex = 0;
    
    // 最初の字幕を表示
    if (subtitles.length > 0) {
        subtitleElement.textContent = subtitles[0];
    }
    
    // 5秒ごとに字幕を切り替え（画像と同期）
    setInterval(function() {
        if (subtitles.length > 0) {
            currentSubtitleIndex = (currentSubtitleIndex + 1) % subtitles.length;
            subtitleElement.style.opacity = '0.5';
            
            setTimeout(function() {
                subtitleElement.textContent = subtitles[currentSubtitleIndex];
                subtitleElement.style.opacity = '1';
            }, 250);
        }
    }, 5000);
}