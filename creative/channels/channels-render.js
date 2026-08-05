(function () {
  var CFG = window.CHANNELS_CONFIG || { twitch: [], youtube: [] };

  async function checkTwitchLive(channel) {
    try {
      const res = await fetch(`https://decapi.me/twitch/uptime/${channel}`);
      const text = await res.text();
      const isLive =
        !text.includes("offline") &&
        !text.includes("error") &&
        text.trim().length > 0;
      updateChannelBadge(channel, isLive);
    } catch (e) {}
  }

  function updateChannelBadge(channel, isLive) {
    const statusEl = document.getElementById(`live-${channel}`);
    if (!statusEl) return;
    const _ll =
      typeof currentLang !== "undefined" && window.I18N && I18N[currentLang]
        ? I18N[currentLang].ch_live
        : "直播中";
    const _ol =
      typeof currentLang !== "undefined" && window.I18N && I18N[currentLang]
        ? I18N[currentLang].ch_offline
        : "離線";
    if (isLive) {
      statusEl.className = "btn-status online";
      statusEl.innerHTML = `<span class="status-dot"></span>${_ll}`;
    } else {
      statusEl.className = "btn-status offline";
      statusEl.innerHTML = `<span class="status-dot"></span>${_ol}`;
    }
  }

  async function checkYoutubeLive(entry) {
    const badge = document.getElementById(entry.id);
    if (!badge) return;
    const _ll =
      typeof currentLang !== "undefined" && window.I18N && I18N[currentLang]
        ? I18N[currentLang].ch_live
        : "直播中";
    const _ol =
      typeof currentLang !== "undefined" && window.I18N && I18N[currentLang]
        ? I18N[currentLang].ch_offline
        : "離線";
    try {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${entry.channelId}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      const isLive = data.items && data.items.length > 0;
      badge.className = isLive ? "btn-status online" : "btn-status offline";
      badge.innerHTML = `<span class="status-dot"></span>${isLive ? _ll : _ol}`;
    } catch (e) {
      badge.className = "btn-status offline";
      badge.innerHTML = `<span class="status-dot"></span>${_ol}`;
    }
  }

  function checkAllChannels() {
    CFG.twitch.forEach((ch) => checkTwitchLive(ch));
    CFG.youtube.forEach((ch) => checkYoutubeLive(ch));
  }

  window.checkAllChannels = checkAllChannels;

  function init() {
    const allChecks = [
      ...CFG.twitch.map((ch) => () => checkTwitchLive(ch)),
      ...CFG.youtube.map((ch) => () => checkYoutubeLive(ch)),
    ];
    allChecks.forEach((fn, i) => setTimeout(fn, 300 + i * 350));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
