# 數學冒險樂園（math-fun-kids）

這是一個專為 **國小 1-3 年級**設計的網頁數學遊戲。  
不需要安裝套件、不需要建置流程，**點開網址就能直接玩**。

## ▶️ 立即線上遊玩

👉 **[https://xing1217.github.io/math-fun-kids/](https://xing1217.github.io/math-fun-kids/)**

---

## 🎮 遊戲模式

### 1) 加減法闖關（循序漸進）

依照答對題數自動升級：

- **等級 1**：1 位數加減法
- **等級 2**：2 位數加減法
- **等級 3**：3 位數加減法

> 減法題會保證不出現負數答案，降低低年級挫折感。

### 2) 九九乘法練習

- 題目範圍為 `1 × 1` 到 `9 × 9`
- 適合做乘法表反覆練習

---

## ✨ 功能特色

- **兩種模式一鍵切換**（加減法 / 九九乘法）
- **RPG 冒險劇情章節**（隨答對題數推進主線）
- **回合制戰鬥系統**（答對攻擊、答錯受擊、敵人會換階段）
- **角色 HP / 敵人 HP 即時條狀顯示**
- **裝備與能力值面板**（攻擊、防禦、最大 HP、速度）
- **裝備拖曳互動**（背包拖到裝備欄、數值即時變化）
- 分數、等級、連續答對、星星即時顯示
- 內建音效（答對 / 答錯 / 升級）可開關
- **背景音樂（BGM）可開關**
- **自動下一題**可開關，連續練習不間斷
- **觸控數字鍵盤**，手機與平板可直接點按輸入
- **成就徽章系統**（解鎖後會顯示）
- **線上排行榜**（設定 Firebase 後全裝置共享，未設定時退回本機儲存）
- 錯題會立即顯示正確答案
- 支援按 Enter 快速送出答案
- 程式碼內含完整正體中文註解

---

## 🏅 成就徽章（目前版本）

- 🌱 新手啟程：第一次答對題目
- 🔥 連擊高手：連續答對 5 題
- ⭐ 星星收藏家：累積 5 顆星星
- 🚀 闖關達人：加減法升到等級 3
- 🧠 乘法小博士：九九乘法答對 20 題
- 👑 高分王者：分數達到 200 分

---

## 🧠 遊戲規則（簡述）

- 答對：+10 分，連續答對 +1
- 每連續答對 3 題：+1 顆星星 ⭐
- 答錯：-2 分（最低不低於 0），連續答對歸零
- 答對時會對敵人造成傷害；答錯時敵人會反擊扣玩家 HP
- 玩家 HP 歸零時會暫停戰鬥，需重新按「開始遊戲」再出發
- 可隨時切換模式或重設進度
- 可切換自動下一題開關（預設開啟）
- 可隨時切換音效與背景音樂開關

---

## 🏆 排行榜說明

排行榜預設使用 **本機 localStorage**（只有自己的裝置看得到）。
若想讓所有玩家共用同一份線上排行榜，請依下方步驟設定 Firebase。

### 啟用線上排行榜（Firebase Realtime Database）

#### 步驟一：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/) 並以 Google 帳號登入
2. 點選「新增專案」，填入專案名稱後完成建立
3. 在專案總覽左側選單找到「建構」→「**Realtime Database**」
4. 點「建立資料庫」→ 選擇離玩家最近的地區 → 以「**測試模式**」啟動  
   （測試模式允許任何人讀寫，適合家庭小遊戲；日後可再收緊規則）
5. 資料庫建立後，複製頁面上方的 URL，格式為：  
   `https://YOUR-PROJECT-default-rtdb.REGION.firebasedatabase.app`  
   （`REGION` 依你選的地區而定，例如 `asia-southeast1`）

#### 步驟二：設定索引（讓依分數排序正常運作）

在 Firebase Console 左側選單開啟 **Realtime Database → 規則（Rules）**，
將內容替換為以下設定後點「發布」：

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true,
      ".indexOn": ["score"]
    }
  }
}
```

#### 步驟三：將資料庫 URL 填入 script.js

打開 `script.js`，找到以下這行（大約在第 84 行附近）：

```js
const FIREBASE_DB_URL = "";
```

將空字串替換成你的資料庫 URL（`REGION` 替換為實際地區），例如：

```js
const FIREBASE_DB_URL = "https://YOUR-PROJECT-default-rtdb.REGION.firebasedatabase.app";
```

儲存後重新整理頁面，排行榜即會自動從 Firebase 載入，所有裝置都能看到同一份排名 🎉

> 若 `FIREBASE_DB_URL` 保持空字串，遊戲仍正常運作，排行榜改存在本機 localStorage。

---

## 🚀 怎麼開起來玩？

### 方式 A：線上直接玩（推薦）

直接點下方網址，不需要安裝任何東西：

👉 **[https://xing1217.github.io/math-fun-kids/](https://xing1217.github.io/math-fun-kids/)**

### 方式 B：下載到本機後開啟

1. 下載此專案的 ZIP 或 Clone 到本機
2. 用瀏覽器開啟專案資料夾內的 `index.html`
3. 按「開始遊戲」就能玩

> ⚠️ 在 GitHub 上直接點 `index.html` 會看到原始碼，請用上方網址或本機開啟。

### 方式 C：使用本機伺服器（可選）

如果你想用網址方式在本機開啟，可以在專案目錄執行：

```bash
python -m http.server 5500
```

然後用瀏覽器開啟：

```text
http://localhost:5500
```

---

## 📁 專案結構

```text
math-fun-kids/
├─ index.html                   # 遊戲頁面結構
├─ style.css                    # 遊戲畫面樣式
├─ script.js                    # 遊戲邏輯（含詳細正體中文註解）
├─ .nojekyll                    # 告知 GitHub Pages 不使用 Jekyll
├─ .github/workflows/
│   ├─ deploy.yml               # 自動部署 GitHub Pages
│   └─ release.yml              # 推送 tag 自動建立 Release
└─ README.md                    # 專案說明文件
```

---

## 🛠 首次設定步驟

### 步驟一：啟用 GitHub Pages（只需做一次）

1. 前往 GitHub 專案頁面，點選上方的 **Settings**
2. 左側選單點選 **Pages**
3. 在 **Source** 下拉選單選擇 **GitHub Actions**
4. 儲存後，合併 PR 至 `main` 分支即會自動部署
5. 部署完成後即可用以下網址遊玩：

👉 **[https://xing1217.github.io/math-fun-kids/](https://xing1217.github.io/math-fun-kids/)**

### 步驟二：建立 v1.0 Release（只需做一次）

合併 PR 至 `main` 後，執行以下步驟建立正式 Release：

1. 前往 GitHub 專案頁面，點選上方的 **Actions**
2. 在左側找到「**建立 Release**」工作流程
3. 點選右側的 **Run workflow**
4. 在 `版本號碼` 欄位填入 `v1.0`，點選綠色的 **Run workflow** 按鈕
5. 等待完成後，到 **Releases** 頁面就會看到 v1.0，內含可直接遊玩的網址
