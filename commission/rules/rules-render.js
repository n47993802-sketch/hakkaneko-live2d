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
  const VIEW_STATE_QUERY_KEYS = {
    filter: "filter",
    page: "page",
  };
  const PAGE_SIZE = 8;
  const DUE_SOON_DAYS = 3;
  const DAY_MS = 24 * 60 * 60 * 1000;
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
      dueSoon: "即將到期",
      notSet: "未設定",
      notFilled: "未填",
      statusNotStarted: "未開始",
      statusInProgress: "製作中",
      statusDone: "已完成",
      statusQueued: "等待中",
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
      dueSoon: "即将到期",
      notSet: "未设定",
      notFilled: "未填",
      statusNotStarted: "未开始",
      statusInProgress: "制作中",
      statusDone: "已完成",
      statusQueued: "等待中",
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
      dueSoon: "Due Soon",
      notSet: "Not set",
      notFilled: "TBD",
      statusNotStarted: "Not Started",
      statusInProgress: "In Progress",
      statusDone: "Completed",
      statusQueued: "Queued",
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
      dueSoon: "期限間近",
      notSet: "未設定",
      notFilled: "未入力",
      statusNotStarted: "未開始",
      statusInProgress: "制作中",
      statusDone: "完了済み",
      statusQueued: "待機中",
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

  function normalizeStatusKey(status) {
    const value = safeText(status).toLowerCase().replace(/\s+/g, "");

    if (
      value === "已完成" ||
      value === "完成" ||
      value === "completed" ||
      value === "done"
    ) {
      return "done";
    }

    if (
      value === "製作中" ||
      value === "制作中" ||
      value === "進行中" ||
      value === "进行中" ||
      value === "inprogress" ||
      value === "working"
    ) {
      return "inProgress";
    }

    if (
      value === "未開始" ||
      value === "未开始" ||
      value === "未著手" ||
      value === "notstarted"
    ) {
      return "notStarted";
    }

    if (
      value === "等待中" ||
      value === "排隊中" ||
      value === "queued" ||
      value === "queue"
    ) {
      return "queued";
    }

    return "other";
  }

  function readViewStateFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const filter = params.get(VIEW_STATE_QUERY_KEYS.filter);
      const page = Number(params.get(VIEW_STATE_QUERY_KEYS.page));

      if (filter && Object.values(FILTERS).includes(filter)) {
        scheduleState.filter = filter;
      }

      if (Number.isInteger(page) && page > 0) {
        scheduleState.page = page;
      }
    } catch (error) {}
  }

  function writeViewStateToQuery() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      params.set(VIEW_STATE_QUERY_KEYS.filter, scheduleState.filter);
      params.set(VIEW_STATE_QUERY_KEYS.page, String(scheduleState.page));

      const query = params.toString();
      const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;
      window.history.replaceState(null, "", next);
    } catch (error) {}
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
      const leftDone = normalizeStatusKey(left.status) === "done";
      const rightDone = normalizeStatusKey(right.status) === "done";

      if (leftDone !== rightDone) {
        return leftDone ? 1 : -1;
      }

      const leftDate =
        parseDateLike(left.deadlineDate) ?? parseDateLike(left.finishDate) ?? Number.MAX_SAFE_INTEGER;
      const rightDate =
        parseDateLike(right.deadlineDate) ?? parseDateLike(right.finishDate) ?? Number.MAX_SAFE_INTEGER;

      if (leftDate !== rightDate) return leftDate - rightDate;

      const leftNumber = safeText(left.commissionNumber);
      const rightNumber = safeText(right.commissionNumber);
      if (leftNumber !== rightNumber) {
        return leftNumber.localeCompare(rightNumber, "zh-Hant", {
          numeric: true,
          sensitivity: "base",
        });
      }

      const leftLabel = safeText(left.item || left.client || left.month);
      const rightLabel = safeText(right.item || right.client || right.month);
      return leftLabel.localeCompare(rightLabel, "zh-Hant");
    });
  }

  function filterRows(rows, filter) {
    if (filter === FILTERS.done) {
      return rows.filter(function (row) {
        return normalizeStatusKey(row.status) === "done";
      });
    }

    if (filter === FILTERS.pending) {
      return rows.filter(function (row) {
        return normalizeStatusKey(row.status) !== "done";
      });
    }

    return rows;
  }

  function statusStyles(status) {
    const key = normalizeStatusKey(status);
    if (key === "notStarted") {
      return "schedule-status-pending bg-red-500/20 text-red-200";
    }
    if (key === "inProgress") {
      return "schedule-status-pending bg-orange-500/20 text-red-200";
    }
    if (key === "done") {
      return "schedule-status-done bg-blue-500/20 text-blue-200";
    }
    if (key === "queued") {
      return "schedule-status-pending bg-purple-500/20 text-red-200";
    }
    return "schedule-status-pending bg-red-500/20 text-red-200";
  }

  function statusLabel(status) {
    const key = normalizeStatusKey(status);
    const copy = getCopy();

    if (key === "notStarted") return copy.statusNotStarted;
    if (key === "inProgress") return copy.statusInProgress;
    if (key === "done") return copy.statusDone;
    if (key === "queued") return copy.statusQueued;

    const value = safeText(status);
    return value || copy.notFilled;
  }

  function isOverdue(row) {
    if (normalizeStatusKey(row.status) === "done") return false;
    const deadline = parseDateLike(row.deadlineDate);
    if (!deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today.getTime();
  }

  function isDueSoon(row) {
    if (normalizeStatusKey(row.status) === "done") return false;
    const deadline = parseDateLike(row.deadlineDate);
    if (!deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((deadline - today.getTime()) / DAY_MS);
    return diffDays >= 0 && diffDays <= DUE_SOON_DAYS;
  }

  function renderTabs(totalRows) {
    const tabsEl = document.getElementById("scheduleTabs");
    if (!tabsEl) return;

    const copy = getCopy();
    const counts = {
      all: totalRows.length,
      pending: totalRows.filter(function (row) {
        return normalizeStatusKey(row.status) !== "done";
      }).length,
      done: totalRows.filter(function (row) {
        return normalizeStatusKey(row.status) === "done";
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
            class="schedule-filter-btn px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              active
                ? "is-active bg-cyan-500/20 text-cyan-100 border-cyan-300/40 shadow-lg shadow-cyan-900/20"
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
          class="schedule-page-btn min-w-8 h-8 px-2 rounded-full text-xs font-bold border transition-colors ${
            active
              ? "is-active bg-cyan-500/25 text-cyan-100 border-cyan-300/40 shadow-lg shadow-cyan-900/20"
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
        scrollScheduleToTop();
      });
    });
  }

  function scrollScheduleToTop() {
    const sectionEl =
      document.getElementById("scheduleCards")?.closest("section") ||
      document.getElementById("page-schedule");

    if (!sectionEl) return;

    window.requestAnimationFrame(function () {
      sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const commissionNumber = safeText(row.commissionNumber) || "-";
    const month = safeText(row.month) || "未分類";
    const overdue = isOverdue(row);
    const dueSoon = !overdue && isDueSoon(row);
    const articlePadding = "p-3";
    const titleClass = "schedule-card-title mt-1 text-base font-black text-white leading-snug";
    const listClass = "schedule-card-list mt-2 space-y-1.5 text-xs text-purple-100/90";
    const itemClass = "schedule-card-item flex items-start gap-2 rounded-xl bg-white/5 px-2.5 py-1.5";
    const deadlineToneClass = overdue
      ? "text-red-300"
      : dueSoon
        ? "text-amber-200"
        : "text-purple-100";
    const deadlineBadge = overdue
      ? `<span class="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200">${escapeHtml(copy.overdue)}</span>`
      : dueSoon
        ? `<span class="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">${escapeHtml(copy.dueSoon)}</span>`
        : "";

    return `
      <article class="schedule-card rounded-2xl border border-white/10 bg-black/25 ${articlePadding} shadow-xl shadow-cyan-950/10 backdrop-blur-sm hover:border-cyan-400/30 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <div class="schedule-card-month text-xs font-bold tracking-[0.2em] text-cyan-300/75 uppercase">${escapeHtml(month)}</div>
            <h3 class="${titleClass}">${escapeHtml(
              commissionNumber,
            )}</h3>
          </div>
          <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusStyles(
            row.status,
          )}">${escapeHtml(statusLabel(row.status))}</span>
        </div>

        <ul class="${listClass}">
          <li class="${itemClass}">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="schedule-card-muted text-purple-300/60">${escapeHtml(copy.clientLabel)}：</span>${escapeHtml(row.client || copy.notFilled)}</span>
          </li>
          <li class="${itemClass}">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="schedule-card-muted text-purple-300/60">${escapeHtml(copy.itemLabel || "委託品項")}：</span>${escapeHtml(row.item || copy.notFilled)}</span>
          </li>
          <li class="${itemClass}">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="schedule-card-muted text-purple-300/60">${escapeHtml(copy.deadlineLabel)}：</span><span class="${deadlineToneClass}">${escapeHtml(deadline)}${deadlineBadge ? ` ${deadlineBadge}` : ""}</span></span>
          </li>
          <li class="${itemClass}">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="schedule-card-muted text-purple-300/60">${escapeHtml(copy.finishLabel)}：</span>${escapeHtml(finishDate)}</span>
          </li>
          <li class="${itemClass}">
            <span class="mt-1 text-cyan-300">•</span>
            <span><span class="schedule-card-muted text-purple-300/60">${escapeHtml(copy.noteLabel)}：</span>${escapeHtml(row.note || copy.notFilled)}</span>
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
      return normalizeStatusKey(row.status) !== "done";
    }).length;
    const doneCount = totalRows.filter(function (row) {
      return normalizeStatusKey(row.status) === "done";
    }).length;

    renderTabs(totalRows);
    renderPager(visibleRows);
    writeViewStateToQuery();

    metaEl.textContent = scheduleState.updatedAt
      ? `${copy.updatedDate}${scheduleState.updatedAt}`
      : `${copy.updatedDate}-`;

    statusEl.textContent = `${copy.loaded} ${totalRows.length} ${copy.totalSuffix}｜${copy.tabPending} ${pendingCount}｜${copy.tabDone} ${doneCount}｜第 ${scheduleState.page} / ${paged.pageCount} 頁`;

    if (!totalRows.length) {
      cardsEl.innerHTML = `
        <div class="schedule-card rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm text-purple-200/80">
          ${escapeHtml(copy.empty)}
        </div>
      `;
      return;
    }

    if (!visibleRows.length) {
      cardsEl.innerHTML = `
        <div class="schedule-card rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm text-purple-200/80">
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
    readViewStateFromQuery();
    bindScheduleRefresh();
    loadSchedule(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSchedulePage, { once: true });
  } else {
    initSchedulePage();
  }
})();
