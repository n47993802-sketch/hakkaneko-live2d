/* ============================================================
   阿卡貓 HakkaNeko 網站 — 二創展示載入邏輯
   ============================================================
   從 common.js 拆分出來，只有 fanart.html 會載入這個檔案。

   跟 portfolio/channels 不一樣，這裡沒有另外拆一份 xxx-config.js：
   二創圖片的清單不是寫死的陣列，而是即時呼叫 GitHub API 列出
   指定資料夾（FANART_API）目前有哪些檔案，所以「清單」本身就是
   下面這兩個網址常數，沒有另外拆檔案的必要。

   之後如果要把二創圖片搬到別的 GitHub repo／資料夾，只需要改下面
   FANART_API、FANART_RAW 這兩行即可（一個是 GitHub API 網址，
   一個是對應的圖片直連網址前綴，兩者資料夾路徑必須一致）。

   ⚠️ 這裡刻意不使用 site-config.js 的 window.ASSET_BASE（GitHub
   Pages 網址），而是繼續用 raw.githubusercontent.com：因為二創圖片
   會不定期新增，GitHub Pages 有快取延遲（最長可能到 10 分鐘才會
   反映最新內容），raw.githubusercontent.com 對「剛推上去的檔案」
   更新比較即時，跟這裡「每次都即時列資料夾」的用途比較搭。

   相依性：需要 common.js 先載入（會用到 common.js 定義的
   ulbGroups／ulbOpen 統一燈箱系統、currentLang／I18N 多語系字典）。
   common.js 裡的 switchTab() 在目前頁面是 fanart 時會呼叫
   loadFanart()，因為這個檔案只會在 fanart.html 上出現，
   不會影響其他頁面。
   ============================================================ */
const FANART_API = 'https://api.github.com/repos/n47993802-sketch/Live2D-/contents/fanart';
const FANART_RAW  = 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/fanart/';
let fanartLoaded = false;

async function loadFanart() {
    if (fanartLoaded) return;
    const grid = document.getElementById('fanartGrid');
    if (!grid) return;
    try {
        // 使用瀏覽器預設快取，避免每次都消耗 GitHub unauthenticated rate limit (60 req/hr)
        const res = await fetch(FANART_API, { cache: 'default' });
        if (res.status === 403 || res.status === 429) {
            { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; throw new Error((_d.github_rate||'GitHub API 速率限制，請稍後再試')+' (Rate limit)'); }
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const files = await res.json();
        // files could be an object with a message property if rate limited
        if (!Array.isArray(files)) {
            throw new Error(files.message || '回應格式錯誤');
        }
        const imgs = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name));
        if (!imgs.length) throw new Error('資料夾內沒有圖片');
        fanartLoaded = true;

        // 填入統一燈箱的 fanart 群組（ulbGroups 定義在 common.js）
        ulbGroups.fanart = imgs.map(f => FANART_RAW + encodeURIComponent(f.name));

        grid.innerHTML = imgs.map((f, idx) => {
            const url = FANART_RAW + encodeURIComponent(f.name);
            const label = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            return `<div onclick="ulbOpen('fanart',${idx})"
                class="glass-panel overflow-hidden rounded-2xl border border-pink-500/20 hover:border-pink-400/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div class="aspect-square bg-black/30 overflow-hidden flex items-center justify-center">
                    <img src="${url}" alt="${label}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         loading="lazy"
                         onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-image-slash text-3xl text-purple-400/20\\'></i>'">
                </div>
            </div>`;
        }).join('') + `<div class="glass-panel overflow-hidden rounded-2xl border border-dashed border-purple-500/20 flex flex-col items-center justify-center aspect-square opacity-40">
            <i class="fa-solid fa-plus text-3xl text-purple-400/50 mb-2"></i>
            <p class="text-xs font-bold text-purple-200">等待更多寶物</p>
        </div>`;

        // v48 修復（問題2：二創卡片瞬間彈出、沒有淡入動畫）：
        // 這些 .glass-panel 卡片是等 GitHub API 回應後才動態畫進 DOM 的，
        // common.js 在頁面剛載入時做的那一次性掃描根本還沒看過它們。
        // 呼叫 common.js 公開的 window.attachReveal()，把這批「後來才出生」
        // 的卡片一樣接上 IntersectionObserver 淡入效果。
        if (typeof window.attachReveal === 'function') window.attachReveal(grid);
    } catch(e) {
        const isRateLimit = e.message.includes('Rate limit') || e.message.includes('rate limit') || e.message.includes('API rate limit exceeded');
        // v50：改用琥珀色系警示樣式（邊框、圖示、標題文字都換成 amber），
        // 跟其他一般內容卡片統一的紫色系明顯區隔出來，讓使用者一眼就能
        // 認出「這不是普通內容，是需要注意的錯誤狀態」，不會被略過。
        grid.innerHTML = `<div class="col-span-full glass-panel p-8 text-center border border-amber-500/30 bg-amber-500/5">
            <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-400/70 mb-3 block"></i>
            <p class="text-amber-300/80 text-sm font-bold mb-2">${isRateLimit ? ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].github_rate_short||'GitHub 請求次數已達上限':'GitHub 請求次數已達上限') : ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].badge_fail||'載入失敗':'載入失敗')}</p>
            <p class="text-xs text-amber-400/50 mb-4">${isRateLimit ? ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].github_rate_tip||'每小時最多 60 次請求，請稍後再重試。':'每小時最多 60 次請求，請稍後再重試。') : ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].error_prefix||'錯誤：':'錯誤：') + e.message}</p>
            <button onclick="fanartLoaded=false;document.getElementById('fanartGrid').innerHTML='<div class=\\'col-span-full glass-panel p-8 text-center\\'><i class=\\'fa-solid fa-spinner fa-spin text-purple-400 text-2xl mb-3 block\\'></i><p class=\\'text-purple-200/60 text-sm\\'>重新載入中⋯</p></div>';loadFanart();"
                class="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/40 transition-all">
                <i class="fa-solid fa-rotate-right mr-1"></i> 重新載入
            </button>
        </div>`;
        if (typeof window.attachReveal === 'function') window.attachReveal(grid);
    }
}
