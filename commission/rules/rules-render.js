function toggleFaq(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector(".faq-arrow");
  const isOpen = !body.classList.contains("hidden");

  document
    .querySelectorAll(".faq-body")
    .forEach((b) => b.classList.add("hidden"));
  document
    .querySelectorAll(".faq-arrow")
    .forEach((a) => (a.style.transform = ""));

  if (!isOpen) {
    body.classList.remove("hidden");
    arrow.style.transform = "rotate(180deg)";
    setTimeout(
      () => body.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      50,
    );
  }
}

(function () {
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const CACHE_KEY_PREFIX = "hakka_schedule_cache_v2:";
  const PAGE_SIZE = 8;
  const FILTERS = {
    all: "all",
    pending: "pending",
    done: "done",
  };

  const SCHEDULE_COPY = {
    "zh-TW": {
      title: "排程卡片",
      description:
        "以截止日期與進度分頁整理委託卡片，避免資訊擠在一起。",
      loading: "正在載入公開排程資料...",
      refreshing: "資料更新中，正在重新整理公開排程。",
      loaded: "已載入",
      totalSuffix: "筆排程資料",
      empty: "目前沒有可顯示的排程資料。",
      emptyFilter: "目前此分頁沒有資料。",
      lastUpdated: "最後更新：",
      updatedDate: "更新時間：",
      tabAll: "全部",
      tabPending: "未完成",
      tabDone: "已完成",
      monthsLabel: "月份",
      clientLabel: "委託者",
      itemLabel: "委託品項",
      commissionLabel: "委託編號",
      deadlineLabel: "截止日期",
      finishLabel: "完成日期",
      noteLabel: "備註",
      overdue: "逾期",
      notSet: "未設定",
      notFilled: "未填",
      scheduleError: "公開排程載入失敗，請確認 CSV 連結是否可匿名存取。",
      cachedError: "公開排程更新失敗，已顯示快取資料。",
      noUrl: "尚未設定公開排程網址。",
    },
    "zh-CN": {
      title: "排程卡片",
      description: "依截止日期與进度分页整理委托卡片，避免资讯挤在一起。",
      loading: "正在载入公开排程资料...",
      refreshing: "资料更新中，正在重新整理公开排程。",
      loaded: "已载入",
      totalSuffix: "笔排程资料",
      empty: "目前没有可显示的排程资料。",
      emptyFilter: "目前此分页没有资料。",
      lastUpdated: "最后更新：",
      updatedDate: "更新时间：",
      tabAll: "全部",
      tabPending: "未完成",
      tabDone: "已完成",
      monthsLabel: "月份",
      clientLabel: "委托者",
      itemLabel: "委托品项",
      commissionLabel: "委托编号",
      deadlineLabel: "截止日期",
      finishLabel: "完成日期",
      noteLabel: "备注",
      overdue: "逾期",
      notSet: "未设定",
      notFilled: "未填",
      scheduleError: "公开排程载入失败，请确认 CSV 连结是否可匿名存取。",
      cachedError: "公开排程更新失败，已显示快取资料。",
      noUrl: "尚未设定公开排程网址。",
    },
    en: {
      title: "Schedule Cards",
      description:
        "Organized by deadline and status so the queue stays readable.",
      loading: "Loading public schedule...",
      refreshing: "Refreshing public schedule...",
      loaded: "Loaded",
      totalSuffix: "items",
      empty: "No schedule items to display.",
      emptyFilter: "No items in this tab.",
      lastUpdated: "Last updated: ",
      updatedDate: "Updated: ",
      tabAll: "All",
      tabPending: "Incomplete",
      tabDone: "Completed",
      monthsLabel: "Month",
      clientLabel: "Client",
      itemLabel: "Item",
      commissionLabel: "Commission No.",
      deadlineLabel: "Deadline",
      finishLabel: "Finished",
      noteLabel: "Note",
      overdue: "Overdue",
      notSet: "Not set",
      notFilled: "TBD",
      scheduleError:
        "Failed to load the public schedule. Please confirm the CSV is anonymously accessible.",
      cachedError: "Schedule refresh failed; showing cached data.",
      noUrl: "Public schedule URL is not set yet.",
    },
    ja: {
      title: "スケジュールカード",
      description: "締切日と進捗で整理して、見やすく表示します。",
      loading: "公開スケジュールを読み込み中...",
      refreshing: "公開スケジュールを更新中...",
      loaded: "読み込み済み",
      totalSuffix: "件",
      empty: "表示できるスケジュールがありません。",
      emptyFilter: "このタブにはデータがありません。",
      lastUpdated: "最終更新：",
      updatedDate: "更新日時：",
      tabAll: "すべて",
      tabPending: "未完了",
      tabDone: "完了済み",
      monthsLabel: "月",
      clientLabel: "依頼者",
      itemLabel: "依頼項目",
      commissionLabel: "依頼番号",
      deadlineLabel: "締切日",
      finishLabel: "完了日",
      noteLabel: "備考",
      overdue: "期限切れ",
      notSet: "未設定",
      notFilled: "未入力",
      scheduleError: "公開スケジュールの読み込みに失敗しました。CSV の匿名アクセスを確認してください。",
      cachedError: "更新に失敗したため、キャッシュを表示しています。",
      noUrl: "公開スケジュールの URL がまだ設定されていません。",
    },
  };

  const scheduleState = {
    filter: FILTERS.all,
    rows: [],
    updatedAt: "",
    page: 1,
  };

  function getCurrentLang() {
    return typeof currentLang === "string" ? currentLang : "zh-TW";
  }

  function getCopy() {
    return SCHEDULE_COPY[getCurrentLang()] || SCHEDULE_COPY["zh-TW"];
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

  function getScheduleUrl() {
    const url = window.SCHEDULE_URLS && window.SCHEDULE_URLS.public;
    return safeText(url);
  }

  function buildFetchUrl(url) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_ts=${Date.now()}`;
  }

  function getCacheKey(url) {
    return CACHE_KEY_PREFIX + url;
  }

  function readCache(url) {
    try {
      const raw = localStorage.getItem(getCacheKey(url));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeCache(url, payload) {
    try {
      localStorage.setItem(getCacheKey(url), JSON.stringify(payload));
    } catch (error) {}
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    const source = String(text == null ? "" : text).replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];

      if (inQuotes) {
        if (char === '"') {
          if (source[index + 1] === '"') {
            cell += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
        continue;
      }

      if (char === ",") {
        row.push(cell);
        cell = "";
        continue;
      }

      if (char === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      if (char === "\r") {
        continue;
      }

      cell += char;
    }

    row.push(cell);
    rows.push(row);

    return rows.filter(function (entry) {
      return entry.some(function (value) {
        return safeText(value) !== "";
      });
    });
  }

  function normalizeHeader(value) {
    return safeText(value).replace(/\s+/g, "").toLowerCase();
  }

  function buildHeaderMap(headerRow) {
    const map = new Map();
    headerRow.forEach(function (cell, index) {
      map.set(normalizeHeader(cell), index);
    });
    return map;
  }

  function findHeaderIndex(headerMap, aliases) {
    for (let index = 0; index < aliases.length; index += 1) {
      const alias = normalizeHeader(aliases[index]);
      if (headerMap.has(alias)) return headerMap.get(alias);
    }
    return -1;
  }

  function readColumn(row, headerMap, aliases, fallbackIndex) {
    const headerIndex = headerMap ? findHeaderIndex(headerMap, aliases) : -1;
    if (headerIndex >= 0 && headerIndex < row.length) {
      return safeText(row[headerIndex]);
    }
    if (fallbackIndex >= 0 && fallbackIndex < row.length) {
      return safeText(row[fallbackIndex]);
    }
    return "";
  }

  function normalizeRows(rows) {
    if (!rows.length) return [];

    const headerMap = buildHeaderMap(rows[0]);
    const knownHeaders = [
      "月份",
      "委託者稱呼",
      "委託品項",
      "排單進度",
      "完成日期",
      "截止日期",
      "備註(A)",
      "附註A",
    ];
    const hasHeader = knownHeaders.some(function (header) {
      return headerMap.has(normalizeHeader(header));
    });
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows
      .map(function (row) {
        const legacy =
          row.length >= 8
            ? {
                month: 0,
                client: 1,
                commissionNumber: 2,
                item: 3,
                status: 4,
                finishDate: 5,
                deadlineDate: 6,
                note: 7,
              }
            : {
                month: 0,
                client: 1,
                commissionNumber: -1,
                item: 2,
                status: 3,
                finishDate: 4,
                deadlineDate: 5,
                note: 6,
              };

        return {
          month: readColumn(row, hasHeader ? headerMap : null, ["月份"], legacy.month),
          client: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["委託者稱呼"],
            legacy.client,
          ),
          commissionNumber: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["委託編號"],
            legacy.commissionNumber,
          ),
          item: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["委託品項"],
            legacy.item,
          ),
          status: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["排單進度"],
            legacy.status,
          ),
          finishDate: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["完成日期"],
            legacy.finishDate,
          ),
          deadlineDate: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["截止日期"],
            legacy.deadlineDate,
          ),
          note: readColumn(
            row,
            hasHeader ? headerMap : null,
            ["備註(A)", "附註A", "備註"],
            legacy.note,
          ),
        };
      })
      .filter(function (row) {
        return (
          row.month ||
          row.client ||
          row.commissionNumber ||
          row.item ||
          row.status ||
          row.finishDate ||
          row.deadlineDate ||
          row.note
        );
      });
  }

  function parseDateLike(value) {
    const text = safeText(value).replace(/\./g, "/").replace(/-/g, "/");
    const match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) return null;
    return date.getTime();
  }

  function sortRows(rows) {
    return rows.slice().sort(function (left, right) {
      const leftDone = safeText(left.status) === "已完成";
      const rightDone = safeText(right.status) === "已完成";

      if (leftDone !== rightDone) {
        return leftDone ? 1 : -1;
      }

      const leftDate =
        parseDateLike(left.deadlineDate) ?? parseDateLike(left.finishDate) ?? Number.MAX_SAFE_INTEGER;
      const rightDate =
        parseDateLike(right.deadlineDate) ?? parseDateLike(right.finishDate) ?? Number.MAX_SAFE_INTEGER;

      if (leftDate !== rightDate) return leftDate - rightDate;

      const leftLabel = safeText(left.item || left.client || left.month);
      const rightLabel = safeText(right.item || right.client || right.month);
      return leftLabel.localeCompare(rightLabel, "zh-Hant");
    });
  }

  function filterRows(rows, filter) {
    if (filter === FILTERS.done) {
      return rows.filter(function (row) {
        return safeText(row.status) === "已完成";
      });
    }

    if (filter === FILTERS.pending) {
      return rows.filter(function (row) {
        return safeText(row.status) !== "已完成";
      });
    }

    return rows;
  }

  function statusStyles(status) {
    const value = safeText(status);
    if (value === "未開始") {
      return "bg-slate-500/20 text-slate-200 border-slate-400/30";
    }
    if (value === "製作中") {
      return "bg-orange-500/20 text-orange-200 border-orange-400/30";
    }
    if (value === "已完成") {
      return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
    }
    if (value === "等待中") {
      return "bg-purple-500/20 text-purple-200 border-purple-400/30";
    }
    return "bg-sky-500/20 text-sky-100 border-sky-400/30";
  }

  function statusLabel(status) {
    const value = safeText(status);
    return value || getCopy().notFilled;
  }

  function isOverdue(row) {
    if (safeText(row.status) === "已完成") return false;
    const deadline = parseDateLike(row.deadlineDate);
    if (!deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today.getTime();
  }

  function renderTabs(totalRows) {
    const tabsEl = document.getElementById("scheduleTabs");
    if (!tabsEl) return;

    const copy = getCopy();
    const counts = {
      all: totalRows.length,
      pending: totalRows.filter(function (row) {
        return safeText(row.status) !== "已完成";
      }).length,
      done: totalRows.filter(function (row) {
        return safeText(row.status) === "已完成";
      }).length,
    };

    const tabs = [
      { key: FILTERS.all, label: copy.tabAll, count: counts.all },
      { key: FILTERS.pending, label: copy.tabPending, count: counts.pending },
      { key: FILTERS.done, label: copy.tabDone, count: counts.done },
    ];

    tabsEl.innerHTML = tabs
      .map(function (tab) {
        const active = scheduleState.filter === tab.key;
        return `
          <button
            type="button"
            data-schedule-filter="${tab.key}"
            class="px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              active
                ? "bg-cyan-500/20 text-cyan-100 border-cyan-300/40 shadow-lg shadow-cyan-900/20"
                : "bg-white/5 text-purple-200/80 border-white/10 hover:bg-white/10 hover:text-white"
            }"
          >
            ${escapeHtml(tab.label)} <span class="opacity-70">(${tab.count})</span>
          </button>
        `;
      })
      .join("");

    tabsEl.querySelectorAll("[data-schedule-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        scheduleState.filter = button.getAttribute("data-schedule-filter") || FILTERS.all;
        scheduleState.page = 1;
        renderSchedule();
      });
    });
  }

  function renderPager(totalRows) {
    const pagerEl = document.getElementById("schedulePager");
    if (!pagerEl) return;

    const pageCount = Math.max(1, Math.ceil(totalRows.length / PAGE_SIZE));
    if (pageCount <= 1) {
      pagerEl.innerHTML = "";
      return;
    }

    const buttons = [];
    for (let index = 1; index <= pageCount; index += 1) {
      const active = scheduleState.page === index;
      buttons.push(`
        <button
          type="button"
          data-schedule-page="${index}"
          class="min-w-8 h-8 px-2 rounded-full text-xs font-bold border transition-colors ${
            active
              ? "bg-cyan-500/25 text-cyan-100 border-cyan-300/40 shadow-lg shadow-cyan-900/20"
              : "bg-white/5 text-purple-200/80 border-white/10 hover:bg-white/10 hover:text-white"
          }"
          aria-label="第 ${index} 頁"
        >
          ${index}
        </button>
      `);
    }

    pagerEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-center gap-2">
        ${buttons.join("")}
      </div>
    `;

    pagerEl.querySelectorAll("[data-schedule-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        scheduleState.page = Number(button.getAttribute("data-schedule-page")) || 1;
        renderSchedule();
      });
    });
  }

  function splitRows(rows) {
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (scheduleState.page > pageCount) {
      scheduleState.page = pageCount;
    }

    const start = (scheduleState.page - 1) * PAGE_SIZE;
    return {
      pageCount: pageCount,
      pageRows: rows.slice(start, start + PAGE_SIZE),
    };
  }

  function renderCard(row) {
    const copy = getCopy();
    const deadline = safeText(row.deadlineDate) || copy.notSet;
    const finishDate = safeText(row.finishDate) || copy.notSet;
    const commissionNumber = safeText(row.commissionNumber) || copy.notFilled;
    const month = safeText(row.month) || "未分類";
    const overdue = isOverdue(row);

    return `
      <article class="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-sm hover:border-cyan-400/30 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <div class="text-xs font-bold tracking-[0.2em] text-cyan-300/75 uppercase">${escapeHtml(month)}</div>
            <h3 class="mt-1 text-lg font-black text-white leading-snug">${escapeHtml(
              row.item || copy.notFilled,
            )}</h3>
          </div>
          <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusStyles(
            row.status,
          )}">${escapeHtml(statusLabel(row.status))}</span>
        </div>

        <div class="rounded-2xl bg-white/5 px-4 py-3 text-sm text-purple-100/90">
          <div class="text-[11px] uppercase tracking-[0.2em] text-purple-300/50 mb-2">${escapeHtml(copy.commissionLabel)}</div>
          <div class="font-bold text-white">${escapeHtml(commissionNumber)}</div>
        </div>

        <ul class="mt-3 space-y-2 text-sm text-purple-100/90">
          <li class="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="text-purple-300/60">${escapeHtml(copy.clientLabel)}：</span>${escapeHtml(row.client || copy.notFilled)}</span>
          </li>
          <li class="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="text-purple-300/60">${escapeHtml(copy.itemLabel || "委託品項")}：</span>${escapeHtml(row.item || copy.notFilled)}</span>
          </li>
          <li class="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="text-purple-300/60">${escapeHtml(copy.deadlineLabel)}：</span><span class="${overdue ? "text-red-300" : "text-purple-100"}">${escapeHtml(deadline)}${overdue ? ` <span class="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200">${escapeHtml(copy.overdue)}</span>` : ""}</span></span>
          </li>
          <li class="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="text-purple-300/60">${escapeHtml(copy.finishLabel)}：</span>${escapeHtml(finishDate)}</span>
          </li>
          <li class="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="text-purple-300/60">${escapeHtml(copy.noteLabel)}：</span>${escapeHtml(row.note || copy.notFilled)}</span>
          </li>
        </ul>

      </article>
    `;
  }

  function renderSchedule() {
    const statusEl = document.getElementById("scheduleStatus");
    const cardsEl = document.getElementById("scheduleCards");
    const metaEl = document.getElementById("scheduleMeta");

    if (!cardsEl || !statusEl || !metaEl) return;

    const copy = getCopy();
    const totalRows = scheduleState.rows.slice();
    const visibleRows = sortRows(filterRows(totalRows, scheduleState.filter));
    const paged = splitRows(visibleRows);
    const pendingCount = totalRows.filter(function (row) {
      return safeText(row.status) !== "已完成";
    }).length;
    const doneCount = totalRows.filter(function (row) {
      return safeText(row.status) === "已完成";
    }).length;

    renderTabs(totalRows);
    renderPager(visibleRows);

    metaEl.textContent = scheduleState.updatedAt
      ? `${copy.updatedDate}${scheduleState.updatedAt}`
      : `${copy.updatedDate}-`;

    statusEl.textContent = `${copy.loaded} ${totalRows.length} ${copy.totalSuffix}｜${copy.tabPending} ${pendingCount}｜${copy.tabDone} ${doneCount}｜第 ${scheduleState.page} / ${paged.pageCount} 頁`;

    if (!totalRows.length) {
      cardsEl.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm text-purple-200/80">
          ${escapeHtml(copy.empty)}
        </div>
      `;
      return;
    }

    if (!visibleRows.length) {
      cardsEl.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm text-purple-200/80">
          ${escapeHtml(copy.emptyFilter)}
        </div>
      `;
      return;
    }

    cardsEl.innerHTML = `
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${paged.pageRows.map(renderCard).join("")}
      </div>
    `;
  }

  async function loadSchedule(forceRefresh = false) {
    const url = getScheduleUrl();
    const statusEl = document.getElementById("scheduleStatus");
    const cardsEl = document.getElementById("scheduleCards");
    const metaEl = document.getElementById("scheduleMeta");

    if (!statusEl || !cardsEl || !metaEl) return;

    const copy = getCopy();

    if (!url) {
      statusEl.textContent = copy.noUrl;
      cardsEl.innerHTML = "";
      metaEl.textContent = `${copy.lastUpdated}-`;
      return;
    }

    const cached = forceRefresh ? null : readCache(url);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      scheduleState.rows = Array.isArray(cached.rows) ? cached.rows : [];
      scheduleState.updatedAt = safeText(cached.updatedAt);
      renderSchedule();
      return;
    }

    if (cached) {
      scheduleState.rows = Array.isArray(cached.rows) ? cached.rows : [];
      scheduleState.updatedAt = safeText(cached.updatedAt);
      renderSchedule();
      statusEl.textContent = copy.refreshing;
    } else {
      statusEl.textContent = copy.loading;
    }

    try {
      const response = await fetch(buildFetchUrl(url), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const rows = normalizeRows(parseCsv(text));
      const updatedAt = new Date().toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      scheduleState.rows = rows;
      scheduleState.updatedAt = updatedAt;

      writeCache(url, {
        timestamp: now,
        updatedAt: updatedAt,
        rows: rows,
      });

      renderSchedule();
    } catch (error) {
      if (cached) {
        statusEl.textContent = copy.cachedError;
        return;
      }

      statusEl.textContent = copy.scheduleError;
      cardsEl.innerHTML = "";
      metaEl.textContent = `${copy.lastUpdated}-`;
      console.error("[schedule] load failed", error);
    }
    }
  }

  function bindScheduleRefresh() {
    const refreshBtn = document.getElementById("scheduleRefreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadSchedule(true);
      });
    }

    window.addEventListener("focus", function () {
      loadSchedule(true);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        loadSchedule(true);
      }
    });
  }

  function initSchedulePage() {
    bindScheduleRefresh();
    loadSchedule(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSchedulePage, { once: true });
  } else {
    initSchedulePage();
  }
})();
