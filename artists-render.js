/* ============================================================
   阿卡貓 HakkaNeko 網站 — 合作繪師卡片渲染器
   ============================================================
   讀取 artists-config.js 的 window.ARTISTS_CONFIG，同步（不用等
   DOMContentLoaded）把繪師卡片畫進 <div id="artistsGrid">。

   為什麼要「同步」畫（不用 defer、不包在 DOMContentLoaded 裡）？
   跟 nav-render.js 的理由一樣：這個 <script> 標籤就緊接在
   #artistsGrid 容器後面，瀏覽器解析到這裡時容器已經存在，
   立刻畫完就不會有「先看到空白、卡片才突然跳出來」的閃爍。

   頭貼載入失敗時的處理：
   如果某位繪師的頭貼網址失效（例如帳號改名、圖被刪除），
   不會顯示瀏覽器預設的破圖 icon，而是自動換成一個素色的人形
   icon 佔位，版面不會跑掉、也比較好看。
   ============================================================ */
(function () {
    function escAttr(s) { return String(s == null ? '' : s); }
    function escHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildCard(a) {
        var handle = escAttr(a.handle);
        var name = escHtml(a.name);
        var avatar = escAttr(a.avatar);
        var url = escAttr(a.profileUrl || ('https://x.com/' + handle));

        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" '
            + 'class="glass-panel p-6 rounded-2xl hover:-translate-y-2 hover:border-purple-400 transition-all flex flex-col items-center group text-center block">'
            + '<img loading="lazy" src="' + avatar + '" '
            + 'class="w-24 h-24 rounded-full border-2 border-white/10 mb-4 object-cover group-hover:scale-105 transition-transform shadow-lg" alt="' + name + '" '
            + 'onerror="this.onerror=null;this.outerHTML=\'<div class=&quot;w-24 h-24 rounded-full border-2 border-white/10 mb-4 bg-white/5 flex items-center justify-center shadow-lg&quot;><i class=&quot;fa-solid fa-user text-3xl text-purple-300/40&quot;></i></div>\';">'
            + '<h3 class="font-bold text-white text-lg px-2">'
            + '<span class="artist-name">' + name + '</span><span class="artist-id">@' + escHtml(handle) + '</span>'
            + '</h3></a>';
    }

    function renderArtists() {
        var grid = document.getElementById('artistsGrid');
        var list = window.ARTISTS_CONFIG;
        if (!grid) return;
        if (!list) {
            console.error('[artists-render] window.ARTISTS_CONFIG 尚未定義，請確認 artists-config.js 有在 artists-render.js 之前載入');
            return;
        }
        grid.innerHTML = list.map(buildCard).join('');
    }

    renderArtists();
})();
