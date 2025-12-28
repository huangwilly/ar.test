// AR應用主程式
let is3DMode = true;
let videoStream = null;
let qrScannerActive = false;
let canvas = null;
let ctx = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // 等待AR場景載入
    const scene = document.querySelector('#ar-scene');
    const loadingScreen = document.getElementById('loading-screen');
    
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1000);
    });

    // 綁定按鈕事件
    setupEventListeners();
    
    // 初始化拍照功能
    setupCapture();
}

function setupEventListeners() {
    // 切換模式按鈕
    document.getElementById('switch-mode-btn').addEventListener('click', switchMode);
    
    // 拍照按鈕
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    
    // QR碼掃描按鈕
    document.getElementById('qr-scan-btn').addEventListener('click', toggleQRScanner);
    
    // 關閉QR掃描器
    document.getElementById('close-scanner-btn').addEventListener('click', toggleQRScanner);
    
    // 照片預覽控制
    document.getElementById('save-photo-btn').addEventListener('click', savePhoto);
    document.getElementById('share-photo-btn').addEventListener('click', sharePhoto);
    document.getElementById('close-preview-btn').addEventListener('click', closePreview);
    
    // AR標記物點擊事件
    const marker = document.querySelector('#marker');
    if (marker) {
        marker.addEventListener('click', (e) => {
            if (e.detail.intersection) {
                capturePhoto();
            }
        });
    }
}

function switchMode() {
    is3DMode = !is3DMode;
    const model3D = document.getElementById('model-3d');
    const image2D = document.getElementById('image-2d');
    
    if (is3DMode) {
        model3D.setAttribute('visible', 'true');
        image2D.setAttribute('visible', 'false');
    } else {
        model3D.setAttribute('visible', 'false');
        image2D.setAttribute('visible', 'true');
    }
    
    // 顯示提示
    showNotification(is3DMode ? '已切換到3D模式' : '已切換到2D模式');
}

function setupCapture() {
    // 創建canvas用於拍照
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
}

function capturePhoto() {
    const scene = document.querySelector('#ar-scene');
    const camera = scene.querySelector('a-camera');
    
    if (!camera) {
        showNotification('無法獲取相機', 'error');
        return;
    }
    
    // 獲取AR場景的canvas
    const arCanvas = scene.canvas;
    if (!arCanvas) {
        showNotification('無法獲取AR畫面', 'error');
        return;
    }
    
    // 設置canvas尺寸
    canvas.width = arCanvas.width;
    canvas.height = arCanvas.height;
    
    // 繪製當前畫面到canvas
    ctx.drawImage(arCanvas, 0, 0);
    
    // 轉換為圖片
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        showPhotoPreview(url);
    }, 'image/png');
}

function showPhotoPreview(imageUrl) {
    const preview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    
    previewImage.src = imageUrl;
    preview.classList.remove('hidden');
    
    // 保存圖片URL供後續使用
    previewImage.dataset.url = imageUrl;
}

function closePreview() {
    const preview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    
    // 釋放URL對象
    if (previewImage.dataset.url) {
        URL.revokeObjectURL(previewImage.dataset.url);
        delete previewImage.dataset.url;
    }
    
    preview.classList.add('hidden');
}

function savePhoto() {
    const previewImage = document.getElementById('preview-image');
    const url = previewImage.dataset.url || previewImage.src;
    
    if (!url) return;
    
    // 創建下載鏈接
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar-photo-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('照片已保存！');
}

async function sharePhoto() {
    const previewImage = document.getElementById('preview-image');
    const url = previewImage.dataset.url || previewImage.src;
    
    if (!url) return;
    
    // 檢查是否支持Web Share API
    if (navigator.share) {
        try {
            // 將URL轉換為Blob
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], `ar-photo-${Date.now()}.png`, { type: 'image/png' });
            
            await navigator.share({
                title: '我的AR體驗照片',
                files: [file]
            });
            
            showNotification('照片已分享！');
        } catch (error) {
            console.error('分享失敗:', error);
            showNotification('分享功能不可用', 'error');
        }
    } else {
        // 降級方案：複製圖片到剪貼板
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showNotification('圖片已複製到剪貼板！');
        } catch (error) {
            console.error('複製失敗:', error);
            showNotification('分享功能不可用', 'error');
        }
    }
}

function toggleQRScanner() {
    const scanner = document.getElementById('qr-scanner');
    qrScannerActive = !qrScannerActive;
    
    if (qrScannerActive) {
        scanner.classList.remove('hidden');
        startQRScanning();
    } else {
        scanner.classList.add('hidden');
        stopQRScanning();
    }
}

function startQRScanning() {
    // 獲取AR場景的視頻流
    const scene = document.querySelector('#ar-scene');
    const arSystem = scene.systems['arjs'];
    
    if (!arSystem || !arSystem._arSource) {
        showNotification('無法訪問相機', 'error');
        return;
    }
    
    const video = arSystem._arSource.domElement;
    
    // 創建canvas用於QR碼檢測
    const qrCanvas = document.createElement('canvas');
    const qrCtx = qrCanvas.getContext('2d');
    qrCanvas.width = video.videoWidth || 640;
    qrCanvas.height = video.videoHeight || 480;
    
    function scanQR() {
        if (!qrScannerActive) return;
        
        qrCtx.drawImage(video, 0, 0, qrCanvas.width, qrCanvas.height);
        const imageData = qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            handleQRCodeDetected(code.data);
        } else {
            requestAnimationFrame(scanQR);
        }
    }
    
    scanQR();
}

function stopQRScanning() {
    // QR掃描已停止
}

function handleQRCodeDetected(data) {
    showNotification(`掃描到QR碼: ${data}`);
    toggleQRScanner(); // 關閉掃描器
    
    // 這裡可以根據QR碼內容執行相應操作
    // 例如：載入不同的3D模型、顯示特定內容等
    console.log('QR碼內容:', data);
}

function showNotification(message, type = 'success') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(76, 175, 80, 0.9)'};
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        z-index: 1000;
        font-size: 16px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

