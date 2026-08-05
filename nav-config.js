/* ============================================================
   阿卡貓 HakkaNeko 網站 — 導覽列共用設定
   這是「唯一」需要編輯的導覽列設定檔，所有 10 個頁面的導覽列
   都會由 common.js 讀取這份設定，在載入時自動產生。

   ⚠️ 想暫時隱藏某個分頁時，不需要跑去 10 個 html 檔一個一個改，
   只要把該項目的 enabled 改成 false 即可（如下方「聯名模板」示範）。
   想恢復只要改回 true。這個檔案存出去記得要放在網站根目錄，
   並在每個 html 的 <script src="common.js"> 之前引入：
       <script src="nav-config.js"></script>

   ⚠️ v56 乾淨網址（clean URL）調整：
   每個分頁的實際檔案已經從「資料夾/檔名.html」改成「資料夾/index.html」，
   所以 href 一律只寫到資料夾（結尾有斜線、不含檔名），瀏覽器網址列
   看到的就會是 https://hakkanekolive2d.cc/commission/rules/ 這種
   乾淨格式，而不是又長又醜的 .../commission/rules/rules.html。
   首頁比較特別：href 留空字串 ''，withBase('') 就等於直接跳回
   window.SITE_BASE 本身（也就是網站根目錄），呈現最單純的
   https://hakkanekolive2d.cc/。

   欄位說明：
   - id        : 對應「資料夾名稱」（不是檔名，檔名現在都統一是
                 index.html 了），也用來判斷目前所在分頁
   - href      : 點擊後要跳轉的資料夾路徑，一律用「從網站根目錄算起」、
                 結尾帶斜線、不含檔名的寫法（例如 'commission/rules/'），
                 首頁例外寫成空字串 ''。不要自己加 ../ 之類的相對符號
                 ——nav-render.js 會自動依照目前頁面所在的深度，補上
                 正確的 ../ 前綴（靠每個頁面 <body> 開頭的
                 window.SITE_BASE 變數判斷）。
   - icon      : Font Awesome icon class（不含 fa-solid）
   - label     : 對應 locales/*.js 裡的翻譯 key（data-i18n）
   - text      : 語言包尚未套用前的預設顯示文字（繁中，避免閃爍空白）
   - color     : （僅下拉選單子項目使用）icon 顏色 class
   - enabled   : false = 從導覽列隱藏該分頁（頁面檔案本身不會被刪除，
                 直接輸入網址仍可以開啟；如果想連直接輸入網址都一併
                 擋掉，nav-render.js 也會在頁面載入時檢查這個開關，
                 是 false 的話會自動導回首頁，見該檔案內的說明）
   - dropdown  : true 代表這是一個下拉選單群組，內含 items 陣列
   ============================================================ */
window.NAV_CONFIG = [
    { id: 'intro',   href: '',        icon: 'fa-user',    label: 'nav_intro',   text: '自我介紹', enabled: true },
    { id: 'artists', href: 'artists/', icon: 'fa-palette', label: 'nav_artists', text: '合作繪師', enabled: true },

    // Live2D 委託 下拉選單
    {
        id: 'comm', dropdown: true, icon: 'fa-file-contract', label: 'nav_commission', text: '委託資訊', enabled: true,
        items: [
            { id: 'rules',    href: 'commission/rules/',    icon: 'fa-book-open',           color: 'text-blue-400',    label: 'nav_rules',    text: '流程與規範', enabled: true },
            { id: 'core',     href: 'commission/core/',     icon: 'fa-wand-magic-sparkles', color: 'text-purple-400',  label: 'nav_core',     text: 'V皮設計',    enabled: true },
            { id: 'anim',     href: 'commission/anim/',     icon: 'fa-film',                color: 'text-pink-400',    label: 'nav_anim',     text: '動畫設計',    enabled: true },
            // 範例：想暫時關閉「聯名模板」分頁，只要把下面這行改成 enabled: false
            { id: 'template', href: 'commission/template/', icon: 'fa-shirt',               color: 'text-fuchsia-400', label: 'nav_template', text: '聯名模板',   enabled: false },
        ]
    },

    // 創作空間 下拉選單
    {
        id: 'creative', dropdown: true, icon: 'fa-star', label: 'nav_creative', text: '創作空間', enabled: true,
        items: [
            // v56：live2d-demo → model（資料夾與 id 都改名，網址原本的
            // 「live2d-demo」稱呼不夠精確，改成「模型展示」更貼近內容；
            // 暫時仍是 enabled:false 關閉中）
            { id: 'model',     href: 'creative/model/',     icon: 'fa-person-rays', color: 'text-blue-400',   label: 'nav_live2d_demo', text: '模型展示', enabled: false },
            { id: 'portfolio', href: 'creative/portfolio/', icon: 'fa-photo-film',  color: 'text-emerald-400', label: 'nav_portfolio',   text: '作品展示', enabled: true },
            { id: 'channels',  href: 'creative/channels/',  icon: 'fa-heart',       color: 'text-pink-400',    label: 'nav_channels',    text: '推薦頻道', enabled: true },
            { id: 'fanart',    href: 'creative/fanart/',    icon: 'fa-star',        color: 'text-yellow-400',  label: 'nav_fanart',      text: '二創展示', enabled: true },
        ]
    },
];
