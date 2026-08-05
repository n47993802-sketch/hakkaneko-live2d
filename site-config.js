/* ============================================================
   阿卡貓 HakkaNeko 網站 — 全站共用設定檔
   ============================================================
   這裡放的是「全站每一頁都可能用到、且你會不時手動更新」的設定，
   跟其他 xxx-config.js（只有特定分頁需要）不一樣，這一份會被
   所有 10 個頁面載入。

   之後要做的事，通通只需要改這個檔案：
   - 表單連結換了 → 改 window.FORM_URLS
   - 暫停/開放接案 → 改 window.IS_COMMISSION_OPEN（true=開放，false=暫停）
   - 作品展示素材網址前綴變了 → 改 window.ASSET_BASE
   ============================================================ */

// 🖼️ 作品展示／模板展示 素材圖床（獨立 repo：n47993802-sketch/Live2D-）
// 所有作品類素材（動態貼圖、動態Logo、動畫展示封面、聯名模板縮圖）
// 都從這個網址組出來，之後如果整個搬家（換 repo / 換網域），
// 只需要改這一行，不用去每個 xxx-config.js 裡逐一找換。
// 資料夾對應：
//   portfolio/A  → 動態 Logo
//   portfolio/B  → 動態貼圖
//   portfolio/C  → 動畫資訊與演出設計（含 V皮/動畫作品封面）
//   fanart       → 二創展示（由 fanart-render.js 即時列出資料夾內容）
//   template/A   → 聯名模板展示
window.ASSET_BASE = 'https://n47993802-sketch.github.io/Live2D-';

window.FORM_URLS = {
            // 個人委託（VP 模型建模）
            commission_vp:   'https://forms.gle/4C5KzcuAiEAndyMf6',
            // 個人委託（動態貼圖）— 若與 VP 共用同一份表單請填相同網址
            commission_anim: 'https://forms.gle/4C5KzcuAiEAndyMf6',
            // 合作繪師申請
            artists:         'https://forms.gle/a75ybdYE3jNdeGUn9',
            // 二創作品投稿
            fanart:          'https://forms.gle/FTnW6fVrQpXQhqrN6',

            // 英文 / 日文版（若有另外製作多語言表單，填入對應網址；若無則沿用上方連結）
            commission_vp_en:   '',   // 留空 = 自動 fallback 到 commission_vp
            commission_anim_en: '',
            artists_en:         '',
            fanart_en:          '',
        };

// 🔧 開放委託時改為 true，暫停時改為 false
window.IS_COMMISSION_OPEN = true;
