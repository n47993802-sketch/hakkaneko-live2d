/* ============================================================
   阿卡貓 HakkaNeko 網站 — 推薦頻道直播狀態偵測
   ============================================================
   從 common.js 拆分出來，只有 channels.html 會載入這個檔案。

   之前的問題：這段邏輯原本放在 common.js 裡，而 common.js 是
   10 個頁面共用的檔案，導致「查詢推薦頻道是否在直播」這件事，
   其實在 index.html、artists.html…等完全不相關的頁面上也會
   偷偷跑一次（對外部 API 發出請求，只是查完之後找不到對應的
   徽章元素、白跑一趟），浪費頻寬和外部 API 的請求額度。
   現在只有 channels.html 才會載入這個檔案，其他頁面不會再有
   這些看不到結果的多餘網路請求。

   Twitch Helix API 需要 Client-ID + OAuth Token，瀏覽器端直接呼叫
   會被 CORS 擋住，這裡沿用原本的 free proxy workaround
   （decapi.me）。若之後這個免費服務失效，需要換成別的方案或
   自架後端。
   ============================================================ */
(function () {
    var CFG = window.CHANNELS_CONFIG || { twitch: [], youtube: [] };

    async function checkTwitchLive(channel) {
        try {
            const res = await fetch(`https://decapi.me/twitch/uptime/${channel}`, { signal: AbortSignal.timeout(4000) });
            const text = await res.text();
            const isLive = !text.includes('offline') && !text.includes('error') && text.trim().length > 0;
            updateChannelBadge(channel, isLive);
        } catch (e) {
            // 靜默失敗，維持「離線」顯示，不影響其他功能
        }
    }

    function updateChannelBadge(channel, isLive) {
        const statusEl = document.getElementById(`live-${channel}`);
        if (!statusEl) return;
        const _ll = (typeof currentLang !== 'undefined' && window.I18N && I18N[currentLang]) ? I18N[currentLang].ch_live : '直播中';
        const _ol = (typeof currentLang !== 'undefined' && window.I18N && I18N[currentLang]) ? I18N[currentLang].ch_offline : '離線';
        if (isLive) {
            statusEl.className = 'btn-status online';
            statusEl.innerHTML = `<span class="status-dot"></span>${_ll}`;
        } else {
            statusEl.className = 'btn-status offline';
            statusEl.innerHTML = `<span class="status-dot"></span>${_ol}`;
        }
    }

    async function checkYoutubeLive(entry) {
        const badge = document.getElementById(entry.id);
        if (!badge) return;
        const _ll = (typeof currentLang !== 'undefined' && window.I18N && I18N[currentLang]) ? I18N[currentLang].ch_live : '直播中';
        const _ol = (typeof currentLang !== 'undefined' && window.I18N && I18N[currentLang]) ? I18N[currentLang].ch_offline : '離線';
        try {
            // YouTube oEmbed 可判斷頻道是否存在，但無法直接取得直播狀態，
            // 這裡用 yt.lemnoslife.com 免費 no-key API 查詢 isLive
            const url = `https://yt.lemnoslife.com/noKey/search?part=snippet&q=${encodeURIComponent(entry.handle)}&type=video&eventType=live`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            const data = await res.json();
            const isLive = data.items && data.items.length > 0;
            badge.className = isLive ? 'btn-status online' : 'btn-status offline';
            badge.innerHTML = `<span class="status-dot"></span>${isLive ? _ll : _ol}`;
        } catch (e) {
            badge.className = 'btn-status offline';
            badge.innerHTML = `<span class="status-dot"></span>${_ol}`;
        }
    }

    function checkAllChannels() {
        CFG.twitch.forEach(ch => checkTwitchLive(ch));
        CFG.youtube.forEach(ch => checkYoutubeLive(ch));
    }

    // 暴露给 common.js 的語言切換邏輯（setLang 裡會呼叫
    // `if (typeof checkAllChannels === 'function') checkAllChannels();`
    // 來更新徽章文字的語言）。
    window.checkAllChannels = checkAllChannels;

    // 錯開發送，避免同時佔滿瀏覽器並發連線配額（跟原本 common.js
    // 裡的節奏一致：每隔 350ms 依序發出）。
    function init() {
        const allChecks = [
            ...CFG.twitch.map(ch => () => checkTwitchLive(ch)),
            ...CFG.youtube.map(ch => () => checkYoutubeLive(ch)),
        ];
        allChecks.forEach((fn, i) => setTimeout(fn, 300 + i * 350));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
