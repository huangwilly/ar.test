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

// 請求相機權限（僅用於觸發瀏覽器權限對話框）
async function requestCameraPermission() {
    try {
        // 只請求權限但不保留流，AR.js 會自己管理相機
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // 優先使用後置相機
            } 
        });
        // 短暫延遲後停止，確保權限已記錄
        await new Promise(resolve => setTimeout(resolve, 100));
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
        
        // 顯示AR容器（必須在顯示後才能初始化AR）
        const arContainer = document.getElementById('ar-container');
        arContainer.style.display = 'block';
        arContainer.style.visibility = 'visible';
        
        // 強制重繪
        void arContainer.offsetHeight;
        
        // 等待下一幀，確保DOM已更新
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
            // 等待AR場景載入
            const scene = document.querySelector('#ar-scene');
            const loadingScreen = document.getElementById('loading-screen');
            
            if (!scene) {
                reject(new Error('AR場景不存在'));
                return;
            }
            
            let resolved = false;
            
            // 監聽AR系統相機載入事件
            const onVideoLoaded = () => {
                console.log('✅ AR相機視頻已載入');
                setTimeout(() => {
                    if (checkCameraStatus()) {
                        loadingScreen.classList.add('hidden');
                        arInitialized = true;
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    }
                }, 500);
            };
            
            // 監聽AR系統NFT載入
            const onNFTLoaded = () => {
                console.log('✅ AR NFT已載入');
            };
            
            scene.addEventListener('arjs-video-loaded', onVideoLoaded);
            scene.addEventListener('arjs-nft-loaded', onNFTLoaded);
            
            // 監聽場景載入
            const onSceneLoaded = () => {
                console.log('✅ AR場景已載入');
                
                // 等待AR系統初始化
                setTimeout(() => {
                    const arSystem = scene.systems['arjs'];
                    if (arSystem) {
                        console.log('✅ AR系統已初始化');
                        
                        // 檢查相機源
                        const checkInterval = setInterval(() => {
                            if (arSystem._arSource) {
                                const video = arSystem._arSource.domElement;
                                if (video) {
                                    console.log('✅ 相機視頻元素已創建, readyState:', video.readyState);
                                    
                                    if (video.readyState >= 2) {
                                        clearInterval(checkInterval);
                                        loadingScreen.classList.add('hidden');
                                        arInitialized = true;
                                        showNotification('AR已啟動！', 'success');
                                        if (!resolved) {
                                            resolved = true;
                                            resolve();
                                        }
                                    } else {
                                        // 監聽視頻就緒事件
                                        video.addEventListener('loadeddata', () => {
                                            console.log('✅ 相機視頻數據已載入');
                                            clearInterval(checkInterval);
                                            loadingScreen.classList.add('hidden');
                                            arInitialized = true;
                                            showNotification('AR已啟動！', 'success');
                                            if (!resolved) {
                                                resolved = true;
                                                resolve();
                                            }
                                        }, { once: true });
                                        
                                        video.addEventListener('error', (e) => {
                                            console.error('❌ 相機視頻載入錯誤:', e);
                                            clearInterval(checkInterval);
                                            if (!resolved) {
                                                resolved = true;
                                                reject(new Error('相機視頻載入失敗'));
                                            }
                                        }, { once: true });
                                    }
                                }
                            }
                        }, 200);
                        
                        // 設置最大等待時間
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            if (!resolved) {
                                console.warn('⚠️ 相機初始化超時，但繼續嘗試');
                                // 即使超時也嘗試繼續
                                loadingScreen.classList.add('hidden');
                                arInitialized = true;
                                resolved = true;
                                resolve();
                            }
                        }, 10000);
                    } else {
                        console.error('❌ AR系統未初始化');
                        // 等待AR系統初始化
                        const waitForSystem = setInterval(() => {
                            const arSystem = scene.systems['arjs'];
                            if (arSystem) {
                                clearInterval(waitForSystem);
                                console.log('✅ AR系統已初始化（延遲）');
                                // 重新檢查相機
                                setTimeout(() => {
                                    const checkStatus = () => {
                                        if (arSystem._arSource) {
                                            const video = arSystem._arSource.domElement;
                                            if (video && video.readyState >= 2 && video.videoWidth > 0) {
                                                loadingScreen.classList.add('hidden');
                                                arInitialized = true;
                                                showNotification('AR已啟動！', 'success');
                                                if (!resolved) {
                                                    resolved = true;
                                                    resolve();
                                                }
                                                return;
                                            }
                                        }
                                        setTimeout(checkStatus, 500);
                                    };
                                    checkStatus();
                                }, 1000);
                            }
                        }, 100);
                        
                        setTimeout(() => {
                            clearInterval(waitForSystem);
                            if (!resolved) {
                                resolved = true;
                                reject(new Error('AR系統初始化失敗'));
                            }
                        }, 5000);
                    }
                }, 1000);
            };
            
            if (scene.hasLoaded) {
                onSceneLoaded();
            } else {
                scene.addEventListener('loaded', onSceneLoaded, { once: true });
            }
            
            // 設置總超時
            setTimeout(() => {
                if (!resolved) {
                    // 在超時前最後檢查一次
                    console.log('🔍 超時前最後檢查相機狀態...');
                    const arSystem = scene.systems['arjs'];
                    if (arSystem && arSystem._arSource) {
                        const video = arSystem._arSource.domElement;
                        if (video) {
                            console.log('📊 視頻狀態:', {
                                readyState: video.readyState,
                                videoWidth: video.videoWidth,
                                videoHeight: video.videoHeight,
                                paused: video.paused,
                                muted: video.muted,
                                srcObject: !!video.srcObject
                            });
                        }
                    }
                    resolved = true;
                    reject(new Error('AR場景載入超時（15秒）'));
                }
            }, 15000);
            });
        });
    });
}

// 檢查相機狀態
function checkCameraStatus() {
    const scene = document.querySelector('#ar-scene');
    if (!scene) {
        console.error('❌ AR場景不存在');
        return false;
    }
    
    const arSystem = scene.systems['arjs'];
    
    if (!arSystem) {
        console.error('❌ AR系統未初始化');
        return false;
    }
    
    if (!arSystem._arSource) {
        console.warn('⚠️ AR相機源未就緒');
        return false;
    }
    
    const video = arSystem._arSource.domElement;
    if (video) {
        console.log('📹 相機視頻狀態 - readyState:', video.readyState, 'videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight);
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ 相機已就緒並有畫面');
            return true;
        } else if (video.readyState >= 2) {
            console.log('⚠️ 相機就緒但畫面尺寸為0');
            return false;
        } else {
            console.log('⏳ 相機正在載入');
            return false;
        }
    } else {
        console.warn('⚠️ 視頻元素不存在');
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

