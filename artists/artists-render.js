
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
            + '<img loading="lazy" width="96" height="96" src="' + avatar + '" '
            + 'class="w-24 h-24 rounded-full border-2 border-white/10 mb-4 object-cover group-hover:scale-105 transition-transform shadow-lg img-fade" alt="' + name + '" '
            + 'onload="this.classList.add(\'loaded\')" '
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
