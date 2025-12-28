# AR 掃描體驗網站

這是一個基於Web的AR（擴增實境）掃描應用，讓使用者可以通過手機掃描QR碼來體驗3D模型和2D圖示，並提供拍照功能記錄互動體驗。

## 功能特色

- 📱 **QR碼掃描**：掃描QR碼觸發AR體驗
- 🎮 **3D模型顯示**：支持顯示3D模型（GLTF格式）
- 🖼️ **2D圖示顯示**：支持顯示2D圖片
- 📷 **拍照功能**：捕捉AR場景並保存或分享
- 🔄 **模式切換**：在3D和2D模式之間切換
- 📱 **響應式設計**：適配各種移動設備

## 技術棧

- **AR.js**：Web AR框架
- **Three.js**：3D圖形渲染
- **A-Frame**：Web VR/AR框架
- **jsQR**：QR碼掃描庫

## 使用說明

### 1. 準備工作

1. 確保您有HTTPS環境（AR功能需要HTTPS或localhost）
2. 準備以下資源：
   - 3D模型文件（GLTF格式，放在 `models/` 目錄）
   - 2D圖示圖片（放在 `images/` 目錄）
   - AR標記圖（Hiro標記）

### 2. 安裝和運行

#### 方法一：使用本地服務器（推薦）

```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server -p 8000
```

然後在瀏覽器中訪問：`http://localhost:8000`

#### 方法二：使用VS Code Live Server

1. 安裝Live Server擴展
2. 右鍵點擊 `index.html`，選擇 "Open with Live Server"

### 3. 使用AR功能

1. **打印AR標記**：
   - 下載並打印Hiro標記圖（可在AR.js官網下載）
   - 或使用自定義標記圖

2. **訪問網站**：
   - 在手機瀏覽器中打開網站
   - 允許相機權限

3. **掃描標記**：
   - 將手機相機對準Hiro標記
   - 等待3D模型或2D圖示出現

4. **互動操作**：
   - 點擊「切換模式」按鈕切換3D/2D
   - 點擊「拍照」按鈕或點擊AR場景中的按鈕拍照
   - 點擊「掃描QR碼」按鈕掃描QR碼

## 文件結構

```
.
├── index.html          # 主HTML文件
├── styles.css          # 樣式文件
├── app.js              # 主JavaScript邏輯
├── models/             # 3D模型目錄
│   └── robot.glb       # 示例3D模型
├── images/             # 圖片資源目錄
│   └── icon.png        # 示例2D圖示
└── README.md           # 說明文檔
```

## 自定義配置

### 更換3D模型

1. 將您的GLTF模型文件放入 `models/` 目錄
2. 在 `index.html` 中修改模型路徑：
   ```html
   <a-asset-item id="model" src="models/your-model.glb"></a-asset-item>
   ```

### 更換2D圖示

1. 將圖片放入 `images/` 目錄
2. 在 `index.html` 中修改圖片路徑：
   ```html
   <img id="icon" src="images/your-icon.png" crossorigin="anonymous">
   ```

### 使用自定義AR標記

1. 在AR.js Marker Generator生成自定義標記
2. 在 `index.html` 中修改標記類型：
   ```html
   <a-marker id="marker" type="pattern" url="path/to/your-pattern.patt">
   ```

## 注意事項

- ⚠️ **HTTPS要求**：AR功能需要HTTPS環境（生產環境）或localhost（開發環境）
- 📱 **移動設備**：建議在手機上使用，體驗最佳
- 🎯 **標記識別**：確保標記圖清晰、光線充足
- 📷 **相機權限**：首次使用需要授予相機權限

## 瀏覽器兼容性

- Chrome（推薦）
- Firefox
- Safari（iOS 11+）
- Edge

## 故障排除

### 無法顯示AR內容
- 檢查是否使用HTTPS或localhost
- 確認已授予相機權限
- 檢查標記圖是否清晰可見

### 3D模型無法載入
- 確認模型文件路徑正確
- 檢查模型格式是否為GLTF/GLB
- 查看瀏覽器控制台錯誤信息

### 拍照功能不工作
- 確認瀏覽器支持Canvas API
- 檢查是否有足夠的內存空間

## 授權

MIT License

## 貢獻

歡迎提交Issue和Pull Request！

