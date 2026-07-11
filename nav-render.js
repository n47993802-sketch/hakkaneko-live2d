/* ============================================================
   阿卡貓 HakkaNeko 網站 — 導覽列「立即渲染」腳本
   ------------------------------------------------------------
   這支檔案是從 common.js 抽出來的導覽列渲染邏輯，故意獨立成一個
   很小的檔案，並且用「不加 defer / async」的一般 <script> 標籤，
   直接放在 <nav id="mainNav"></nav> 容器後面：

       <nav id="mainNav" ...></nav>
       <script src="nav-config.js"></script>
       <script src="nav-render.js"></script>

   瀏覽器解析 HTML 到這裡時會「立刻」同步執行這兩支小檔案，
   所以 #mainNav 在還沒被畫面看到之前就已經被填好按鈕了 ——
   不用再等到頁面最底部、168KB 的 common.js 下載＋解析完才冒出來。

   這解決的是「連續閃兩下」問題裡的第二下閃爍（導覽列從空白
   容器突然冒出按鈕）。common.js 仍然會在檔案最上方保留一份
   一樣的渲染邏輯做為備援（例如萬一某個頁面忘記引入這支檔案），
   但只要偵測到 #mainNav 已經有內容，就會直接跳過、不重複渲染。
   ============================================================ */
(function () {
    function currentPageId() {
        var file = (location.pathname.split('/').pop() || 'index.html');
        if (file === '' || file === 'index.html') return 'intro';
        return file.replace(/\.html$/, '');
    }

    function escAttr(s) { return String(s == null ? '' : s); }

    function buildChildItem(item) {
        var iconHtml = item.icon
            ? '<i class="fa-solid ' + escAttr(item.icon) + (item.color ? ' ' + escAttr(item.color) : '') + ' w-4"></i> '
            : '';
        return '<button onclick="location.href=\'' + escAttr(item.href) + '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">'
            + iconHtml + '<span data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
    }

    function buildTopButton(item) {
        return '<button onclick="location.href=\'' + escAttr(item.href) + '\'" id="tab-' + escAttr(item.id) + '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
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

    function renderMainNav() {
        var nav = document.getElementById('mainNav');
        var config = window.NAV_CONFIG;
        if (!nav) return;
        if (!config) {
            console.error('[nav] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 nav-render.js 之前載入');
            return;
        }

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

    // 下拉選單開合：提前定義在這裡（而非等 common.js），
    // 避免使用者在 common.js 載入完成前就點到下拉選單按鈕而報錯。
    // common.js 稍後仍會定義一份一模一樣的版本，屬無害的重複覆寫。
    if (typeof window.toggleNavDropdown !== 'function') {
        window.toggleNavDropdown = function toggleNavDropdown(e, key) {
            e.stopPropagation();
            var dd = document.getElementById(key + 'Dropdown');
            var other = key === 'comm' ? 'creativeDropdown' : 'commDropdown';
            var otherEl = document.getElementById(other);
            if (otherEl) otherEl.classList.add('hidden');
            if (dd) dd.classList.toggle('hidden');
        };
    }

    window.renderMainNav = renderMainNav;

    // 此檔案本身就是同步、非 defer 載入，執行到這一行時
    // <nav id="mainNav"></nav> 一定已經在 DOM 中（因為它在 HTML 原始碼中排在本 script 標籤前面），
    // 所以直接渲染即可，不需要等待 DOMContentLoaded。
    renderMainNav();
})();
