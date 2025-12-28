# 使用指南

## 快速開始

### 1. 啟動本地服務器

由於AR功能需要HTTPS或localhost環境，請使用以下方式啟動：

**選項A：使用Node.js (推薦)**
```bash
npm install
npm start
```

**選項B：使用Python**
```bash
python -m http.server 8000
```

**選項C：使用VS Code Live Server**
- 安裝Live Server擴展
- 右鍵點擊 `index.html` → "Open with Live Server"

### 2. 準備AR標記

1. 下載Hiro標記圖：
   - 訪問：https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg
   - 打印標記圖（建議A4大小）

2. 或使用自定義標記：
   - 訪問AR.js Marker Generator：https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
   - 生成並下載自定義標記

### 3. 準備3D模型和圖片

**3D模型：**
- 將GLTF格式的3D模型（`.glb`或`.gltf`）放入 `models/` 目錄
- 在 `index.html` 中更新模型路徑（第74行）

**2D圖示：**
- 將圖片文件放入 `images/` 目錄
- 在 `index.html` 中更新圖片路徑（第75行）

### 4. 生成QR碼

1. 打開 `generate-qr.html` 在瀏覽器中
2. 輸入您的網站URL或文字內容
3. 點擊「生成QR碼」
4. 下載QR碼圖片並打印或分享

### 5. 使用AR功能

1. **在手機上打開網站**
   - 確保手機和電腦在同一網絡
   - 訪問：`http://[您的IP地址]:8000`

2. **授予相機權限**
   - 首次使用時，瀏覽器會請求相機權限
   - 點擊「允許」

3. **掃描AR標記**
   - 將手機相機對準打印的Hiro標記
   - 等待3D模型或2D圖示出現

4. **互動操作**
   - **切換模式**：在3D模型和2D圖示之間切換
   - **拍照**：點擊「拍照」按鈕或AR場景中的藍色按鈕
   - **掃描QR碼**：點擊「掃描QR碼」按鈕，對準QR碼掃描

## 功能說明

### 📷 拍照功能
- 點擊「拍照」按鈕捕捉當前AR場景
- 可以保存到手機相冊
- 支持分享功能（如果瀏覽器支持）

### 🔍 QR碼掃描
- 點擊「掃描QR碼」按鈕
- 將QR碼對準掃描框
- 掃描成功後會顯示QR碼內容

### 🎮 模式切換
- 在3D模型和2D圖示之間切換
- 3D模型會自動旋轉動畫
- 2D圖示靜態顯示

## 常見問題

### Q: 為什麼看不到AR內容？
A: 
- 確認使用HTTPS或localhost
- 檢查是否授予相機權限
- 確保標記圖清晰、光線充足
- 檢查瀏覽器控制台是否有錯誤

### Q: 3D模型無法載入？
A:
- 確認模型文件路徑正確
- 檢查模型格式是否為GLTF/GLB
- 確認模型文件大小不超過5MB
- 查看瀏覽器控制台錯誤信息

### Q: 拍照功能不工作？
A:
- 確認瀏覽器支持Canvas API
- 檢查是否有足夠的內存空間
- 嘗試刷新頁面

### Q: 如何在手機上訪問？
A:
1. 確保手機和電腦在同一WiFi網絡
2. 在電腦上查看您的IP地址：
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. 在手機瀏覽器中訪問：`http://[IP地址]:8000`

## 進階配置

### 自定義AR標記
1. 使用AR.js Marker Generator生成標記
2. 下載生成的`.patt`文件
3. 在 `index.html` 中修改標記配置：
```html
<a-marker id="marker" type="pattern" url="path/to/your-pattern.patt">
```

### 調整3D模型大小和位置
在 `index.html` 中修改模型屬性：
```html
<a-entity 
    id="model-3d" 
    gltf-model="#model" 
    scale="0.5 0.5 0.5"    <!-- 調整大小 -->
    position="0 0 0"        <!-- 調整位置 -->
    rotation="0 0 0">       <!-- 調整旋轉 -->
</a-entity>
```

### 修改動畫效果
修改 `animation` 屬性：
```html
animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"
```
- `property`: 動畫屬性（rotation, position, scale等）
- `to`: 目標值
- `loop`: 是否循環
- `dur`: 持續時間（毫秒）

## 技術支持

如遇到問題，請檢查：
1. 瀏覽器控制台的錯誤信息
2. 網絡連接是否正常
3. 文件路徑是否正確
4. 瀏覽器兼容性（推薦Chrome）

