(function () {
  var CFG = window.CHANNELS_CONFIG || { channels: [], twitch: [], youtube: [] };

  var activeFilter = "all";
  var filterSyncTimer = null;
  var currentPage = 1;
  var pageSize = 8;

  function getDict() {
    if (typeof currentLang !== "undefined" && window.I18N && I18N[currentLang]) {
      return I18N[currentLang];
    }
    return {
      ch_live: "直播中",
      ch_offline: "離線",
      channels_filter_all: "全部",
      channels_filter_live: "直播中",
      channels_filter_offline: "離線中",
      channels_filter_summary_all: "顯示 {visible} / {total} 個頻道",
      channels_filter_summary_live: "直播中 {visible} / {total} 個頻道",
      channels_filter_summary_offline: "離線中 {visible} / {total} 個頻道",
      channels_filter_empty: "目前沒有符合條件的頻道",
      channels_pager_prev: "上一頁",
      channels_pager_next: "下一頁",
      channels_pager_info: "第 {page} / {totalPages} 頁（共 {total} 個）",
      channels_last_updated: "最後更新：",
      channels_last_updated_pending: "最後更新：尚未檢查",
    };
  }

  function tpl(text, vars) {
    return String(text || "").replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] == null ? "" : String(vars[k]);
    });
  }

  function safeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return safeText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugifyId(value) {
    var text = safeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return text || "channel";
  }

  function inferPlatformType(url) {
    var text = safeText(url).toLowerCase();
    if (text.indexOf("youtube.com") !== -1 || text.indexOf("youtu.be") !== -1) {
      return "youtube";
    }
    if (text.indexOf("twitch.tv") !== -1) {
      return "twitch";
    }
    return "";
  }

  function getPlatformVisual(type) {
    if (type === "youtube") {
      return {
        icon: "fa-brands fa-youtube btn-platform-icon",
        avatarClass: "border-red-500/30 bg-red-600/10",
        fallbackIcon: "<i class='fa-brands fa-youtube text-red-500 text-2xl'></i>",
      };
    }
    return {
      icon: "fa-brands fa-twitch btn-platform-icon",
      avatarClass: "border-[#9146ff]/40 bg-[#9146ff]/10",
      fallbackIcon: "<i class='fa-brands fa-twitch text-[#9146ff] text-2xl'></i>",
    };
  }

  function normalizePlatformEntry(platform, channelKey, index) {
    var type = safeText(platform && platform.type).toLowerCase();
    var url = safeText(platform && platform.url);
    if (!type) {
      type = inferPlatformType(url);
    }
    if ((type !== "twitch" && type !== "youtube") || !url) {
      return null;
    }

    var twitchLogin = type === "twitch"
      ? (safeText(platform && platform.login) || parseTwitchLoginFromHref(url))
      : "";
    var youtubeTarget = type === "youtube"
      ? parseYouTubeTargetFromHref(url)
      : { handle: "", channelId: "" };

    var seed =
      safeText(platform && platform.id) ||
      safeText(platform && platform.label) ||
      twitchLogin ||
      safeText(youtubeTarget.handle) ||
      safeText(youtubeTarget.channelId) ||
      channelKey + "-" + (index + 1);
    var idBase = slugifyId(seed);

    return {
      type: type,
      url: url,
      label: safeText(platform && platform.label) || seed,
      statusId:
        safeText(platform && platform.statusId) ||
        (type === "youtube" ? "yt-live-" + idBase : "live-" + idBase),
      buttonId:
        safeText(platform && platform.buttonId) ||
        (type === "youtube" ? "btn-yt-" + idBase : "btn-" + idBase),
      login: twitchLogin,
      handle: safeText(platform && platform.handle) || safeText(youtubeTarget.handle),
      channelId: safeText(platform && platform.channelId) || safeText(youtubeTarget.channelId),
    };
  }

  function validateChannelConfig(channel, index) {
    var head = "[channels-config] channel #" + (index + 1);
    if (!safeText(channel && channel.name)) {
      console.warn(head + " is missing `name`", channel);
    }
    if (!safeText(channel && channel.bio)) {
      console.warn(head + " is missing `bio`", channel);
    }
    if (!Array.isArray(channel && channel.platforms) || !channel.platforms.length) {
      console.warn(head + " has no valid `platforms`", channel);
    }
  }

  function getConfiguredChannels() {
    var list = Array.isArray(CFG.channels) ? CFG.channels : [];
    return list
      .map(function (item, index) {
        validateChannelConfig(item, index);
        var key = slugifyId(safeText(item && item.key) || "channel-" + (index + 1));
        var platforms = Array.isArray(item && item.platforms)
          ? item.platforms
              .map(function (platform, platformIndex) {
                return normalizePlatformEntry(platform, key, platformIndex);
              })
              .filter(Boolean)
          : [];

        return {
          key: key,
          name: safeText(item && item.name),
          bio: safeText(item && item.bio),
          avatarSrc: safeText(item && item.avatar && item.avatar.src),
          avatarAlt: safeText(item && item.avatar && item.avatar.alt),
          platforms: platforms,
        };
      })
      .filter(function (channel) {
        return channel.name && channel.platforms.length > 0;
      });
  }

  function renderPlatformButton(platform) {
    var dict = getDict();
    var visual = getPlatformVisual(platform.type);
    var statusText = dict.ch_offline || "離線";

    return (
      "<a href=\"" +
      escapeHtml(platform.url) +
      "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ch-platform-btn " +
      escapeHtml(platform.type) +
      "\" id=\"" +
      escapeHtml(platform.buttonId) +
      "\">" +
      "<i class=\"" +
      visual.icon +
      "\"></i>" +
      "<span class=\"btn-label\">" +
      escapeHtml(platform.label) +
      "</span>" +
      "<span class=\"btn-status offline\" id=\"" +
      escapeHtml(platform.statusId) +
      "\" data-live-state=\"unknown\" data-checked=\"false\">" +
      "<span class=\"status-dot\"></span><span>" +
      escapeHtml(statusText) +
      "</span></span>" +
      "</a>"
    );
  }

  function renderChannelCard(channel) {
    var firstPlatform = channel.platforms[0] || { type: "twitch" };
    var visual = getPlatformVisual(firstPlatform.type);
    var avatarHtml =
      "<div class=\"ch-avatar-wrap border-2 " +
      visual.avatarClass +
      "\">";

    if (channel.avatarSrc) {
      avatarHtml +=
        "<img loading=\"lazy\" src=\"" +
        escapeHtml(channel.avatarSrc) +
        "\" alt=\"" +
        escapeHtml(channel.avatarAlt || channel.name) +
        "\" class=\"w-full h-full object-cover\" onerror=\"this.style.display='none';this.parentElement.innerHTML='" +
        visual.fallbackIcon.replace(/'/g, "&#39;") +
        "';\" />";
    } else {
      avatarHtml += visual.fallbackIcon;
    }
    avatarHtml += "</div>";

    return (
      "<div class=\"glass-panel p-5 rounded-2xl border border-purple-500/20 ch-card\" data-channel-key=\"" +
      escapeHtml(channel.key) +
      "\">" +
      "<div class=\"ch-card-body\">" +
      avatarHtml +
      "<div class=\"ch-info\">" +
      "<p class=\"ch-name\">" +
      escapeHtml(channel.name) +
      "</p>" +
      "<p class=\"ch-bio\">" +
      escapeHtml(channel.bio) +
      "</p>" +
      "</div></div>" +
      "<div class=\"ch-links\">" +
      channel.platforms.map(renderPlatformButton).join("") +
      "</div></div>"
    );
  }

  function renderChannelsFromConfig() {
    var grid = document.getElementById("channelsGrid");
    if (!grid) return;
    var channels = getConfiguredChannels();
    if (!channels.length) return;
    grid.innerHTML = channels.map(renderChannelCard).join("");
  }

  function normalizeTwitchEntry(entry) {
    if (typeof entry === "string") {
      return { login: entry, statusId: "live-" + entry, probes: [entry] };
    }
    var login = entry && (entry.login || entry.id || entry.channel || "");
    var probes = Array.isArray(entry && entry.probes)
      ? entry.probes.filter(Boolean)
      : [login];
    return {
      login: login,
      statusId: "live-" + login,
      probes: probes.length ? probes : [login],
    };
  }

  function normalizeYouTubeEntry(entry) {
    if (typeof entry === "string") {
      return { id: "yt-live-" + entry, channelId: "", handle: entry };
    }
    return {
      id: entry.id,
      channelId: entry.channelId || "",
      handle: entry.handle || "",
    };
  }

  function parseTwitchLoginFromHref(href) {
    var text = String(href || "").trim();
    if (!text) return "";
    var match = text.match(/twitch\.tv\/([^/?#]+)/i);
    return match && match[1] ? match[1].trim() : "";
  }

  function parseYouTubeTargetFromHref(href) {
    var text = String(href || "").trim();
    if (!text) return { handle: "", channelId: "" };

    var handleMatch = text.match(/youtube\.com\/@([^/?#]+)/i);
    if (handleMatch && handleMatch[1]) {
      return { handle: handleMatch[1].trim(), channelId: "" };
    }

    var channelMatch = text.match(/youtube\.com\/channel\/([^/?#]+)/i);
    if (channelMatch && channelMatch[1]) {
      return { handle: "", channelId: channelMatch[1].trim() };
    }

    return { handle: "", channelId: "" };
  }

  function getTwitchProbeMap() {
    var map = {};
    (CFG.twitch || []).map(normalizeTwitchEntry).forEach(function (entry) {
      if (!entry || !entry.login) return;
      map[String(entry.login).toLowerCase()] = entry.probes && entry.probes.length
        ? entry.probes.slice()
        : [entry.login];
    });
    return map;
  }

  function collectTwitchEntries() {
    var probeMap = getTwitchProbeMap();
    var seen = {};
    var entries = [];

    document.querySelectorAll(".ch-platform-btn.twitch").forEach(function (link) {
      var login = parseTwitchLoginFromHref(link.getAttribute("href"));
      var statusEl = link.querySelector(".btn-status");
      var statusId = statusEl && statusEl.id ? statusEl.id : "";
      if (!login || !statusId || seen[statusId]) return;

      seen[statusId] = true;
      var key = String(login).toLowerCase();
      entries.push({
        login: login,
        statusId: statusId,
        probes: probeMap[key] && probeMap[key].length ? probeMap[key] : [login],
      });
    });

    if (entries.length) return entries;

    return (CFG.twitch || []).map(normalizeTwitchEntry).filter(function (x) {
      return !!x.login;
    });
  }

  function collectYouTubeEntries() {
    var seen = {};
    var entries = [];

    document.querySelectorAll(".ch-platform-btn.youtube").forEach(function (link) {
      var target = parseYouTubeTargetFromHref(link.getAttribute("href"));
      var statusEl = link.querySelector(".btn-status");
      var statusId = statusEl && statusEl.id ? statusEl.id : "";
      if (!statusId || seen[statusId]) return;
      if (!target.handle && !target.channelId) return;

      seen[statusId] = true;
      entries.push({
        id: statusId,
        handle: target.handle,
        channelId: target.channelId,
      });
    });

    if (entries.length) return entries;

    return (CFG.youtube || []).map(normalizeYouTubeEntry);
  }

  function isYouTubeLiveHtml(html) {
    var text = String(html || "").toLowerCase();
    if (!text) return false;
    return (
      text.indexOf('"islivenow":true') !== -1 ||
      text.indexOf('"badgestyletype":"badge_style_type_live_now"') !== -1 ||
      text.indexOf('"hlsmanifesturl"') !== -1
    );
  }

  function getYouTubeLiveProbeUrls(entry) {
    var urls = [];
    var handle = (entry && entry.handle ? entry.handle : "").replace(/^@+/, "").trim();
    var channelId = (entry && entry.channelId ? entry.channelId : "").trim();

    if (handle) {
      urls.push("https://www.youtube.com/@" + handle + "/live");
    }
    if (channelId) {
      urls.push("https://www.youtube.com/channel/" + channelId + "/live");
    }
    return urls;
  }

  async function fetchTextWithProxy(url) {
    var proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    var res = await fetch(proxy, { signal: AbortSignal.timeout(7000) });
    return await res.text();
  }

  function cardStateFromCard(card) {
    if (!card) return "unknown";
    var statuses = Array.from(card.querySelectorAll(".btn-status"));
    if (!statuses.length) return "unknown";

    var states = statuses.map(function (el) {
      return el.getAttribute("data-live-state") || "unknown";
    });

    if (states.some(function (state) {
      return state === "live";
    })) {
      return "live";
    }
    if (states.some(function (state) {
      return state === "offline";
    })) {
      return "offline";
    }
    return "unknown";
  }

  function refreshCardStates() {
    document.querySelectorAll(".ch-card").forEach(function (card) {
      card.dataset.liveState = cardStateFromCard(card);
    });
  }

  function assignShuffleKeys() {
    document.querySelectorAll(".ch-card").forEach(function (card) {
      card.dataset.shuffleKey = String(Math.random());
    });
  }

  function getCards() {
    var grid = document.getElementById("channelsGrid");
    if (!grid) return [];
    return Array.from(grid.querySelectorAll(".ch-card"));
  }

  function updateFilterButtonText(total, liveCount, offlineCount) {
    var dict = getDict();
    var map = {
      all: { key: "channels_filter_all", count: total },
      live: { key: "channels_filter_live", count: liveCount },
      offline: { key: "channels_filter_offline", count: offlineCount },
    };
    document.querySelectorAll("[data-channel-filter]").forEach(function (btn) {
      var id = btn.getAttribute("data-channel-filter");
      var item = map[id];
      if (!item) return;
      var baseText = dict[item.key] || btn.textContent || "";
      btn.textContent = baseText + " (" + item.count + ")";
    });
  }

  function updateSummary(visible, total) {
    var dict = getDict();
    var keyMap = {
      all: "channels_filter_summary_all",
      live: "channels_filter_summary_live",
      offline: "channels_filter_summary_offline",
    };
    var summary = document.getElementById("channelsFilterSummary");
    if (!summary) return;
    var key = keyMap[activeFilter] || keyMap.all;
    var template = dict[key] || "顯示 {visible} / {total} 個頻道";
    summary.textContent = tpl(template, {
      visible: visible,
      total: total,
    });
  }

  function updateLastUpdated() {
    var el = document.getElementById("channelsLastUpdated");
    if (!el) return;
    var dict = getDict();
    var prefix = dict.channels_last_updated || "更新時間：";
    var localeMap = {
      "zh-TW": "zh-TW",
      "zh-CN": "zh-CN",
      en: "en-US",
      ja: "ja-JP",
    };
    var lang = typeof currentLang !== "undefined" ? currentLang : "zh-TW";
    var now = new Date();
    var value = now.toLocaleString(localeMap[lang] || "zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    value = value.replace(/(上午|下午|AM|PM)\s+/i, "$1");
    el.textContent = prefix + value;
  }

  function setLastUpdatedPending() {
    var el = document.getElementById("channelsLastUpdated");
    if (!el) return;
    var dict = getDict();
    el.textContent = dict.channels_last_updated_pending || "更新時間：尚未檢查";
  }

  function updateEmptyState(visible) {
    var empty = document.getElementById("channelsEmptyState");
    var grid = document.getElementById("channelsGrid");
    if (!empty) return;
    var showEmpty = visible === 0;

    empty.classList.toggle("hidden", !showEmpty);
    empty.style.display = showEmpty ? "block" : "none";

    if (grid) {
      grid.style.display = showEmpty ? "none" : "grid";
    }

    if (visible === 0) {
      var dict = getDict();
      empty.textContent = dict.channels_filter_empty || "目前沒有符合條件的頻道";
    }
  }

  function updateFilterUi(cards, visible) {
    var total = cards.length;
    var liveCount = cards.filter(function (card) {
      return card.dataset.liveState === "live";
    }).length;
    var offlineCount = cards.filter(function (card) {
      return card.dataset.liveState === "offline";
    }).length;

    updateFilterButtonText(total, liveCount, offlineCount);
    updateSummary(visible, total);
    updateEmptyState(visible);

    document.querySelectorAll("[data-channel-filter]").forEach(function (btn) {
      var selected = btn.getAttribute("data-channel-filter") === activeFilter;
      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function updatePager(totalVisible) {
    var pager = document.getElementById("channelsPager");
    var info = document.getElementById("channelsPageInfo");
    var prevBtn = document.getElementById("channelsPagePrev");
    var nextBtn = document.getElementById("channelsPageNext");
    if (!pager || !info || !prevBtn || !nextBtn) return;

    if (totalVisible <= 0) {
      pager.classList.add("hidden");
      pager.style.display = "none";
      return;
    }

    var totalPages = Math.max(1, Math.ceil(totalVisible / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var dict = getDict();
    var template = dict.channels_pager_info || "第 {page} / {totalPages} 頁（共 {total} 個）";
    info.textContent = tpl(template, {
      page: currentPage,
      totalPages: totalPages,
      total: totalVisible,
    });

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pager.classList.remove("hidden");
    pager.style.display = "flex";
  }

  function sortCards(cards) {
    cards.sort(function (a, b) {
      var rank = { live: 0, offline: 1, unknown: 2 };
      var sa = rank[a.dataset.liveState] != null ? rank[a.dataset.liveState] : 2;
      var sb = rank[b.dataset.liveState] != null ? rank[b.dataset.liveState] : 2;
      if (sa !== sb) return sa - sb;

      var ra = Number(a.dataset.shuffleKey);
      var rb = Number(b.dataset.shuffleKey);
      if (!Number.isFinite(ra)) ra = Math.random();
      if (!Number.isFinite(rb)) rb = Math.random();
      return ra - rb;
    });
  }

  function applyFilter(filter) {
    var nextFilter = filter || activeFilter;
    if (nextFilter !== activeFilter) {
      currentPage = 1;
    }
    activeFilter = nextFilter;
    refreshCardStates();

    var cards = getCards();
    var grid = document.getElementById("channelsGrid");
    if (!cards.length || !grid) return;

    sortCards(cards);
    cards.forEach(function (card) {
      grid.appendChild(card);
    });

    var matchedCards = [];
    cards.forEach(function (card) {
      var state = card.dataset.liveState || "unknown";
      var matched =
        activeFilter === "all" ||
        (activeFilter === "live" && state === "live") ||
        (activeFilter === "offline" && state === "offline");
      card.classList.add("hidden");
      card.style.display = "none";
      if (matched) matchedCards.push(card);
    });

    var totalVisible = matchedCards.length;
    var totalPages = Math.max(1, Math.ceil(totalVisible / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if (totalVisible > 0) {
      var start = (currentPage - 1) * pageSize;
      var end = Math.min(start + pageSize, totalVisible);
      for (var i = start; i < end; i++) {
        matchedCards[i].classList.remove("hidden");
        matchedCards[i].style.display = "flex";
      }
    }

    updateFilterUi(cards, totalVisible);
    updatePager(totalVisible);
  }

  function queueFilterSync() {
    if (filterSyncTimer) clearTimeout(filterSyncTimer);
    filterSyncTimer = setTimeout(function () {
      applyFilter(activeFilter);
    }, 50);
  }

  function updateStatusBadge(statusEl, isLive) {
    if (!statusEl) return;
    var dict = getDict();
    if (isLive) {
      statusEl.className = "btn-status online";
      statusEl.innerHTML = "<span class=\"status-dot\"></span>" + (dict.ch_live || "直播中");
      statusEl.setAttribute("data-live-state", "live");
    } else {
      statusEl.className = "btn-status offline";
      statusEl.innerHTML = "<span class=\"status-dot\"></span>" + (dict.ch_offline || "離線");
      statusEl.setAttribute("data-live-state", "offline");
    }
    statusEl.setAttribute("data-checked", "true");
    queueFilterSync();
  }

  async function checkTwitchLive(entry) {
    if (!entry || !entry.login) return;
    var statusEl = document.getElementById(entry.statusId);
    if (!statusEl) return;

    var probes = entry.probes || [entry.login];
    for (var i = 0; i < probes.length; i++) {
      var channel = probes[i];
      if (!channel) continue;
      try {
        var decapiRes = await fetch("https://decapi.me/twitch/uptime/" + channel, {
          signal: AbortSignal.timeout(4500),
        });
        var text = (await decapiRes.text()).toLowerCase();
        if (text.includes("offline")) {
          updateStatusBadge(statusEl, false);
          return;
        }
        if (!text.includes("error") && text.trim().length > 3) {
          updateStatusBadge(statusEl, true);
          return;
        }
      } catch (e) {}

      try {
        var ivrRes = await fetch("https://api.ivr.fi/v2/twitch/user?login=" + channel, {
          signal: AbortSignal.timeout(4500),
        });
        var ivrData = await ivrRes.json();
        if (Array.isArray(ivrData) && ivrData[0]) {
          updateStatusBadge(statusEl, !!ivrData[0].stream);
          return;
        }
      } catch (e) {}
    }

    updateStatusBadge(statusEl, false);
  }

  async function checkYoutubeLive(entry) {
    var badge = document.getElementById(entry.id);
    if (!badge) return;

    var urls = getYouTubeLiveProbeUrls(entry);
    if (!urls.length) {
      updateStatusBadge(badge, false);
      return;
    }

    for (var i = 0; i < urls.length; i++) {
      try {
        var html = await fetchTextWithProxy(urls[i]);
        if (isYouTubeLiveHtml(html)) {
          updateStatusBadge(badge, true);
          return;
        }
      } catch (e) {}
    }

    updateStatusBadge(badge, false);
  }

  function updateRefreshState(isChecking) {
    var btn = document.getElementById("channelsRefreshBtn");
    if (!btn) return;
    btn.classList.toggle("is-checking", !!isChecking);
    btn.disabled = !!isChecking;
  }

  async function checkAllChannels() {
    var twitchEntries = collectTwitchEntries();
    var youtubeEntries = collectYouTubeEntries();

    updateRefreshState(true);

    await Promise.allSettled(
      twitchEntries.map(function (entry) {
        return checkTwitchLive(entry);
      }),
    );
    await Promise.allSettled(
      youtubeEntries.map(function (entry) {
        return checkYoutubeLive(entry);
      }),
    );

    updateRefreshState(false);
    updateLastUpdated();
    assignShuffleKeys();
    applyFilter(activeFilter);
  }

  function bindFilterControls() {
    document.querySelectorAll("[data-channel-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-channel-filter") || "all";
        applyFilter(target);
      });
    });

    var refreshBtn = document.getElementById("channelsRefreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        checkAllChannels();
      });
    }

    var prevBtn = document.getElementById("channelsPagePrev");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        currentPage = Math.max(1, currentPage - 1);
        applyFilter(activeFilter);
      });
    }

    var nextBtn = document.getElementById("channelsPageNext");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        currentPage += 1;
        applyFilter(activeFilter);
      });
    }
  }

  function bindStatusObserver() {
    var statuses = document.querySelectorAll(".btn-status");
    if (!statuses.length) return;
    var obs = new MutationObserver(function () {
      queueFilterSync();
    });

    statuses.forEach(function (el) {
      obs.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    });
  }

  window.checkAllChannels = checkAllChannels;

  function init() {
    if (!document.getElementById("channelsGrid")) return;
    renderChannelsFromConfig();
    bindFilterControls();
    bindStatusObserver();
    assignShuffleKeys();
    document.querySelectorAll(".btn-status").forEach(function (el) {
      el.setAttribute("data-live-state", "unknown");
      el.setAttribute("data-checked", "false");
    });
    setLastUpdatedPending();
    applyFilter("all");

    setTimeout(function () {
      checkAllChannels();
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
