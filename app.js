// AR應用主程式
let is3DMode = true;
let videoStream = null;
let qrScannerActive = false;
let canvas = null;
let ctx = null;
let arInitialized = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 綁定啟動按鈕
    const startBtn = document.getElementById('start-ar-btn');
    const startScreen = document.getElementById('start-screen');
    
    startBtn.addEventListener('click', async () => {
        // 隱藏啟動畫面，顯示載入畫面
        startScreen.classList.add('hidden');
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.remove('hidden');
        
        try {
            // 請求相機權限
            await requestCameraPermission();
            
            // 啟動AR場景
            await startAR();
        } catch (error) {
            console.error('啟動AR失敗:', error);
            showCameraError();
        }
    });
    
    // 初始化其他功能（不需要相機的部分）
    setupEventListeners();
    setupCapture();
});

// 請求相機權限
async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // 優先使用後置相機
            } 
        });
        // 立即停止流，我們只需要權限
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('相機權限請求失敗:', error);
        throw new Error('無法獲取相機權限。請確保已允許相機訪問權限。');
    }
}

// 啟動AR場景
function startAR() {
    return new Promise((resolve, reject) => {
        if (arInitialized) {
            resolve();
            return;
        }
        
        // 顯示AR容器
        const arContainer = document.getElementById('ar-container');
        arContainer.style.display = 'block';
        
        // 等待AR場景載入
        const scene = document.querySelector('#ar-scene');
        const loadingScreen = document.getElementById('loading-screen');
        
        let resolved = false;
        
        // 處理場景已載入的情況
        if (scene.hasLoaded) {
            // 場景已經載入，直接繼續
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                arInitialized = true;
                
                // 檢查相機是否成功啟動
                setTimeout(() => {
                    if (checkCameraStatus()) {
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    } else {
                        // 如果相機未啟動，等待一下再檢查
                        setTimeout(() => {
                            if (checkCameraStatus() && !resolved) {
                                resolved = true;
                                resolve();
                            }
                        }, 2000);
                    }
                }, 1000);
            }, 500);
        } else {
            // 監聽場景載入事件
            scene.addEventListener('loaded', () => {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    arInitialized = true;
                    
                    // 檢查相機是否成功啟動
                    setTimeout(() => {
                        if (checkCameraStatus()) {
                            if (!resolved) {
                                resolved = true;
                                resolve();
                            }
                        } else {
                            // 如果相機未啟動，等待一下再檢查
                            setTimeout(() => {
                                if (checkCameraStatus() && !resolved) {
                                    resolved = true;
                                    resolve();
                                }
                            }, 2000);
                        }
                    }, 1000);
                }, 500);
            }, { once: true });
        }
        
        // 監聽AR系統錯誤
        scene.addEventListener('arjs-video-loaded', () => {
            console.log('AR相機已載入');
            if (!resolved && arInitialized) {
                resolved = true;
                resolve();
            }
        });
        
        scene.addEventListener('arjs-nft-loaded', () => {
            console.log('AR NFT已載入');
        });
        
        // 設置超時
        setTimeout(() => {
            if (!arInitialized && !resolved) {
                resolved = true;
                reject(new Error('AR場景載入超時'));
            }
        }, 15000);
    });
}

// 檢查相機狀態
function checkCameraStatus() {
    const scene = document.querySelector('#ar-scene');
    if (!scene) {
        console.error('AR場景不存在');
        return false;
    }
    
    const arSystem = scene.systems['arjs'];
    
    if (!arSystem) {
        console.error('AR系統未初始化');
        return false;
    }
    
    if (!arSystem._arSource) {
        console.warn('AR相機源未就緒');
        return false;
    }
    
    const video = arSystem._arSource.domElement;
    if (video && video.readyState >= 2) {
        console.log('相機已就緒，readyState:', video.readyState);
        return true;
    } else if (video) {
        console.log('相機正在載入，readyState:', video.readyState);
        return false;
    } else {
        console.warn('視頻元素不存在');
        return false;
    }
}

// 顯示相機錯誤提示
function showCameraError() {
    const startScreen = document.getElementById('start-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const startContent = startScreen.querySelector('.start-content');
    
    loadingScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.innerHTML = `
        <p style="color: #ff6b6b; margin-top: 20px; font-size: 16px;">
            ⚠️ 無法訪問相機<br>
            請確保：
            <br>1. 已允許瀏覽器訪問相機權限
            <br>2. 使用 HTTPS 或 localhost
            <br>3. 設備支持相機功能
        </p>
    `;
    
    // 移除舊的錯誤消息
    const oldError = startContent.querySelector('.error-message');
    if (oldError) {
        oldError.remove();
    }
    
    startContent.appendChild(errorMsg);
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

