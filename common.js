if (!window.I18N) {
  console.error(
    "[i18n] window.I18N 尚未定義，請確認 index.html 有在 common.js 之前載入 locales/*.js",
  );
  window.I18N = {};
}
const I18N = window.I18N;
let currentLang = "zh-TW";

(function () {
  function currentPageId() {
    if (!window.SITE_BASE) return "intro";
    var segments = location.pathname.split("/").filter(Boolean);
    if (segments.length && /\.html$/i.test(segments[segments.length - 1])) {
      var last = segments.pop();

      if (last.toLowerCase() !== "index.html")
        return last.replace(/\.html$/i, "");
    }
    return segments.length ? segments[segments.length - 1] : "intro";
  }

  function escAttr(s) {
    return String(s == null ? "" : s);
  }

  function withBase(href) {
    return (window.SITE_BASE || "") + escAttr(href);
  }

  function buildChildItem(item) {
    var iconHtml = item.icon
      ? '<i class="fa-solid ' +
        escAttr(item.icon) +
        (item.color ? " " + escAttr(item.color) : "") +
        ' w-4"></i> '
      : "";
    return (
      "<button onclick=\"location.href='" +
      withBase(item.href) +
      '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">' +
      iconHtml +
      '<span data-i18n="' +
      escAttr(item.label) +
      '">' +
      escAttr(item.text) +
      "</span></button>"
    );
  }

  function buildTopButton(item) {
    return (
      "<button onclick=\"location.href='" +
      withBase(item.href) +
      '\'" id="tab-' +
      escAttr(item.id) +
      '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">' +
      '<i class="fa-solid ' +
      escAttr(item.icon) +
      '"></i><span class="inline" data-i18n="' +
      escAttr(item.label) +
      '">' +
      escAttr(item.text) +
      "</span></button>"
    );
  }

  function buildDropdown(group) {
    var enabledItems = (group.items || []).filter(function (it) {
      return it.enabled !== false;
    });
    if (!enabledItems.length) return "";
    var itemsHtml = enabledItems.map(buildChildItem).join("");
    return (
      '<div class="relative" id="' +
      escAttr(group.id) +
      'DropdownWrap">' +
      "<button onclick=\"toggleNavDropdown(event,'" +
      escAttr(group.id) +
      '\')" id="tab-' +
      escAttr(group.id) +
      '-trigger" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">' +
      '<i class="fa-solid ' +
      escAttr(group.icon) +
      '"></i><span class="inline" data-i18n="' +
      escAttr(group.label) +
      '">' +
      escAttr(group.text) +
      "</span>" +
      '<i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" id="' +
      escAttr(group.id) +
      'Arrow"></i></button>' +
      '<div id="' +
      escAttr(group.id) +
      'Dropdown" class="hidden absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#120824] border border-purple-500/40 rounded-2xl p-2 shadow-2xl z-[300] min-w-[170px]">' +
      itemsHtml +
      "</div></div>"
    );
  }

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

  function enforceDisabledPageGuard(config) {
    var pageId = currentPageId();
    if (pageId === "intro") return;
    var entry = findCurrentEntry(config, pageId);
    if (entry && entry.enabled === false) {
      location.replace((window.SITE_BASE || "") + "index.html");
    }
  }

  function renderMainNav() {
    var nav = document.getElementById("mainNav");
    var config = window.NAV_CONFIG;
    if (!nav) return;
    if (!config) {
      console.error(
        "[nav] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 common.js 之前載入",
      );
      return;
    }

    enforceDisabledPageGuard(config);

    var html = "";
    var groupOfChild = {};

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

    var pageId = currentPageId();
    var activeBtn =
      document.getElementById("tab-" + pageId) ||
      (groupOfChild[pageId]
        ? document.getElementById("tab-" + groupOfChild[pageId] + "-trigger")
        : null);
    if (activeBtn) {
      activeBtn.classList.add("active", "text-white");
      activeBtn.classList.remove("text-purple-300");
    }
  }

  if (typeof window.renderMainNav !== "function") {
    window.renderMainNav = renderMainNav;
  }

  var _navAlreadyRendered =
    document.getElementById("mainNav") &&
    document.getElementById("mainNav").children.length > 0;
  if (_navAlreadyRendered) {
  } else if (document.getElementById("mainNav")) {
    renderMainNav();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMainNav);
  }
})();

function generateOrderNumber(type) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  const typeCode = type === "anim" ? "AN" : "VP";
  return `HKN-${typeCode}-${y}-${m}${d}-${rand}`;
}

function ensureToastElement() {
  let toast = document.getElementById("toast");
  if (toast) return toast;

  toast = document.createElement("div");
  toast.id = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.className = "global-toast";
  toast.style.position = "fixed";
  toast.style.right = "1rem";
  toast.style.bottom = "1rem";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  toast.style.pointerEvents = "none";
  toast.style.maxWidth = "min(90vw, 320px)";
  toast.style.padding = "0.75rem 1rem";
  toast.style.borderRadius = "999px";
  const isLightToast = document.body.classList.contains("light-mode");
  toast.style.background = isLightToast
    ? "rgba(255, 255, 255, 0.92)"
    : "rgba(15, 10, 30, 0.92)";
  toast.style.color = isLightToast ? "#2f0f4f" : "#f5e8ff";
  toast.style.border = isLightToast
    ? "1px solid rgba(107, 33, 168, 0.18)"
    : "1px solid rgba(168, 85, 247, 0.35)";
  toast.style.boxShadow = isLightToast
    ? "0 12px 36px rgba(89, 35, 139, 0.12)"
    : "0 12px 30px rgba(0, 0, 0, 0.25)";
  toast.innerHTML = '<span class="text-sm font-medium"></span>';

  (document.body || document.documentElement).appendChild(toast);
  return toast;
}

function showToast(message, options = {}) {
  const toast = ensureToastElement();
  const isLightToast = document.body.classList.contains("light-mode");
  toast.style.background = isLightToast
    ? "rgba(255, 255, 255, 0.92)"
    : "rgba(15, 10, 30, 0.92)";
  toast.style.color = isLightToast ? "#2f0f4f" : "#f5e8ff";
  toast.style.border = isLightToast
    ? "1px solid rgba(107, 33, 168, 0.18)"
    : "1px solid rgba(168, 85, 247, 0.35)";
  toast.style.boxShadow = isLightToast
    ? "0 12px 36px rgba(89, 35, 139, 0.12)"
    : "0 12px 30px rgba(0, 0, 0, 0.25)";

  const span = toast.querySelector("span");
  if (span) span.textContent = message;

  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  const duration = options.duration || 3500;
  const resetText = options.resetText || "";
  window.clearTimeout(toast._toastTimer);
  toast._toastTimer = window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    if (resetText && span) {
      window.setTimeout(() => {
        span.textContent = resetText;
      }, 300);
    }
  }, duration);
}

function screenshotQuote(panelId, type, btnEl) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const orderElId = type === "vp" ? "orderIdVP" : "orderIdAnim";
  const orderEl = document.getElementById(orderElId);
  let orderId = orderEl ? orderEl.textContent.trim() : "";

  if (!orderId || orderId === "—") {
    orderId = generateOrderNumber(type);
    if (orderEl) orderEl.textContent = orderId;
  }

  const btnState = setBtnLoading(btnEl);

  if (!window.html2canvas) {
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => doScreenshot(panel, orderId, btnState);
    s.onerror = () => restoreBtnLoading(btnState);
    document.head.appendChild(s);
  } else {
    doScreenshot(panel, orderId, btnState);
  }
}

function setBtnLoading(btnEl) {
  if (!btnEl) return null;
  const iconEl = btnEl.querySelector("i");
  const textEl = btnEl.querySelector("span");
  const state = {
    btnEl,
    iconEl,
    textEl,
    prevIconClass: iconEl ? iconEl.className : "",
    prevText: textEl ? textEl.textContent : "",
    prevDisabled: btnEl.disabled,
  };
  btnEl.disabled = true;
  if (iconEl) iconEl.className = "fa-solid fa-spinner fa-spin";
  if (textEl) {
    const dict =
      typeof currentLang !== "undefined" && I18N[currentLang]
        ? I18N[currentLang]
        : I18N["zh-TW"];
    textEl.textContent = dict.sidebar_screenshot_loading || "產生中⋯";
  }
  return state;
}
function restoreBtnLoading(state) {
  if (!state) return;
  state.btnEl.disabled = state.prevDisabled;
  if (state.iconEl) state.iconEl.className = state.prevIconClass;
  if (state.textEl) state.textEl.textContent = state.prevText;
}

function buildQuoteScreenshotCard(panel, orderId) {
  const titleText =
    panel.querySelector('[data-i18n="sidebar_total"]')?.textContent.trim() ||
    "預估總金額";
  const breakdownText =
    panel.querySelector('[data-i18n="sidebar_breakdown"]')?.textContent.trim() ||
    "報價明細";
  const totalValue =
    panel.querySelector("#totalPrice, #animTotalPrice, #tmplTotalPrice")?.textContent.trim() ||
    "NT$ 0";
  const depositInfo = panel.querySelector("#depositInfo")?.innerHTML.trim() || "";
  const detailContainer =
    panel.querySelector("#detailList, #animDetailList, #tmplDetailList");
  const rushText =
    panel.querySelector("#quoteRushSummaryText")?.textContent.trim() ||
    document.getElementById("rushInfo")?.value.trim() || "";
  const suppText =
    panel.querySelector("#quoteSuppSummaryText")?.textContent.trim() ||
    document.getElementById("supplementInfo")?.value.trim() || "";
  const details = [];
  if (detailContainer) {
    Array.from(detailContainer.children).forEach((row) => {
      if (!(row instanceof HTMLElement)) return;
      const cols = row.querySelectorAll("span");
      const name = cols[0]?.textContent.trim() || row.textContent.trim();
      const value = cols[1]?.textContent.trim() || "";
      if (name) {
        details.push({ name, value });
      }
    });
  }

  const card = document.createElement("div");
  card.style.position = "absolute";
  card.style.left = "-9999px";
  card.style.top = "-9999px";
  card.style.zIndex = "-9999";
  card.style.background = "#220847";
  card.style.color = "#f8f4ff";
  card.style.padding = "28px";
  card.style.width = "720px";
  card.style.borderRadius = "32px";
  card.style.boxSizing = "border-box";
  card.style.fontFamily = "Noto Sans TC, Arial, sans-serif";
  card.style.lineHeight = "1.45";
  card.style.overflow = "hidden";
  card.style.boxShadow = "0 20px 70px rgba(0, 0, 0, 0.35)";
  card.style.border = "1px solid rgba(255,255,255,0.06)";
  card.style.background = "linear-gradient(180deg, rgba(34,14,77,0.96), rgba(18,7,50,0.96))";
  card.style.pointerEvents = "none";

  const depositBlock = depositInfo
    ? `<div style="margin-bottom:18px;padding:18px 20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:22px;font-size:0.95rem;line-height:1.6;">
        ${depositInfo}
      </div>`
    : "";

  const activeNotes = [];
  if (rushText) {
    activeNotes.push({
      label: "加急趕工說明",
      content: rushText,
      color: "#fbcfe8",
      bg: "rgba(248, 113, 255, 0.12)",
      border: "rgba(248, 113, 255, 0.2)",
    });
  }
  if (suppText) {
    activeNotes.push({
      label: "補充資訊",
      content: suppText,
      color: "#c4b5fd",
      bg: "rgba(192, 132, 252, 0.12)",
      border: "rgba(192, 132, 252, 0.2)",
    });
  }

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px;">
      <div style="min-width:0;flex:1;">
        <div style="font-size:0.78rem;font-weight:700;letter-spacing:0.18em;color:#d8b4fe;margin-bottom:10px;">表單編號</div>
        <div style="font-size:1.05rem;font-weight:900;color:#fff;word-break:break-all;">${orderId}</div>
      </div>
      <div style="text-align:right;flex:1;min-width:0;">
        <div style="font-size:0.9rem;font-weight:700;color:#d8b4fe;margin-bottom:10px;">${titleText}</div>
        <div style="font-size:3.2rem;font-weight:900;letter-spacing:-0.05em;color:#fff;">${totalValue}</div>
      </div>
    </div>
    ${depositBlock}
    <div>
      <div style="font-size:1rem;font-weight:800;color:#f3e8ff;letter-spacing:0.02em;margin-bottom:18px;">${breakdownText}</div>
      <div style="display:grid;gap:10px;">
        ${details
          .map(
            (item, idx) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;font-size:0.95rem;color:#f8f4ff;padding:10px 6px;border-bottom:1px solid rgba(255,255,255,0.04);">
                 <span style="flex:1;min-width:0;line-height:1.4;">${item.name}</span>
                 <span style="font-weight:700;white-space:nowrap;">${item.value}</span>
               </div>`,
          )
          .join("")}
      </div>
    </div>
    ${
      activeNotes.length
        ? `<div style="margin-top:26px;display:grid;gap:14px;">
            ${activeNotes
              .map(
                (note) =>
                  `<div style="padding:16px 18px;background:${note.bg};border:1px solid ${note.border};border-radius:20px;">
                     <div style="font-size:0.85rem;font-weight:700;color:${note.color};margin-bottom:8px;">${note.label}</div>
                     <div style="font-size:0.92rem;color:#f8f4ff;line-height:1.6;">${note.content}</div>
                   </div>`,
              )
              .join("")}
          </div>`
        : ""
    }
  `;

  return card;
}

function doScreenshot(panel, orderId, btnState) {
  const toast = ensureToastElement();
  toast.style.opacity = "0";
  toast.style.pointerEvents = "none";

  const tempCard = buildQuoteScreenshotCard(panel, orderId);
  document.body.appendChild(tempCard);

  if (typeof window.html2canvas !== "function") {
    tempCard.remove();
    restoreBtnLoading(btnState);
    alert("截圖功能目前無法載入，請稍後再試或改用瀏覽器截圖。");
    return;
  }

  const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const cardWidth = tempCard.offsetWidth;
  const cardHeight = tempCard.offsetHeight;

  window
    .html2canvas(tempCard, {
      backgroundColor: null,
      scale,
      useCORS: true,
      logging: false,
      width: cardWidth,
      height: cardHeight,
      windowWidth: cardWidth,
      windowHeight: cardHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      ignoreElements: (el) => el.closest("[data-html2canvas-ignore]") !== null,
    })
    .then((canvas) => {
      tempCard.remove();
      restoreBtnLoading(btnState);
      const link = document.createElement("a");
      link.download = `${orderId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      const dict =
        typeof currentLang !== "undefined" && I18N[currentLang]
          ? I18N[currentLang]
          : I18N["zh-TW"];
      const savedMsg =
        (dict.toast_screenshot_saved || "截圖已儲存！") + ` 編號：${orderId}`;
      const defaultMsg = dict.toast_copied || "已複製到剪貼簿！";
      showToast(savedMsg, { duration: 4000, resetText: defaultMsg });
    })
    .catch((e) => {
      tempCard.remove();
      restoreBtnLoading(btnState);
      alert("截圖失敗，請改用瀏覽器的截圖功能。");
    });
}

const ulbGroups = {
  stickers: [],
  logos: [],
  fanart: [],
};

const ULB_VIDEO_GROUPS = ["stickers", "logos"];
let ulbCurrent = { group: "stickers", idx: 0 };

function ulbOpen(group, idx) {
  const items = ulbGroups[group];
  if (!items || !items.length) return;
  ulbCurrent = { group, idx: Math.max(0, Math.min(idx, items.length - 1)) };
  document.getElementById("unifiedLightbox").classList.add("open");
  document.body.style.overflow = "hidden";
  ulbRender();
}

function ulbClose() {
  document.getElementById("unifiedLightbox").classList.remove("open");
  document.body.style.overflow = "";

  const videoEl = document.getElementById("ulbVideo");
  if (videoEl) videoEl.pause();
}

function ulbNav(dir) {
  const items = ulbGroups[ulbCurrent.group];
  ulbCurrent.idx = (ulbCurrent.idx + dir + items.length) % items.length;
  ulbRender();
}

function ulbRender() {
  const items = ulbGroups[ulbCurrent.group];
  const idx = ulbCurrent.idx;
  const isVideo = ULB_VIDEO_GROUPS.indexOf(ulbCurrent.group) !== -1;
  const item = items[idx];
  const imgEl = document.getElementById("ulbImg");
  const videoEl = document.getElementById("ulbVideo");

  if (isVideo && videoEl) {
    if (imgEl) imgEl.style.display = "none";
    videoEl.style.display = "block";
    videoEl.poster = item.poster || "";
    videoEl.style.opacity = "0";
    videoEl.src = item.src;
    videoEl.oncanplay = () => {
      videoEl.style.transition = "opacity 0.2s";
      videoEl.style.opacity = "1";
      videoEl.play().catch(() => {});
    };
  } else {
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      videoEl.style.display = "none";
    }
    if (imgEl) {
      imgEl.style.display = "block";
      imgEl.style.opacity = "0";
      imgEl.src = item;
      imgEl.onload = () => {
        imgEl.style.transition = "opacity 0.2s";
        imgEl.style.opacity = "1";
      };
    }
  }

  const isMulti = ulbCurrent.group === "fanart";

  const dotsEl = document.getElementById("ulbDots");
  if (dotsEl) {
    if (isMulti && items.length > 1) {
      dotsEl.innerHTML = items
        .map(
          (_, i) =>
            `<span class="ulb-dot${i === idx ? " active" : ""}" onclick="ulbCurrent.idx=${i};ulbRender()"></span>`,
        )
        .join("");
    } else {
      dotsEl.innerHTML = "";
    }
  }

  const show = isMulti && items.length > 1;
  const prev = document.getElementById("ulbPrev");
  const next = document.getElementById("ulbNext");
  if (prev) prev.style.display = show ? "flex" : "none";
  if (next) next.style.display = show ? "flex" : "none";
}

document.addEventListener("keydown", (e) => {
  const lb = document.getElementById("unifiedLightbox");
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") ulbClose();
  else if (e.key === "ArrowLeft") ulbNav(-1);
  else if (e.key === "ArrowRight") ulbNav(1);
});

document.addEventListener("DOMContentLoaded", function () {
  let tx = 0;
  const el = document.getElementById("unifiedLightbox");
  if (el) {
    el.addEventListener(
      "touchstart",
      (e) => {
        tx = e.touches[0].clientX;
      },
      { passive: true },
    );
    el.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 50) ulbNav(dx < 0 ? 1 : -1);
      },
      { passive: true },
    );
  }
});

function getIntroBubbles() {
  const _d =
    typeof currentLang !== "undefined" && I18N[currentLang]
      ? I18N[currentLang]
      : I18N["zh-TW"];
  return (
    _d.intro_bubbles || [
      "你好呀！歡迎來到我的委託頁面！ ✨",
      "有任何問題都可以寄信給我喔！",
      "建模就是把角色的靈魂喚醒！ 🐱",
      "委託開放中，快來找我委託！",
      "做 Live2D 是我最快樂的事 💜",
      "謝謝你點我！你是最棒的！ (≧▽≦)",
      "每個角色都是獨一無二的作品 ✦",
      "歡迎查看我的 X 作品集！",
    ]
  );
}
function getCollabBubbles() {
  const _d =
    typeof currentLang !== "undefined" && I18N[currentLang]
      ? I18N[currentLang]
      : I18N["zh-TW"];
  return (
    _d.collab_bubbles || [
      "別敲我！我是乖寶寶！",
      "我沒有藏任何秘密！",
      "你知道這個網站有藏著科樂美彩蛋嗎？",
      "我需要更多的合作繪師！",
    ]
  );
}
const bubbleTimers = {};
function showBubble(el, type) {
  const existing = el.parentElement.querySelector(".speech-bubble");
  if (existing) existing.remove();
  clearTimeout(bubbleTimers[type]);

  const msgs = type === "intro" ? getIntroBubbles() : getCollabBubbles();
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  const bubble = document.createElement("div");
  bubble.className = "speech-bubble";
  bubble.textContent = msg;
  el.parentElement.style.position = "relative";
  el.parentElement.appendChild(bubble);

  bubbleTimers[type] = setTimeout(() => bubble.remove(), 2600);
}

let _sfxCtx = null;
function getSfxCtx() {
  if (!_sfxCtx) {
    _sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (_sfxCtx.state === "suspended") {
    try {
      _sfxCtx.resume();
    } catch (e) {}
  }
  return _sfxCtx;
}
function playIntroSound() {
  try {
    const ctx = getSfxCtx();

    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch (e) {}
}
function playBonk() {
  try {
    const ctx = getSfxCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(300, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    o.start();
    o.stop(ctx.currentTime + 0.28);
  } catch (e) {}
}

function toggleTheme() {
  document.body.classList.add("theme-transition");
  clearTimeout(window._themeTransitionTimer);
  window._themeTransitionTimer = setTimeout(function () {
    document.body.classList.remove("theme-transition");
  }, 600);
  document.body.classList.toggle("light-mode");
  const icon = document.getElementById("themeIcon");
  const isLight = document.body.classList.contains("light-mode");
  if (isLight) {
    icon.className = "fa-solid fa-moon text-purple-500";
    if (window.setMeteorMode) window.setMeteorMode(true);
  } else {
    icon.className = "fa-solid fa-sun text-yellow-400";
    if (window.setMeteorMode) window.setMeteorMode(false);
  }
  try {
    localStorage.setItem("hakka_theme", isLight ? "light" : "dark");
  } catch (e) {}
}

(function () {
  try {
    const saved = localStorage.getItem("hakka_theme");
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    const shouldLight = saved === "light" || (saved === null && prefersLight);
    if (shouldLight) {
      document.body.classList.add("light-mode");
      const icon = document.getElementById("themeIcon");
      if (icon) icon.className = "fa-solid fa-moon text-purple-500";
      if (window.setMeteorMode) window.setMeteorMode(true);
    }
  } catch (e) {}

  try {
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => {
        let saved = null;
        try {
          saved = localStorage.getItem("hakka_theme");
        } catch (_) {}
        if (saved !== null) return;
        const icon = document.getElementById("themeIcon");
        if (e.matches) {
          document.body.classList.add("light-mode");
          if (icon) icon.className = "fa-solid fa-moon text-purple-500";
          if (window.setMeteorMode) window.setMeteorMode(true);
        } else {
          document.body.classList.remove("light-mode");
          if (icon) icon.className = "fa-solid fa-sun text-yellow-400";
          if (window.setMeteorMode) window.setMeteorMode(false);
        }
      });
  } catch (e) {}
})();

function closeDropdowns() {
  ["comm", "creative"].forEach((k) => {
    const dd = document.getElementById(k + "Dropdown");
    if (dd) dd.classList.add("hidden");
    document
      .getElementById(k + "DropdownWrap")
      ?.classList.remove("nav-dropdown-open");
  });
}
function toggleNavDropdown(e, key) {
  e.stopPropagation();
  const dd = document.getElementById(key + "Dropdown");
  const ddWrap = document.getElementById(key + "DropdownWrap");
  const other = key === "comm" ? "creativeDropdown" : "commDropdown";
  const otherWrap =
    key === "comm" ? "creativeDropdownWrap" : "commDropdownWrap";
  document.getElementById(other)?.classList.add("hidden");
  document.getElementById(otherWrap)?.classList.remove("nav-dropdown-open");
  dd.classList.toggle("hidden");

  ddWrap?.classList.toggle(
    "nav-dropdown-open",
    !dd.classList.contains("hidden"),
  );
}
document.addEventListener("click", (e) => {
  if (
    !document.getElementById("commDropdownWrap")?.contains(e.target) &&
    !document.getElementById("creativeDropdownWrap")?.contains(e.target)
  ) {
    closeDropdowns();
  }
});

function switchTab(tabId) {
  if (tabId === undefined) return;
  closeDropdowns();

  const targetPage = document.getElementById("page-" + tabId);

  (function () {
    document.querySelectorAll(".tab-btn").forEach((el) => {
      el.classList.remove("active", "text-white");
      el.classList.add("text-purple-300");
    });
    var activeBtn = null;
    if (["rules", "core", "anim", "template"].includes(tabId)) {
      activeBtn = document.getElementById("tab-comm-trigger");
    } else if (["model", "portfolio", "channels", "fanart"].includes(tabId)) {
      activeBtn = document.getElementById("tab-creative-trigger");
    } else {
      activeBtn = document.getElementById("tab-" + tabId);
    }
    if (activeBtn) {
      activeBtn.classList.add("active", "text-white");
      activeBtn.classList.remove("text-purple-300");
    }
  })();

  if (tabId === "template") {
  } else if (tabId === "model") initLive2DDemo();
  else if (tabId === "fanart") loadFanart();
  else if (tabId === "portfolio") {
    gifEnsureInit();
  }
}

function copyToClipboardFallback(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("已複製到剪貼簿！", { duration: 3500 });
  } catch (err) {
    alert("瀏覽器阻擋複製，請手動框選文字複製！");
  }
  document.body.removeChild(textArea);
}

function formatMoney(num) {
  var locale = typeof currentLang !== "undefined" ? currentLang : "zh-TW";
  var localeMap = {
    "zh-TW": "zh-TW",
    "zh-CN": "zh-CN",
    en: "en-US",
    ja: "ja-JP",
  };
  return Math.round(num).toLocaleString(localeMap[locale] || "zh-TW");
}

function getCurrencyPrefix() {
  return "NT$ ";
}

function debounce(fn, ms) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), ms);
  };
}

function syncCheckboxVisuals() {
  document
    .querySelectorAll(
      'input[type="checkbox"].sr-only, input[type="radio"].sr-only',
    )
    .forEach((input) => {
      const label = input.closest("label");
      if (!label) return;
      const box = label.querySelector(".w-6.h-6");
      const icon = label.querySelector(".fa-check");
      if (box) {
        if (input.checked) {
          box.style.backgroundColor = "var(--accent-primary)";
          box.style.borderColor = "var(--accent-primary)";
        } else {
          box.style.backgroundColor = "";
          box.style.borderColor = "";
        }
      }
      if (icon) {
        icon.style.opacity = input.checked ? "1" : "0";
      }

      if (input.checked) {
        label.style.borderColor = "var(--accent-primary)";
        label.style.background = "rgba(139,92,246,0.15)";
        label.style.boxShadow = "0 0 20px rgba(139,92,246,0.4) inset";
      } else {
        label.style.borderColor = "";
        label.style.background = "";
        label.style.boxShadow = "";
      }
    });
}

function bindCheckboxSync() {
  document
    .querySelectorAll(
      'input[type="checkbox"].sr-only, input[type="radio"].sr-only',
    )
    .forEach((input) => {
      input.addEventListener("change", () => {
        setTimeout(syncCheckboxVisuals, 0);
      });
    });
}

function getFormUrl(key) {
  const lang = typeof currentLang !== "undefined" ? currentLang : "zh-TW";
  const suffix = lang === "en" || lang === "ja" ? "_en" : "";
  const url = window.FORM_URLS[key + suffix];
  return url && url.trim() !== "" ? url : window.FORM_URLS[key] || "#";
}

function applyFormUrls() {
  document.querySelectorAll("[data-form-key]").forEach(function (el) {
    const key = el.getAttribute("data-form-key");
    el.href = getFormUrl(key);
  });
}

function getScheduleUrl(key) {
  const lang = typeof currentLang !== "undefined" ? currentLang : "zh-TW";
  const suffix = lang === "en" ? "_en" : lang === "ja" ? "_ja" : lang === "zh-CN" ? "_zhCN" : "";
  const scheduleUrls = window.SCHEDULE_URLS || {};
  const url = scheduleUrls[key + suffix] || scheduleUrls[key];
  return url && url.trim() !== "" ? url : "#";
}

function applyScheduleUrls() {
  document.querySelectorAll("[data-schedule-key]").forEach(function (el) {
    const key = el.getAttribute("data-schedule-key");
    el.href = getScheduleUrl(key);
  });
}

document.addEventListener("DOMContentLoaded", applyFormUrls);
document.addEventListener("DOMContentLoaded", applyScheduleUrls);

(function () {
  const badge = document.getElementById("commissionBadge");
  if (!badge) return;
  if (window.IS_COMMISSION_OPEN) {
    badge.className =
      "text-sm bg-green-500/20 text-green-400 px-3 py-1.5 rounded-md flex items-center gap-2 font-bold";
    badge.innerHTML = `<span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> ${typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].comm_open : "開放委託中"}`;
  } else {
    badge.className =
      "text-sm bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-md flex items-center gap-2 font-bold";
    badge.innerHTML = `<span class="w-2 h-2 bg-orange-500 rounded-full"></span> ${typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].comm_closed : "委託暫停中"}`;
  }
})();

let _myLiveStatus = false;

function setLiveStatus(isLive) {
  if (typeof isLive !== "undefined") _myLiveStatus = isLive;
  const live = _myLiveStatus;
  const applyStatus = (dotId, textId, badgeId, sm) => {
    const dot = document.getElementById(dotId);
    const text = document.getElementById(textId);
    const badge = document.getElementById(badgeId);
    if (!dot) return;
    const _d =
      typeof currentLang !== "undefined" && I18N[currentLang]
        ? I18N[currentLang]
        : I18N["zh-TW"];
    if (live) {
      dot.className = sm
        ? "w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"
        : "w-2 h-2 rounded-full bg-red-500 animate-ping";
      text.textContent = _d.live_on || "Twitch 直播中！";
      badge.className =
        (sm ? "text-xs" : "text-sm") +
        " px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold bg-red-500/20 text-red-400 border border-red-500/30";
    } else {
      dot.className = sm
        ? "w-1.5 h-1.5 rounded-full bg-gray-500"
        : "w-2 h-2 rounded-full bg-gray-500";
      text.textContent = _d.live_off || "Twitch 未直播";
      badge.className =
        (sm ? "text-xs" : "text-sm") +
        " px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold bg-gray-500/20 text-gray-400";
    }
  };
  applyStatus("liveDot", "liveText", "twitterLiveBadge", false);
}

async function checkMyLiveStatus() {
  const channel = "hakkanekolive2d";

  const endpoints = [
    () =>
      fetch(`https://decapi.me/twitch/uptime/${channel}`, {
        signal: AbortSignal.timeout(5000),
      })
        .then((r) => r.text())
        .then(
          (t) =>
            !t.includes("offline") &&
            !t.includes("error") &&
            t.trim().length > 3,
        ),
    () =>
      fetch(`https://api.ivr.fi/v2/twitch/user?login=${channel}`, {
        signal: AbortSignal.timeout(5000),
      })
        .then((r) => r.json())
        .then((d) => !!(d[0] && d[0].stream)),
  ];
  for (const endpoint of endpoints) {
    try {
      const live = await endpoint();
      setLiveStatus(live);
      return;
    } catch (e) {}
  }
}

const fyEl = document.getElementById("footerYear");
if (fyEl) fyEl.textContent = new Date().getFullYear();

function checkAllChannels() {}

window.addEventListener("focus", () => {
  const portfolioPage = document.getElementById("page-portfolio");
  if (portfolioPage && !portfolioPage.classList.contains("gif-hidden")) {
    portfolioPage.style.transform = "translateZ(0)";
  }
});

function initPage() {
  function _safe(fn) {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
      console.warn("[init]", e);
    }
  }
  var _firstPage = document.querySelector(".page-content");
  if (_firstPage) {
    _safe(function () {
      switchTab(_firstPage.id.replace("page-", ""));
    });
  }
  _safe(bindCheckboxSync);
  _safe(syncCheckboxVisuals);

  if (document.getElementById("twitterLiveBadge")) {
    _safe(setLiveStatus);
    setTimeout(() => checkMyLiveStatus(), 0);
    setInterval(checkMyLiveStatus, 3 * 60 * 1000);
  }
  _safe(initNoteToggles);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}

function copySummaryToClipboard(type) {
  const _d =
    typeof currentLang !== "undefined" && I18N[currentLang]
      ? I18N[currentLang]
      : I18N["zh-TW"];
  const authorName = _d.name_short || "阿卡貓 HakkaNeko";

  const NL = "\r\n";
  const DIV = "──────────────────────────────";
  let lines = [];

  if (type === "vp") {
    const details = window.currentVpDetails || [];
    const total = window.currentVpTotal || 0;
    const plan = details.length > 0 ? details[0].name : "—";
    const addons = details.slice(1);
    const orderId = (
      document.getElementById("orderIdVP")?.textContent || ""
    ).trim();
    const isRush = document.getElementById("rush")?.checked || false;
    const rushNote = (document.getElementById("rushInfo")?.value || "").trim();
    const suppNote = (
      document.getElementById("supplementInfo")?.value || ""
    ).trim();

    lines.push(
      `📋 ${authorName} ${_d.summary_vp_title || "Live2D V皮設計 委託需求清單"}`,
    );
    lines.push(DIV);
    lines.push(
      `▸ ${_d.summary_order_id || "委託編號"}：${orderId && orderId !== "—" ? orderId : _d.summary_order_id_pending || "（請先勾選同意條款以生成）"}`,
    );
    lines.push(`▸ ${_d.summary_plan || "方案選擇"}：${plan}`);
    if (addons.length) {
      lines.push(`▸ ${_d.summary_addons || "加購項目"}：`);
      addons.forEach((i) =>
        lines.push(
          `   ✦ ${i.name}：${getCurrencyPrefix()}${formatMoney(i.price)}`,
        ),
      );
    }
    lines.push(
      `▸ ${_d.opt_rush || "加急趕工"}：${isRush ? _d.label_rush_yes || "是 / 已加急" : _d.label_no || "否"}`,
    );
    if (isRush && rushNote) {
      lines.push("");
      rushNote.split(/\r?\n/).forEach((l) => lines.push("  " + l));
    }
    lines.push("");
    lines.push(`▸ ${_d.sidebar_supp_label || "補充資訊"}：`);
    (suppNote || _d.label_none || "無")
      .split(/\r?\n/)
      .forEach((l) => lines.push("  " + l));
    lines.push("");
    lines.push(
      `▸ ${_d.summary_total || "預算總計"}：${getCurrencyPrefix()}${formatMoney(total)}`,
    );
    // 如果為分期付款，補上各期金額說明（顯示完整數字）
    const paymentPlan =
      window.currentPaymentPlan ||
      document.querySelector('input[name="paymentPlan"]:checked')?.value ||
      "one";
    if (paymentPlan === "two") {
      const first = Math.round(total * 0.5);
      const second = total - first;
      lines.push(`▸ 分期付款：兩期`);
      lines.push(`   第一期 (50%): ${getCurrencyPrefix()}${formatMoney(first)}`);
      lines.push(`   第二期 (50%): ${getCurrencyPrefix()}${formatMoney(second)}`);
    } else if (paymentPlan === "three") {
      const first = Math.round(total * 0.4);
      const second = Math.round(total * 0.3);
      const third = total - first - second;
      lines.push(`▸ 分期付款：三期`);
      lines.push(`   第一期 (40%): ${getCurrencyPrefix()}${formatMoney(first)}`);
      lines.push(`   第二期 (30%): ${getCurrencyPrefix()}${formatMoney(second)}`);
      lines.push(`   第三期 (30%): ${getCurrencyPrefix()}${formatMoney(third)}`);
    }
    lines.push(DIV);
  } else {
    const details = window.currentAnimDetails || [];
    const total = window.currentAnimTotal || 0;
    const orderId = (
      document.getElementById("orderIdAnim")?.textContent || ""
    ).trim();
    const isRush = document.getElementById("animRush")?.checked || false;
    const rushNote = (
      document.getElementById("animRushInfo")?.value || ""
    ).trim();
    const suppNote = (
      document.getElementById("animSupplementInfo")?.value || ""
    ).trim();

    lines.push(
      `📋 ${authorName} ${_d.summary_anim_title || "Live2D 動畫設計 委託需求清單"}`,
    );
    lines.push(DIV);
    lines.push(
      `▸ ${_d.summary_order_id || "委託編號"}：${orderId && orderId !== "—" ? orderId : _d.summary_order_id_pending || "（請先勾選同意條款以生成）"}`,
    );
    lines.push(`▸ ${_d.summary_items || "委託項目"}：`);
    details.forEach((i) =>
      lines.push(
        `   ✦ ${i.name}：${getCurrencyPrefix()}${formatMoney(i.price)}`,
      ),
    );
    lines.push(
      `▸ ${_d.opt_rush || "加急趕工"}：${isRush ? _d.label_rush_yes || "是 / 已加急" : _d.label_no || "否"}`,
    );
    if (isRush && rushNote) {
      lines.push("");
      rushNote.split(/\r?\n/).forEach((l) => lines.push("  " + l));
    }
    lines.push("");
    lines.push(`▸ ${_d.sidebar_supp_label || "補充資訊"}：`);
    (suppNote || _d.label_none || "無")
      .split(/\r?\n/)
      .forEach((l) => lines.push("  " + l));
    lines.push("");
    lines.push(
      `▸ ${_d.summary_total || "預算總計"}：${getCurrencyPrefix()}${formatMoney(total)}`,
    );
    lines.push(DIV);
  }

  const text = lines.join(NL);

  // 不再自動附加 X(Twitter) 警告文字，直接使用原始文字
  const textForCopy = text.replace(/\r\n/g, "\n");

  const btnId = type === "vp" ? "btn-copy-summary-vp" : "btn-copy-summary-anim";
  const btn = document.getElementById(btnId);

  copyToClipboardFallback(textForCopy);

  if (btn) {
    btn.classList.add("copied");
    const span = btn.querySelector("span");
    const origText = span ? span.textContent : "";
    if (span) span.textContent = "✓ " + (_d.toast_copied || "已複製！");
    setTimeout(function () {
      btn.classList.remove("copied");
      if (span) span.textContent = origText;
    }, 2200);
  }

  const toast = ensureToastElement();
  const msg = _d.toast_summary_copied || "委託清單已複製至剪貼簿！";
  showToast(msg, {
    duration: 3500,
    resetText: _d.toast_copied || "已複製到剪貼簿！",
  });
}

function scrollToRules() {
  if (!document.getElementById("page-rules")) {
    window.location.href = (window.SITE_BASE || "") + "commission/rules/";
    return;
  }
  switchTab("rules");

  setTimeout(function () {
    var rulesEl = document.getElementById("page-rules");
    if (rulesEl) {
      rulesEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 80);
}

let backToTopBtn = document.getElementById("backToTop");
if (!backToTopBtn) {
  backToTopBtn = document.createElement("button");
  backToTopBtn.id = "backToTop";
  backToTopBtn.type = "button";
  backToTopBtn.setAttribute("aria-label", "Back to top");
  backToTopBtn.innerHTML =
    '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(backToTopBtn);
}
let _scrollRafPending = false;
function _handleScrollFrame() {
  const y = window.scrollY;
  if (y > 300) backToTopBtn.classList.add("show");
  else backToTopBtn.classList.remove("show");
  _scrollRafPending = false;
}
window.addEventListener(
  "scroll",
  function () {
    if (!_scrollRafPending) {
      _scrollRafPending = true;
      window.requestAnimationFrame(_handleScrollFrame);
    }
  },
  { passive: true },
);

(function () {
  let revealSeq = 0;
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => a.target._revealSeq - b.target._revealSeq);
      const n = visible.length;

      const step = Math.min(90, 500 / n);
      visible.forEach((e, i) => {
        io.unobserve(e.target);
        const delayMs = Math.round(i * step);
        setTimeout(function () {
          e.target.classList.add("visible");
        }, delayMs);
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -20px 0px" },
  );

  function attachReveal(page) {
    const els = page.querySelectorAll(
      ".glass-panel:not(.no-reveal), .faq-item",
    );
    els.forEach((el) => {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");

      el._revealSeq = revealSeq++;
      io.observe(el);
    });
  }

  window.attachReveal = attachReveal;

  const currentPage = document.querySelector(".page-content");
  if (currentPage) attachReveal(currentPage);
})();

function initScrollFollowPanel(panelSelector, containerId) {
  const panel = document.querySelector(panelSelector);
  const container = document.getElementById(containerId);
  if (!panel || !container) return;
  let currentY = 0;
  let targetY = 0;
  let isAnimating = false;

  const ease = 0.1;

  function updatePosition() {
    if (window.innerWidth < 1024) {
      panel.style.transform = "none";
      isAnimating = false;
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const topOffset = 24;
    if (containerRect.top < topOffset) {
      const maxTranslateY = Math.max(0, containerRect.height - panelHeight);
      targetY = Math.min(
        Math.abs(containerRect.top - topOffset),
        maxTranslateY,
      );
    } else {
      targetY = 0;
    }
    currentY += (targetY - currentY) * ease;
    if (Math.abs(targetY - currentY) < 0.1) currentY = targetY;
    panel.style.transform = `translateY(${currentY}px)`;
    if (Math.abs(targetY - currentY) >= 0.1) {
      requestAnimationFrame(updatePosition);
    } else {
      isAnimating = false;
    }
  }
  function onScrollOrResize() {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(updatePosition);
    }
  }
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  onScrollOrResize();
}

function initFloatingQuoteBar(panelId, priceId, prefix) {
  var panel = document.getElementById(panelId);
  var priceEl = document.getElementById(priceId);
  var bar = document.getElementById("floatingQuoteBar");
  var barPriceEl = document.getElementById("floatingQuoteBarPrice");
  if (!panel || !priceEl || !bar || !barPriceEl) return;

  function syncPrice() {
    barPriceEl.textContent = (prefix || "") + priceEl.textContent;
  }
  syncPrice();

  new MutationObserver(syncPrice).observe(priceEl, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  function updateVisibility() {
    var rect = panel.getBoundingClientRect();

    var shouldShow = rect.bottom < 60;
    bar.classList.toggle("visible", shouldShow);
  }
  updateVisibility();
  window.addEventListener("scroll", debounce(updateVisibility, 50), {
    passive: true,
  });
  window.addEventListener("resize", debounce(updateVisibility, 100));

  bar.addEventListener("click", function () {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function flashAmount(el, variant) {
  if (!el) return;

  var cls = variant === "fuchsia" ? "amount-flash-fuchsia" : "amount-flash";
  el.classList.remove("amount-flash", "amount-flash-fuchsia");

  void el.offsetWidth;
  el.classList.add(cls);
}

function whenPanelVisible(el, cb) {
  if (!el || typeof cb !== "function") return;
  const panel = el.closest(".reveal");
  if (panel && !panel.classList.contains("visible")) {
    const mo = new MutationObserver(function () {
      if (panel.classList.contains("visible")) {
        mo.disconnect();
        cb();
      }
    });
    mo.observe(panel, { attributes: true, attributeFilter: ["class"] });
  } else {
    cb();
  }
}
window.whenPanelVisible = whenPanelVisible;

function revealAmountOnLoad(el) {
  if (!el) return;

  el.classList.remove("price-skeleton");
  function play() {
    el.classList.remove("amount-enter");
    void el.offsetWidth;
    el.classList.add("amount-enter");
  }

  whenPanelVisible(el, play);
}

function initNoteToggles() {
  const notes = [
    { wrapperId: "quoteRushSummary", textId: "quoteRushSummaryText" },
    { wrapperId: "quoteSuppSummary", textId: "quoteSuppSummaryText" },
  ];

  notes.forEach((n) => {
    const wrap = document.getElementById(n.wrapperId);
    const textEl = document.getElementById(n.textId);
    if (!wrap || !textEl) return;

    // if there's no content, keep it hidden
    if (!textEl.textContent.trim()) {
      wrap.classList.add("hidden");
    }

    // find the title paragraph
    const title = wrap.querySelector(".font-bold") || wrap.querySelector("p");
    if (!title) return;

    // create toggle button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "note-toggle";
    btn.setAttribute("aria-expanded", "true");
    btn.innerHTML = '<i class="fa-solid fa-chevron-down note-arrow" aria-hidden="true"></i>';
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.padding = "0";
    btn.style.marginLeft = "0.5rem";
    btn.style.cursor = "pointer";

    // make title layout flex and append toggle
    title.style.display = "flex";
    title.style.justifyContent = "space-between";
    title.style.alignItems = "center";
    title.appendChild(btn);
    // make the whole title act like a button (not only the small chevron)
    title.style.cursor = "pointer";
    title.setAttribute("role", "button");
    title.tabIndex = 0;

    // wrap the textEl inside a note-body for easy collapse
    const body = document.createElement("div");
    body.className = "note-body";
    // move textEl into body
    wrap.replaceChild(body, textEl);
    body.appendChild(textEl);

    // initial state: expanded when there is content
    function setOpen(open) {
      if (open) {
        body.classList.remove("hidden");
        btn.setAttribute("aria-expanded", "true");
        const arrow = btn.querySelector(".note-arrow");
        if (arrow) arrow.style.transform = "rotate(0deg)";
      } else {
        body.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
        const arrow = btn.querySelector(".note-arrow");
        if (arrow) arrow.style.transform = "rotate(-90deg)";
      }
    }

    // 初始為收合狀態
    setOpen(false);

    // 如果內容變動（使用者輸入），自動顯示按鈕並展開
    const mo = new MutationObserver(() => {
      const hasContent = textEl.textContent.trim().length > 0;
      wrap.classList.toggle("hidden", !hasContent);
      if (hasContent) setOpen(false); // keep closed but ensure visible
    });
    mo.observe(textEl, { childList: true, characterData: true, subtree: true });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(body.classList.contains("hidden"));
    });

    // clicking the title toggles as well (bigger hit area)
    title.addEventListener("click", function (e) {
      // if click landed on an interactive element inside title, ignore
      if (e.target && (e.target.tagName === "A" || e.target.tagName === "BUTTON")) return;
      setOpen(body.classList.contains("hidden"));
    });
    // keyboard accessibility: Enter/Space toggles
    title.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(body.classList.contains("hidden"));
      }
    });
  });
}

function animateCounter(el, from, to) {
  const diff = to - from;
  const duration = Math.min(Math.abs(diff) / 30 + 200, 550);
  const startTime = performance.now();
  let rafId;
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = getCurrencyPrefix() + formatMoney(from + diff * ease);
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else el.textContent = getCurrencyPrefix() + formatMoney(to);
  }
  if (el._rafId) cancelAnimationFrame(el._rafId);
  el._rafId = requestAnimationFrame(step);
  flashAmount(el);
}

function setLang(lang, animate) {
  if (!I18N[lang]) return;
  if (animate === false) {
    _applyLang(lang);
    return;
  }
  document.body.classList.add("lang-switching");
  setTimeout(function () {
    _applyLang(lang);
    requestAnimationFrame(function () {
      document.body.classList.remove("lang-switching");
    });
  }, 280);
}
function _applyLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  const dict = I18N[lang];

  document.documentElement.lang = dict.htmlLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  const flagEl = document.getElementById("langFlag");
  if (flagEl)
    flagEl.innerHTML = `<span class="fi fi-${dict.langFlag}" aria-hidden="true"></span>`;
  const codeEl = document.getElementById("langCode");
  if (codeEl) codeEl.textContent = dict.langCode || "";

  const badge = document.getElementById("commissionBadge");
  if (badge) {
    const isOpen =
      typeof window.IS_COMMISSION_OPEN !== "undefined"
        ? window.IS_COMMISSION_OPEN
        : true;
    if (isOpen) {
      badge.innerHTML = `<span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> ${dict.comm_open}`;
    } else {
      badge.innerHTML = `<span class="w-2 h-2 bg-orange-500 rounded-full"></span> ${dict.comm_closed}`;
    }
  }

  const liveText = document.getElementById("liveText");
  if (liveText) {
    const isLive = typeof IS_LIVE !== "undefined" ? IS_LIVE : false;
    liveText.textContent = isLive ? dict.live_on : dict.live_off;
  }

  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  document.querySelectorAll("option[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  const menu = document.getElementById("langMenu");
  if (menu) menu.classList.add("hidden");

  document.querySelectorAll(".lang-opt").forEach((btn) => {
    btn.classList.remove("bg-white/10", "text-white");
  });

  document.querySelectorAll(".lang-opt").forEach((btn) => {
    if (btn.getAttribute("onclick") === `setLang('${lang}')`) {
      btn.classList.add("bg-white/10", "text-white");
    }
  });

  try {
    localStorage.setItem("hakka_lang", lang);
  } catch (e) {}

  if (typeof applyFormUrls === "function") applyFormUrls();

  if (typeof setLiveStatus === "function") setLiveStatus();
  if (typeof checkAllChannels === "function") checkAllChannels();
  document.querySelectorAll(".ch-offline-text").forEach(function (el) {
    el.textContent = dict.ch_offline || "離線";
  });
  document.querySelectorAll(".ch-follow-label").forEach(function (el) {
    el.textContent = dict.ch_followers || "";
  });
  document.querySelectorAll(".ch-sub-label").forEach(function (el) {
    el.textContent = dict.ch_subscribers || "";
  });

  const titleEl = document.getElementById("pageTitle");
  if (titleEl)
    titleEl.textContent = (dict.name_short || "阿卡貓 HakkaNeko") + " ✦ Live2D";

  setTimeout(function () {
    document
      .querySelectorAll("select[data-i18n-options]")
      .forEach(function (sel) {
        var evt = new Event("change", { bubbles: false });
        sel.dispatchEvent(evt);
      });
    if (typeof calculate === "function") calculate();
    if (typeof calculateAnim === "function") calculateAnim();

    if (typeof calculateTotal === "function") calculateTotal();
  }, 0);
}

function toggleLangMenu() {
  const menu = document.getElementById("langMenu");
  if (menu) menu.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
  const wrap = document.getElementById("langSwitcherWrap");
  if (wrap && !wrap.contains(e.target)) {
    const menu = document.getElementById("langMenu");
    if (menu) menu.classList.add("hidden");
  }
});

(function () {
  var _loaderDone = false;

  var _skipAnimation = false;
  try {
    _skipAnimation = sessionStorage.getItem("hakka_visited") === "1";
  } catch (e) {}

  function detectLang() {
    var savedLang = null;
    try {
      savedLang = localStorage.getItem("hakka_lang");
    } catch (e) {}
    var bl = (
      navigator.language ||
      navigator.userLanguage ||
      "zh-TW"
    ).toLowerCase();
    var detected = "zh-TW";
    if (bl.startsWith("zh-tw") || bl.startsWith("zh-hant")) detected = "zh-TW";
    else if (bl.startsWith("zh")) detected = "zh-CN";
    else if (bl.startsWith("ja")) detected = "ja";
    else if (bl.startsWith("en")) detected = "en";
    return savedLang && typeof I18N !== "undefined" && I18N[savedLang]
      ? savedLang
      : detected;
  }

  function startLoader() {
    if (_loaderDone) return;
    _loaderDone = true;

    var bar = document.getElementById("rpgBarFill");
    var status = document.getElementById("rpgStatus");
    var loader = document.getElementById("rpgLoader");
    if (!bar || !status || !loader) return;

    var targetLang = detectLang();

    try {
      sessionStorage.setItem("hakka_visited", "1");
    } catch (e) {}

    if (_skipAnimation) {
      if (typeof setLang === "function") setLang(targetLang, false);
      loader.style.display = "none";
      document.body.classList.remove("loading");
      return;
    }

    var msgs = {
      "zh-TW": ["初始化中…", "載入語言包…", "套用介面…", "準備完畢！"],
      "zh-CN": ["初始化中…", "加载语言包…", "应用界面…", "准备完毕！"],
      en: ["Initializing…", "Loading language…", "Applying UI…", "Ready!"],
      ja: ["初期化中…", "言語を読み込み中…", "UIを適用中…", "準備完了！"],
    };
    var steps = msgs[targetLang] || msgs["zh-TW"];
    var targets = [25, 55, 82, 100];
    var step = 0;

    function runStep() {
      if (step >= steps.length) return;
      status.textContent = steps[step];
      bar.style.width = targets[step] + "%";
      step++;
      if (step < steps.length) {
        setTimeout(runStep, step === 1 ? 280 : step === 2 ? 220 : 180);
      } else {
        setTimeout(function () {
          if (typeof setLang === "function") setLang(targetLang, false);
          loader.classList.add("fade-out");
          document.body.classList.remove("loading");
          setTimeout(function () {
            loader.style.display = "none";
          }, 650);
        }, 260);
      }
    }
    setTimeout(runStep, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoader);
  } else {
    startLoader();
  }

  window.addEventListener("load", startLoader);
})();

setTimeout(function () {
  var loader = document.getElementById("rpgLoader");
  if (
    loader &&
    loader.style.display !== "none" &&
    !loader.classList.contains("fade-out")
  ) {
    try {
      var bl = (
        navigator.language ||
        navigator.userLanguage ||
        "zh-TW"
      ).toLowerCase();
      var lang = "zh-TW";
      if (bl.startsWith("zh-tw") || bl.startsWith("zh-hant")) lang = "zh-TW";
      else if (bl.startsWith("zh")) lang = "zh-CN";
      else if (bl.startsWith("ja")) lang = "ja";
      else if (bl.startsWith("en")) lang = "en";
      if (typeof setLang === "function") setLang(lang, false);
    } catch (e) {}
    loader.classList.add("fade-out");
    document.body.classList.remove("loading");
    setTimeout(function () {
      loader.style.display = "none";
    }, 650);
  }
}, 3000);
