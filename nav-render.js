/* ============================================================
   阿卡貓 HakkaNeko 網站 — 導覽列「同步」渲染器
   ============================================================
   為什麼需要這個檔案？
   - common.js 是在 <body> 最底部才載入（部分頁面甚至還有 defer），
     所以它產生導覽列按鈕的時間點，是在瀏覽器已經畫出一次畫面「之後」。
   - 結果就是：使用者會先看到 <nav id="mainNav"> 是空的一小段時間，
     接著按鈕才「突然」全部跑出來 —— 這就是切換分頁時感覺「閃一下」
     的主要原因之一。
   - 解法：在 <nav> 容器「緊接著」的地方，用一支不延遲（沒有 defer/async）
     的 <script> 立刻把按鈕內容畫出來，讓瀏覽器在第一次繪製畫面時，
     導覽列就已經是完整的，不會有「先空白、後出現」的跳動。

   這個檔案的內容刻意跟 common.js 內建的備援渲染邏輯（renderMainNav）
   保持一模一樣，這樣不管是這支檔案先執行、還是 common.js 的備援
   先執行，畫出來的結果都完全相同，不會有兩邊邏輯不同步的問題。

   載入順序要求（每個頁面都已經照這個順序寫好）：
       <script>window.SITE_BASE = '...';</script>  ← 見下方說明
       <script src="nav-config.js"></script>       ← 先提供 window.NAV_CONFIG
       <script src="nav-render.js"></script>       ← 再用這份設定畫出導覽列

   關於 window.SITE_BASE（資料夾重新分類後新增）：
   - nav-config.js 裡的 href 都是「從網站根目錄算起」的路徑，例如
     'commission/rules/rules.html'。但頁面實際上有兩種深度：
     index.html／artists.html 在根目錄，其餘 8 個頁面都在
     commission/xxx/ 或 creative/xxx/ 底下（多兩層）。
   - 每個頁面的 <body> 一開頭都寫了 window.SITE_BASE：根目錄頁面是
     ''，其餘頁面是 '../../'。這裡產生連結時，一律讀取這個值
     當作前綴，這樣同一份 nav-config.js／nav-render.js 才能讓
     「所有頁面」都連到正確的相對路徑，不用為每個深度各寫一份。
   - 之後如果又新增更深一層的資料夾，切記要同步在該頁面補上
     正確的 window.SITE_BASE（例如三層深就是 '../../../'）。
   ============================================================ */
(function () {
    function currentPageId() {
        var file = (location.pathname.split('/').pop() || 'index.html');
        if (file === '' || file === 'index.html') return 'intro';
        return file.replace(/\.html$/, '');
    }

    function escAttr(s) { return String(s == null ? '' : s); }

    // 把 nav-config.js 裡「根目錄算起」的 href，補上目前頁面對應的
    // ../ 前綴，變成瀏覽器可以直接使用的相對路徑。
    function withBase(href) {
        return (window.SITE_BASE || '') + escAttr(href);
    }

    function buildChildItem(item) {
        var iconHtml = item.icon
            ? '<i class="fa-solid ' + escAttr(item.icon) + (item.color ? ' ' + escAttr(item.color) : '') + ' w-4"></i> '
            : '';
        return '<button onclick="location.href=\'' + withBase(item.href) + '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">'
            + iconHtml + '<span data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
    }

    function buildTopButton(item) {
        return '<button onclick="location.href=\'' + withBase(item.href) + '\'" id="tab-' + escAttr(item.id) + '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
            + '<i class="fa-solid ' + escAttr(item.icon) + '"></i><span class="inline" data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
    }

    function buildDropdown(group) {
        var enabledItems = (group.items || []).filter(function (it) { return it.enabled !== false; });
        if (!enabledItems.length) return ''; // 整組都關閉時，連下拉選單按鈕本身也不顯示
        var itemsHtml = enabledItems.map(buildChildItem).join('');
        return '<div class="relative" id="' + escAttr(group.id) + 'DropdownWrap">'
            + '<button onclick="toggleNavDropdown(event,\'' + escAttr(group.id) + '\')" id="tab-' + escAttr(group.id) + '-trigger" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
            + '<i class="fa-solid ' + escAttr(group.icon) + '"></i><span class="inline" data-i18n="' + escAttr(group.label) + '">' + escAttr(group.text) + '</span>'
            + '<i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" id="' + escAttr(group.id) + 'Arrow"></i></button>'
            + '<div id="' + escAttr(group.id) + 'Dropdown" class="hidden absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#120824] border border-purple-500/40 rounded-2xl p-2 shadow-2xl z-[300] min-w-[170px]">'
            + itemsHtml + '</div></div>';
    }

    // 找出目前頁面在 NAV_CONFIG 裡對應的那個項目（不論是頂層項目，
    // 還是某個下拉選單裡的子項目），找不到就回傳 null。
    function findCurrentEntry(config, pageId) {
        for (var i = 0; i < config.length; i++) {
            var entry = config[i];
            if (entry.dropdown) {
                var items = entry.items || [];
                for (var j = 0; j < items.length; j++) {
                    if (items[j].id === pageId) return items[j];
                }
            } else if (entry.id === pageId) {
                return entry;
            }
        }
        return null;
    }

    // v35 新增：頁面本身的隱藏保護。
    // 之前 enabled:false 只讓分頁「不出現在導覽列」，但直接輸入網址
    // 還是打得開（例如 live2d-demo.html）。現在改成：頁面載入時
    // 也會檢查自己在 nav-config.js 裡是不是 enabled:false，如果是，
    // 就直接導回首頁，不會讓人看到還沒做完、不打算公開的頁面內容。
    // 想暫時繼續測試某個關閉中的頁面，把 nav-config.js 對應項目的
    // enabled 暫時改回 true 即可（跟原本「恢復顯示」的做法一致）。
    function enforceDisabledPageGuard(config) {
        var pageId = currentPageId();
        if (pageId === 'intro') return; // 首頁必定開放，不需要檢查
        var entry = findCurrentEntry(config, pageId);
        if (entry && entry.enabled === false) {
            location.replace((window.SITE_BASE || '') + 'index.html');
        }
    }

    function renderMainNav() {
        var nav = document.getElementById('mainNav');
        var config = window.NAV_CONFIG;
        if (!nav) return;
        if (!config) {
            console.error('[nav-render] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 nav-render.js 之前載入');
            return;
        }

        enforceDisabledPageGuard(config);

        var html = '';
        var groupOfChild = {}; // 子分頁 id -> 所屬下拉選單 id（用來做 active 高亮）

        config.forEach(function (entry) {
            if (entry.enabled === false) return;
            if (entry.dropdown) {
                var frag = buildDropdown(entry);
                if (frag) html += frag;
                (entry.items || []).forEach(function (it) {
                    if (it.enabled !== false) groupOfChild[it.id] = entry.id;
                });
            } else {
                html += buildTopButton(entry);
            }
        });

        nav.innerHTML = html;

        // 依目前所在頁面高亮對應分頁（或其所屬下拉選單觸發按鈕）
        var pageId = currentPageId();
        var activeBtn = document.getElementById('tab-' + pageId)
            || (groupOfChild[pageId] ? document.getElementById('tab-' + groupOfChild[pageId] + '-trigger') : null);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-white');
            activeBtn.classList.remove('text-purple-300');
        }
    }

    // 立即執行（此檔案沒有 defer/async，瀏覽器解析到這裡就會馬上跑，
    // 此時 <nav id="mainNav"> 早已存在於 DOM 中，可以放心操作）。
    renderMainNav();

    // 同時掛到 window，讓 common.js 裡的備援邏輯偵測到「已經渲染過」而跳過，
    // 避免重複操作 DOM、也維持兩邊渲染邏輯合而為一。
    window.renderMainNav = renderMainNav;
})();
