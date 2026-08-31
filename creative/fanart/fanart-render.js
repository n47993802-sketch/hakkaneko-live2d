const FANART_GITHUB_API =
  "https://api.github.com/repos/n47993802-sketch/Live2D-/contents/fanart";

const FANART_RAW =
  "https://cdn.jsdelivr.net/gh/n47993802-sketch/Live2D-@main/fanart/";

let fanartLoaded = false;

function isImageName(name) {
  return /\.(png|jpg|jpeg|gif|webp)$/i.test(name || "");
}

function normalizeFanartFromManifest(payload) {
  if (!payload || !Array.isArray(payload.files)) return [];
  return payload.files
    .map((entry) => String(entry && entry.name ? entry.name : ""))
    .filter((name) => name.indexOf("/fanart/") !== -1)
    .map((name) => name.split("/").pop())
    .filter((name) => !!name && isImageName(name))
    .map((name) => ({ name }));
}

function normalizeFanartFromGithub(payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((entry) => entry && isImageName(entry.name))
    .map((entry) => ({ name: entry.name }));
}

async function fetchFanartList() {
  try {
    const ghRes = await fetch(FANART_GITHUB_API, { cache: "no-store" });
    if (ghRes.ok) {
      const ghJson = await ghRes.json();
      const ghFiles = normalizeFanartFromGithub(ghJson);
      if (ghFiles.length) return ghFiles;
    } else if (ghRes.status === 403 || ghRes.status === 429) {
      const _d =
        typeof currentLang !== "undefined" && I18N[currentLang]
          ? I18N[currentLang]
          : I18N["zh-TW"];
      throw new Error(
        (_d.github_rate || "GitHub API 速率限制，請稍後再試") +
          " (Rate limit)",
      );
    }
  } catch (e) {
    if (e.message.includes("Rate limit")) throw e;
  }

  try {
    const manifestRes = await fetch(FANART_MANIFEST_API, { cache: "default" });
    if (manifestRes.ok) {
      const manifestJson = await manifestRes.json();
      const manifestFiles = normalizeFanartFromManifest(manifestJson);
      if (manifestFiles.length) return manifestFiles;
    }
  } catch (e) {}

  throw new Error("資料夾內沒有圖片或載入失敗");
}

async function loadFanart() {
  if (fanartLoaded) return;
  const grid = document.getElementById("fanartGrid");
  if (!grid) return;
  try {
    const imgs = await fetchFanartList();
    if (!imgs.length) throw new Error("資料夾內沒有圖片");
    fanartLoaded = true;

    ulbGroups.fanart = imgs.map((f) => FANART_RAW + encodeURIComponent(f.name));

    grid.innerHTML =
      imgs
        .map((f, idx) => {
          const url = FANART_RAW + encodeURIComponent(f.name);
          const label = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          return `<div onclick="ulbOpen('fanart',${idx})"
                class="glass-panel overflow-hidden rounded-2xl border border-pink-500/20 hover:border-pink-400/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div class="aspect-square bg-black/30 overflow-hidden flex items-center justify-center">
                    <img src="${url}" alt="${label}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         loading="lazy"
                         onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-image-slash text-3xl text-purple-400/20\\'></i>'">
                </div>
            </div>`;
        })
        .join("") +
      `<div class="glass-panel overflow-hidden rounded-2xl border border-dashed border-purple-500/20 flex flex-col items-center justify-center aspect-square opacity-40">
            <i class="fa-solid fa-plus text-3xl text-purple-400/50 mb-2"></i>
            <p class="text-xs font-bold text-purple-200">等待更多寶物</p>
        </div>`;

    if (typeof window.attachReveal === "function") window.attachReveal(grid);
  } catch (e) {
    const isRateLimit =
      e.message.includes("Rate limit") ||
      e.message.includes("rate limit") ||
      e.message.includes("API rate limit exceeded");

    grid.innerHTML = `<div class="col-span-full glass-panel p-8 text-center border border-amber-500/30 bg-amber-500/5">
            <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400/70 mb-3 block"></i>
            <p class="text-amber-300/80 text-sm font-bold mb-2">${isRateLimit ? (typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].github_rate_short || "GitHub 請求次數已達上限" : "GitHub 請求次數已達上限") : typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].badge_fail || "載入失敗" : "載入失敗"}</p>
            <p class="text-xs text-amber-400/50 mb-4">${isRateLimit ? (typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].github_rate_tip || "每小時最多 60 次請求，請稍後再重試。" : "每小時最多 60 次請求，請稍後再重試。") : (typeof currentLang !== "undefined" && I18N[currentLang] ? I18N[currentLang].error_prefix || "錯誤：" : "錯誤：") + e.message}</p>
            <button onclick="fanartLoaded=false;document.getElementById('fanartGrid').innerHTML='<div class=\\'col-span-full glass-panel p-8 text-center\\'><i class=\\'fa-solid fa-spinner fa-spin text-purple-400 text-2xl mb-3 block\\'></i><p class=\\'text-purple-200/60 text-sm\\'>重新載入中⋯</p></div>';loadFanart();"
                class="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/40 transition-all">
                <i class="fa-solid fa-rotate-right mr-1"></i> 重新載入
            </button>
        </div>`;
    if (typeof window.attachReveal === "function") window.attachReveal(grid);
  }
}
