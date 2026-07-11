/* ============================================================
   阿卡貓 HakkaNeko 網站 — 導覽列共用設定
   這是「唯一」需要編輯的導覽列設定檔，所有 10 個頁面的導覽列
   都會由 common.js 讀取這份設定，在載入時自動產生。

   ⚠️ 想暫時隱藏某個分頁時，不需要跑去 10 個 html 檔一個一個改，
   只要把該項目的 enabled 改成 false 即可（如下方「聯名模板」示範）。
   想恢復只要改回 true。這個檔案存出去記得要放在網站根目錄，
   並在每個 html 的 <script src="common.js"> 之前引入：
       <script src="nav-config.js"></script>

   欄位說明：
   - id        : 對應頁面檔名（不含 .html），也用來判斷目前所在分頁
   - href      : 點擊後要跳轉的頁面檔名
   - icon      : Font Awesome icon class（不含 fa-solid）
   - label     : 對應 locales/*.js 裡的翻譯 key（data-i18n）
   - text      : 語言包尚未套用前的預設顯示文字（繁中，避免閃爍空白）
   - color     : （僅下拉選單子項目使用）icon 顏色 class
   - enabled   : false = 從導覽列隱藏該分頁（頁面檔案本身不會被刪除，
                 直接輸入網址仍可以開啟）
   - dropdown  : true 代表這是一個下拉選單群組，內含 items 陣列
   ============================================================ */
window.NAV_CONFIG = [
    { id: 'intro',   href: 'index.html',   icon: 'fa-user',    label: 'nav_intro',   text: '自我介紹', enabled: true },
    { id: 'artists', href: 'artists.html', icon: 'fa-palette', label: 'nav_artists', text: '合作繪師', enabled: true },

    // Live2D 委託 下拉選單
    {
        id: 'comm', dropdown: true, icon: 'fa-file-contract', label: 'nav_commission', text: '委託資訊', enabled: true,
        items: [
            { id: 'rules',    href: 'rules.html',    icon: 'fa-book-open',           color: 'text-blue-400',    label: 'nav_rules',    text: '流程與規範', enabled: true },
            { id: 'core',     href: 'core.html',      icon: 'fa-wand-magic-sparkles', color: 'text-purple-400',  label: 'nav_core',     text: 'V皮設計',    enabled: true },
            { id: 'anim',     href: 'anim.html',      icon: 'fa-film',                color: 'text-pink-400',    label: 'nav_anim',     text: '動畫設計',    enabled: true },
            // 範例：想暫時關閉「聯名模板」分頁，只要把下面這行改成 enabled: false
            { id: 'template', href: 'template.html',  icon: 'fa-shirt',               color: 'text-fuchsia-400', label: 'nav_template', text: '聯名模板',    enabled: true },
        ]
    },

    // 創作空間 下拉選單
    {
        id: 'creative', dropdown: true, icon: 'fa-star', label: 'nav_creative', text: '創作空間', enabled: true,
        items: [
            // live2d-demo 目前暫時關閉（沿用原本的設定）
            { id: 'live2d-demo', href: 'live2d-demo.html', icon: 'fa-person-rays', color: 'text-blue-400',   label: 'nav_live2d_demo', text: '角色互動', enabled: false },
            { id: 'portfolio',   href: 'portfolio.html',   icon: 'fa-photo-film',  color: 'text-emerald-400', label: 'nav_portfolio',   text: '作品展示', enabled: true },
            { id: 'channels',    href: 'channels.html',    icon: 'fa-heart',       color: 'text-pink-400',    label: 'nav_channels',    text: '推薦頻道', enabled: true },
            { id: 'fanart',      href: 'fanart.html',      icon: 'fa-star',        color: 'text-yellow-400',  label: 'nav_fanart',      text: '二創展示', enabled: true },
        ]
    },
];
