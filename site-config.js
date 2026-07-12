/* ============================================================
   阿卡貓 HakkaNeko 網站 — 全站共用設定檔
   ============================================================
   這裡放的是「全站每一頁都可能用到、且你會不時手動更新」的設定，
   跟其他 xxx-config.js（只有特定分頁需要）不一樣，這一份會被
   所有 10 個頁面載入。

   之後要做的事，通通只需要改這個檔案：
   - 表單連結換了 → 改 window.FORM_URLS
   - 暫停/開放接案 → 改 window.IS_COMMISSION_OPEN（true=開放，false=暫停）
   ============================================================ */
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
