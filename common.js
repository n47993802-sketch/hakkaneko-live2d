/* ============================================================
   阿卡貓 HakkaNeko 網站共用 JS
   內含：分頁切換邏輯、多國語言(I18N)、報價計算機、燈箱、
   聯名範本互動、頻道直播狀態偵測、Loader、iframe自適應等
   由原本單頁 SPA 拆分而來，供 10 個獨立頁面共同引用
   ============================================================ */

/* ── 多國語言字典（I18N）── */
    // 語言字典本體已拆分至 locales/zh-TW.js、locales/zh-CN.js、locales/en.js、
    // locales/ja.js，這幾個檔案會各自把自己的翻譯掛到 window.I18N['語言代碼']。
    // 這裡只是把它們合併成一個方便使用的 const I18N 供本檔案其餘程式碼引用。
    //
    // ⚠️ 重要：I18N 與 currentLang 必須宣告在整個檔案最上方。
    // 過去曾發生過「let currentLang 宣告在檔案很後面，但前面的程式碼
    // 卻已經用 typeof currentLang 去讀取它」的問題 —— 在 JavaScript 中，
    // let/const 變數會被提升到作用域最上方，但在真正宣告那一行執行「之前」，
    // 讀取它（即使只是 typeof）都會丟出 ReferenceError（暫時性死區 TDZ）。
    // 一旦丟出例外，整支 script 會直接中斷，後面所有程式碼（包含關閉
    // Loading 畫面的邏輯）都不會執行，也就是網站會卡在 Loading 畫面。
    // 因此請務必保持這兩個宣告在檔案最頂端，不要再搬到後面。
    if (!window.I18N) {
        console.error('[i18n] window.I18N 尚未定義，請確認 index.html 有在 common.js 之前載入 locales/*.js');
        window.I18N = {};
    }
    const I18N = window.I18N;
    let currentLang = 'zh-TW';

/* ── 導覽列（Nav）動態渲染 ──
   所有頁面的導覽列都改由這裡依 nav-config.js 的 window.NAV_CONFIG
   自動產生，因此「隱藏／顯示某個分頁」只需要改 nav-config.js 一個檔案，
   不用再進到 10 個 html 檔裡一個一個手動修改。
   同時這裡也會自動判斷「目前在哪一頁」並套用 active 高亮，
   修掉舊版每個頁面都寫死 tab-intro 為 active 的問題。 */
    (function() {
        function currentPageId() {
            var file = (location.pathname.split('/').pop() || 'index.html');
            if (file === '' || file === 'index.html') return 'intro';
            return file.replace(/\.html$/, '');
        }

        function escAttr(s) { return String(s == null ? '' : s); }

        // 跟 nav-render.js 一樣：把 nav-config.js 裡「根目錄算起」的 href
        // 補上目前頁面對應的 ../ 前綴（見 nav-render.js 開頭的說明）。
        function withBase(href) {
            return (window.SITE_BASE || '') + escAttr(href);
        }

        function buildChildItem(item) {
            var iconHtml = item.icon
                ? '<i class="fa-solid ' + escAttr(item.icon) + (item.color ? ' ' + escAttr(item.color) : '') + ' w-4"></i> '
                : '';
            return '<button onclick="location.href=\'' + withBase(item.href) + '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">'
                + iconHtml + '<span data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
        }

        function buildTopButton(item) {
            return '<button onclick="location.href=\'' + withBase(item.href) + '\'" id="tab-' + escAttr(item.id) + '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
                + '<i class="fa-solid ' + escAttr(item.icon) + '"></i><span class="inline" data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
        }

        function buildDropdown(group) {
            var enabledItems = (group.items || []).filter(function(it) { return it.enabled !== false; });
            if (!enabledItems.length) return ''; // 整組都關閉時，連下拉選單按鈕本身也不顯示
            var itemsHtml = enabledItems.map(buildChildItem).join('');
            return '<div class="relative" id="' + escAttr(group.id) + 'DropdownWrap">'
                + '<button onclick="toggleNavDropdown(event,\'' + escAttr(group.id) + '\')" id="tab-' + escAttr(group.id) + '-trigger" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
                + '<i class="fa-solid ' + escAttr(group.icon) + '"></i><span class="inline" data-i18n="' + escAttr(group.label) + '">' + escAttr(group.text) + '</span>'
                + '<i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" id="' + escAttr(group.id) + 'Arrow"></i></button>'
                + '<div id="' + escAttr(group.id) + 'Dropdown" class="hidden absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#120824] border border-purple-500/40 rounded-2xl p-2 shadow-2xl z-[300] min-w-[170px]">'
                + itemsHtml + '</div></div>';
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
            if (pageId === 'intro') return;
            var entry = findCurrentEntry(config, pageId);
            if (entry && entry.enabled === false) {
                location.replace((window.SITE_BASE || '') + 'index.html');
            }
        }

        function renderMainNav() {
            var nav = document.getElementById('mainNav');
            var config = window.NAV_CONFIG;
            if (!nav) return;
            if (!config) {
                console.error('[nav] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 common.js 之前載入');
                return;
            }

            enforceDisabledPageGuard(config);

            var html = '';
            var groupOfChild = {}; // 子分頁 id -> 所屬下拉選單 id（用來做 active 高亮）

            config.forEach(function(entry) {
                if (entry.enabled === false) return;
                if (entry.dropdown) {
                    var frag = buildDropdown(entry);
                    if (frag) html += frag;
                    (entry.items || []).forEach(function(it) {
                        if (it.enabled !== false) groupOfChild[it.id] = entry.id;
                    });
                } else {
                    html += buildTopButton(entry);
                }
            });

            nav.innerHTML = html;

            // 依目前所在頁面高亮對應分頁（或其所屬下拉選單觸發按鈕）
            var pageId = currentPageId();
            var activeBtn = document.getElementById('tab-' + pageId)
                || (groupOfChild[pageId] ? document.getElementById('tab-' + groupOfChild[pageId] + '-trigger') : null);
            if (activeBtn) {
                activeBtn.classList.add('active', 'text-white');
                activeBtn.classList.remove('text-purple-300');
            }
        }

        // 備援用途：正常情況下，導覽列已經由 nav-render.js（放在 <nav> 容器
        // 緊接著的地方，同步、非 defer 載入）提前渲染完成了，這裡不需要再做一次。
        // 只有當某個頁面漏放 nav-render.js，或該檔案載入失敗時，才會用到這份備援。
        if (typeof window.renderMainNav !== 'function') {
            window.renderMainNav = renderMainNav;
        }

        var _navAlreadyRendered = document.getElementById('mainNav') && document.getElementById('mainNav').children.length > 0;
        if (_navAlreadyRendered) {
            // nav-render.js 已經渲染過，跳過，避免重複操作 DOM
        } else if (document.getElementById('mainNav')) {
            renderMainNav();
        } else if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderMainNav);
        }
    })();

/* ── 聯名模板頁互動邏輯 ── */
// 已拆分至 template-config.js（衣裝資料）+ template-render.js（互動邏輯），
// 只有 template.html 會載入這兩個檔案。


/* ── 核心邏輯：分頁切換、報價計算機、主題/語言切換等 ── */
        // 白天/夜晚切換邏輯
        // ==================== V5 功能 JS ====================

        // ==================== 截圖 + 寄信 ====================
        // screenshotAndEmail() 已移除：這是舊版「截圖後自動開啟 mailto: 郵件」
        // 的流程，已被目前 core.html／anim.html 實際使用的 screenshotQuote()
        // + 表單（site-config.js 的 FORM_URLS）取代，沒有任何按鈕在呼叫它了。


        // ==================== 截圖報價單 ====================
        // ==================== 委託編號產生 ====================
        function generateOrderNumber(type) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const rand = String(Math.floor(Math.random() * 9000) + 1000);
            const typeCode = type === 'anim' ? 'AN' : 'VP';
            return `HKN-${typeCode}-${y}-${m}${d}-${rand}`;
        }

        function screenshotQuote(panelId, type, btnEl) {
            const panel = document.getElementById(panelId);
            if (!panel) return;
            // 讀取面板內已有的委託編號（由 calculate/calculateAnim 初次呼叫時生成）
            const orderElId = type === 'vp' ? 'orderIdVP' : 'orderIdAnim';
            const orderEl   = document.getElementById(orderElId);
            let orderId = orderEl ? orderEl.textContent.trim() : '';
            // 若編號仍是預設「—」（尚未報價），立即生成
            if (!orderId || orderId === '—') {
                orderId = generateOrderNumber(type);
                if (orderEl) orderEl.textContent = orderId;
            }
            // v52 修復：html2canvas 函式庫下載＋實際渲染截圖這段期間（尤其
            // 第一次使用、CDN 函式庫還沒被瀏覽器快取時）畫面完全沒反應，
            // 使用者容易誤以為按鈕沒作用而重複點擊。點下去的當下就先把
            // 按鈕鎖住、圖示換成轉圈圈、文字換成「產生中⋯」，處理完成
            // （不管成功或失敗）再由 doScreenshot() 統一還原。
            const btnState = setBtnLoading(btnEl);
            // Load html2canvas if not already loaded
            if (!window.html2canvas) {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                s.onload = () => doScreenshot(panel, orderId, btnState);
                s.onerror = () => restoreBtnLoading(btnState);
                document.head.appendChild(s);
            } else {
                doScreenshot(panel, orderId, btnState);
            }
        }
        // v52：把「按鈕換成處理中狀態」跟「還原」抽成共用函式，
        // screenshotQuote() 觸發、doScreenshot() 結束時（不管成功或例外）
        // 都要呼叫對應的一半，避免漏還原讓按鈕卡死在轉圈圈狀態。
        function setBtnLoading(btnEl) {
            if (!btnEl) return null;
            const iconEl = btnEl.querySelector('i');
            const textEl = btnEl.querySelector('span');
            const state = {
                btnEl, iconEl, textEl,
                prevIconClass: iconEl ? iconEl.className : '',
                prevText: textEl ? textEl.textContent : '',
                prevDisabled: btnEl.disabled
            };
            btnEl.disabled = true;
            if (iconEl) iconEl.className = 'fa-solid fa-spinner fa-spin';
            if (textEl) {
                const dict = (typeof currentLang !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : I18N['zh-TW'];
                textEl.textContent = dict.sidebar_screenshot_loading || '產生中⋯';
            }
            return state;
        }
        function restoreBtnLoading(state) {
            if (!state) return;
            state.btnEl.disabled = state.prevDisabled;
            if (state.iconEl) state.iconEl.className = state.prevIconClass;
            if (state.textEl) state.textEl.textContent = state.prevText;
        }
        function doScreenshot(panel, orderId, btnState) {
            // 截圖前：隱藏 toast 避免被截入畫面
            const toast = document.getElementById('toast');
            const prevToastOpacity = toast.style.opacity;
            toast.style.opacity = '0';
            toast.style.pointerEvents = 'none';

            // 暫時展開 maxHeight 讓內容完整顯示
            const list = panel.querySelector('[style*="max-height"], .max-h-\\[250px\\]');
            const prevMax = list ? list.style.maxHeight : null;
            if (list) list.style.maxHeight = 'none';

            html2canvas(panel, {
                    backgroundColor: '#0f0a1e',   // 面板背景色，避免透明導致偏移
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: panel.scrollWidth,   // 以面板實際寬度渲染，避免響應式斷點干擾
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0,
                    foreignObjectRendering: false      // 關閉 foreignObject，提高文字渲染一致性
                }).then(canvas => {
                if (list && prevMax !== null) list.style.maxHeight = prevMax;
                restoreBtnLoading(btnState);
                const link = document.createElement('a');
                const baseName = ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].quote_filename||'阿卡貓報價單':'阿卡貓報價單');
                link.download = `${baseName}_${orderId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                // 截圖完成後才顯示 toast（右下角，不蓋住內容）
                const dict = (typeof currentLang !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : I18N['zh-TW'];
                const savedMsg   = (dict.toast_screenshot_saved || '截圖已儲存！') + ` 編號：${orderId}`;
                const defaultMsg = dict.toast_copied || '已複製到剪貼簿！';
                toast.querySelector('span').textContent = savedMsg;
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px)';
                    setTimeout(() => { toast.querySelector('span').textContent = defaultMsg; }, 300);
                }, 4000);
            }).catch(e => {
                if (list && prevMax !== null) list.style.maxHeight = prevMax;
                restoreBtnLoading(btnState);
                alert('截圖失敗，請改用瀏覽器的截圖功能。');
            });
        }


        // ══════════════════════════════════════════════════
        // 統一燈箱系統 (支援左右切換 + 圓點導航)
        // ══════════════════════════════════════════════════
        const ulbGroups = {
            stickers: ["https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/785095_588208.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/815418_750290.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/240931_341304.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/411719_225934.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/73214_46903.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/798671_652807.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/80740_176251.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/399928_890637.gif"],
            logos:    ["https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/725598_179142.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/842497_993032.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/506386_489301.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/499991_926064.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/332415_991716.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/182500_354262.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/108371_241418.gif", "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/SnowCatLogo.gif"],
            fanart:   []   // 由 loadFanart() 動態填入
        };
        let ulbCurrent = { group: 'stickers', idx: 0 };

        function ulbOpen(group, idx) {
            const imgs = ulbGroups[group];
            if (!imgs || !imgs.length) return;
            ulbCurrent = { group, idx: Math.max(0, Math.min(idx, imgs.length - 1)) };
            document.getElementById('unifiedLightbox').classList.add('open');
            document.body.style.overflow = 'hidden';
            ulbRender();
        }

        function ulbClose() {
            document.getElementById('unifiedLightbox').classList.remove('open');
            document.body.style.overflow = '';
        }

        function ulbNav(dir) {
            const imgs = ulbGroups[ulbCurrent.group];
            ulbCurrent.idx = (ulbCurrent.idx + dir + imgs.length) % imgs.length;
            ulbRender();
        }

        function ulbRender() {
            const imgs = ulbGroups[ulbCurrent.group];
            const idx  = ulbCurrent.idx;
            const img  = document.getElementById('ulbImg');
            img.style.opacity = '0';
            img.src = imgs[idx];
            img.onload = () => { img.style.transition='opacity 0.2s'; img.style.opacity='1'; };

            // ── v28 燈箱極簡化 ──
            // stickers / logos：純覆蓋檢視，不顯示點與箭頭
            // fanart / anim：保留多張導覽（dots + arrows）
            const isMulti = ulbCurrent.group === 'fanart' || ulbCurrent.group === 'anim';

            // dots
            const dotsEl = document.getElementById('ulbDots');
            if (dotsEl) {
                if (isMulti && imgs.length > 1) {
                    dotsEl.innerHTML = imgs.map((_, i) =>
                        `<span class="ulb-dot${i===idx?' active':''}" onclick="ulbCurrent.idx=${i};ulbRender()"></span>`
                    ).join('');
                } else {
                    dotsEl.innerHTML = '';
                }
            }

            // arrows — 只對 multi 群組且圖數 > 1 時顯示
            const show = isMulti && imgs.length > 1;
            const prev = document.getElementById('ulbPrev');
            const next = document.getElementById('ulbNext');
            if (prev) prev.style.display = show ? 'flex' : 'none';
            if (next) next.style.display = show ? 'flex' : 'none';
        }

        // Keyboard navigation
        document.addEventListener('keydown', e => {
            const lb = document.getElementById('unifiedLightbox');
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') ulbClose();
            else if (e.key === 'ArrowLeft')  ulbNav(-1);
            else if (e.key === 'ArrowRight') ulbNav(1);
        });

        // Swipe support — wrapped in DOMContentLoaded so #unifiedLightbox exists
        document.addEventListener('DOMContentLoaded', function() {
            let tx = 0;
            const el = document.getElementById('unifiedLightbox');
            if (el) {
                el.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true});
                el.addEventListener('touchend',   e => {
                    const dx = e.changedTouches[0].clientX - tx;
                    if (Math.abs(dx) > 50) ulbNav(dx < 0 ? 1 : -1);
                }, {passive:true});
            }
        });

        // ==================== 頭貼氣泡對話 ====================
        function getIntroBubbles() {
            const _d = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW'];
            return _d.intro_bubbles || [
                '你好呀！歡迎來到我的委託頁面！ ✨','有任何問題都可以寄信給我喔！',
                '建模就是把角色的靈魂喚醒！ 🐱','委託開放中，快來找我委託！',
                '做 Live2D 是我最快樂的事 💜','謝謝你點我！你是最棒的！ (≧▽≦)',
                '每個角色都是獨一無二的作品 ✦','歡迎查看我的 X 作品集！'
            ];
        }
        function getCollabBubbles() {
            const _d = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW'];
            return _d.collab_bubbles || [
                '別敲我！我是乖寶寶！','我沒有藏任何秘密！',
                '你知道這個網站有藏著科樂美彩蛋嗎？','我需要更多的合作繪師！'
            ];
        }
        const bubbleTimers = {};
        function showBubble(el, type) {
            // Remove existing bubble on this element
            const existing = el.parentElement.querySelector('.speech-bubble');
            if (existing) existing.remove();
            clearTimeout(bubbleTimers[type]);

            const msgs = type === 'intro' ? getIntroBubbles() : getCollabBubbles();
            const msg = msgs[Math.floor(Math.random() * msgs.length)];

            const bubble = document.createElement('div');
            bubble.className = 'speech-bubble';
            bubble.textContent = msg;
            el.parentElement.style.position = 'relative';
            el.parentElement.appendChild(bubble);

            bubbleTimers[type] = setTimeout(() => bubble.remove(), 2600);
        }

        // v58 修復：playIntroSound()／playBonk() 原本也放在這裡，之前一次
        // 「把 Live2D 展示頁專屬邏輯拆到獨立檔案」的重構，把這兩個函式
        // 一起搬去了 live2d-demo-render.js（只有 live2d-demo.html 會載入）
        // ——但沒注意到首頁「自我介紹」的兩個頭貼按鈕（onclick 裡同時呼叫
        // showBubble() 和 playIntroSound()/playBonk()）其實也在用同一組
        // 函式。首頁沒有載入那支專屬檔案，於是點下去等於呼叫一個根本
        // 不存在的函式，沒有任何聲音（也沒有明顯錯誤訊息，不容易發現）。
        // 這兩個函式其實跟 showBubble() 一樣，都是「點頭貼」互動的一部分，
        // 邏輯上本來就該放在全站共用的 common.js，讓任何頁面都能用——
        // 這裡歸位，live2d-demo-render.js 那邊改成直接沿用這裡的版本，
        // 不再各自維護一份重複的程式碼。
        let _sfxCtx = null;
        function getSfxCtx() {
            if (!_sfxCtx) {
                _sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            // 瀏覽器有時會自動把 AudioContext 暫停（例如分頁曾經被切到
            // 背景），確保要播放前一定是 running 狀態。
            if (_sfxCtx.state === 'suspended') { try { _sfxCtx.resume(); } catch(e) {} }
            return _sfxCtx;
        }
        function playIntroSound() {
            try {
                const ctx = getSfxCtx();
                // Cheerful ascending arpeggio
                [523, 659, 784, 1047].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.connect(g); g.connect(ctx.destination);
                    o.frequency.value = freq;
                    const t = ctx.currentTime + i * 0.1;
                    g.gain.setValueAtTime(0, t);
                    g.gain.linearRampToValueAtTime(0.25, t + 0.05);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    o.start(t); o.stop(t + 0.3);
                });
            } catch(e) {}
        }
        function playBonk() {
            try {
                const ctx = getSfxCtx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.setValueAtTime(300, ctx.currentTime);
                o.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
                g.gain.setValueAtTime(0.35, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
                o.start(); o.stop(ctx.currentTime + 0.28);
            } catch(e) {}
        }

        function toggleTheme() {
            // v52 修復：深色/淺色模式是靠切換 body.light-mode，讓一大堆
            // `body.light-mode .xxx { color: ... !important }` 規則同時
            // 生效／失效，之前完全沒有 transition，顏色是瞬間跳過去的。
            // 這裡加一個短暫的全域顏色過渡 class（見 common.css 的
            // .theme-transition），讓這些顏色/背景/邊框變化都能平滑地
            // 漸變過去，過渡結束後就把 class 拿掉——不永久掛著這個全域
            // transition，避免影響其他地方（例如 hover 效果）原本的過渡
            // 速度。
            document.body.classList.add('theme-transition');
            clearTimeout(window._themeTransitionTimer);
            window._themeTransitionTimer = setTimeout(function() {
                document.body.classList.remove('theme-transition');
            }, 600);
            document.body.classList.toggle('light-mode');
            const icon = document.getElementById('themeIcon');
            const isLight = document.body.classList.contains('light-mode');
            if(isLight) {
                icon.className = 'fa-solid fa-moon text-purple-500';
                if(window.setMeteorMode) window.setMeteorMode(true);
            } else {
                icon.className = 'fa-solid fa-sun text-yellow-400';
                if(window.setMeteorMode) window.setMeteorMode(false);
            }
            try { localStorage.setItem('hakka_theme', isLight ? 'light' : 'dark'); } catch(e) {}
        }
        // Restore theme on load
        // Priority: 1) localStorage saved preference  2) OS prefers-color-scheme
        (function() {
            try {
                const saved = localStorage.getItem('hakka_theme');
                const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                const shouldLight = saved === 'light' || (saved === null && prefersLight);
                if (shouldLight) {
                    document.body.classList.add('light-mode');
                    const icon = document.getElementById('themeIcon');
                    if (icon) icon.className = 'fa-solid fa-moon text-purple-500';
                    if (window.setMeteorMode) window.setMeteorMode(true);
                }
            } catch(e) {}

            // Listen for OS theme changes (only applies if user hasn't manually set a preference)
            try {
                window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
                    let saved = null;
                    try { saved = localStorage.getItem('hakka_theme'); } catch(_) {}
                    if (saved !== null) return; // user has a manual preference, don't override
                    const icon = document.getElementById('themeIcon');
                    if (e.matches) {
                        document.body.classList.add('light-mode');
                        if (icon) icon.className = 'fa-solid fa-moon text-purple-500';
                        if (window.setMeteorMode) window.setMeteorMode(true);
                    } else {
                        document.body.classList.remove('light-mode');
                        if (icon) icon.className = 'fa-solid fa-sun text-yellow-400';
                        if (window.setMeteorMode) window.setMeteorMode(false);
                    }
                });
            } catch(e) {}
        })();

        // 分頁切換
        function closeDropdowns() {
            ['comm','creative'].forEach(k => {
                const dd = document.getElementById(k + 'Dropdown');
                if(dd) dd.classList.add('hidden');
                document.getElementById(k + 'DropdownWrap')?.classList.remove('nav-dropdown-open');
            });
        }
        function toggleNavDropdown(e, key) { e.stopPropagation();
            const dd = document.getElementById(key + 'Dropdown');
            const ddWrap = document.getElementById(key + 'DropdownWrap');
            const other = key === 'comm' ? 'creativeDropdown' : 'commDropdown';
            const otherWrap = key === 'comm' ? 'creativeDropdownWrap' : 'commDropdownWrap';
            document.getElementById(other)?.classList.add('hidden');
            document.getElementById(otherWrap)?.classList.remove('nav-dropdown-open');
            dd.classList.toggle('hidden');
            // v38：原本 common.css 就有寫箭頭要跟著旋轉的樣式（.nav-dropdown-open），
            // 但一直沒有任何程式碼真的加上這個 class，箭頭從來沒轉過，
            // 這裡補上，讓下拉選單展開時箭頭正確跟著轉向。
            ddWrap?.classList.toggle('nav-dropdown-open', !dd.classList.contains('hidden'));
        }
        document.addEventListener('click', e => {
            if(!document.getElementById('commDropdownWrap')?.contains(e.target) &&
               !document.getElementById('creativeDropdownWrap')?.contains(e.target)) {
                closeDropdowns();
            }
        });

        // ---- FAQ Accordion ----

        // toggleFaq() 已拆分至 rules-render.js，只有 rules.html 會載入這個檔案。


        function switchTab(tabId) {
            if (tabId === undefined) return;
            closeDropdowns();

            // v34 修復（切換分頁後又閃一下 / 內容跳動的成因之一）：
            // 現在每個頁面都是各自獨立的 html，只剩「自己」這一個 .page-content，
            // 不會再有「同一頁裡有好幾個分頁互相切換」的情況了。這個函式是
            // 從「一體式版本」留下來的，那時候它的工作是：把其他分頁隱藏、
            // 把目標分頁顯示出來、並強制重播一次淡入動畫。
            // 現在 initPage()（見下方，DOMContentLoaded 時觸發一次）只會用
            // 「目前這一頁自己的 id」呼叫它一次（目的只是要觸發下面
            // loadFanart() 這類一次性初始化），如果照舊整個跑一次
            // 「隱藏→重新淡入」，等於無意義地重播一次淡入動畫——這正是
            // 切換分頁後過一下子又閃一下、或內容突然跳動的原因之一。
            // 現在改成：不再做任何隱藏/顯示/重播動畫/捲動置頂，只保留
            // 各分頁真正需要的一次性初始化呼叫。
            //
            // portfolio 的 port-reveal 首次顯示，之前也放在這裡觸發，但已經搬到
            // portfolio-render.js 裡跟 gifEnsureInit() 一樣立即執行，不用
            // 再等這裡才觸發。
            const targetPage = document.getElementById('page-' + tabId);

            // 分頁按鈕的高亮，nav-render.js 在畫面第一次繪製前就已經處理過一次，
            // 這裡再做一次是安全的（同一個結果），保留是為了不影響其他呼叫點
            // （例如 scrollToRules() 內部仍會呼叫到這裡）。
            (function() {
                document.querySelectorAll('.tab-btn').forEach(el => {
                    el.classList.remove('active', 'text-white');
                    el.classList.add('text-purple-300');
                });
                var activeBtn = null;
                if (['rules','core','anim','template'].includes(tabId)) {
                    activeBtn = document.getElementById('tab-comm-trigger');
                } else if (['live2d-demo','portfolio','channels','fanart'].includes(tabId)) {
                    activeBtn = document.getElementById('tab-creative-trigger');
                } else {
                    activeBtn = document.getElementById('tab-' + tabId);
                }
                if (activeBtn) {
                    activeBtn.classList.add('active', 'text-white');
                    activeBtn.classList.remove('text-purple-300');
                }
            })();

            // v39：core/anim 的初次報價計算已經改成在 core-render.js／anim-render.js
            // 一載入就立刻執行（見那兩個檔案結尾），這裡不用再重複算一次；
            // 語言切換時的重新計算也已經由 setLang() 自己處理，不需要靠這裡觸發。
            if(tabId === 'template') { /* tmplCalculate called by interceptor */ }
            else if(tabId === 'live2d-demo') initLive2DDemo();
            else if(tabId === 'fanart') loadFanart();
            else if(tabId === 'portfolio') {
                // 手動翻頁模式，無自動計時器
                // 首次進入時才初始化 GIF 展示（lazy init，防止 hidden 狀態下 GIF decode 閃爍）
                gifEnsureInit();
            }
        }

        // --- 複製到剪貼簿（用 execCommand 相容寫法，不依賴 navigator.clipboard 權限） ---
        function copyToClipboardFallback(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try {
                document.execCommand('copy');
                const toast = document.getElementById('toast');
                toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, 0)';
                setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, -20px)'; }, 3500);
            } catch (err) { alert("瀏覽器阻擋複製，請手動框選文字複製！"); }
            document.body.removeChild(textArea);
        }



        // ==================== V皮設計 邏輯 ====================




        // ── 幣值格式化（依語系自動套用千分位 locale）──
        function formatMoney(num) {
            var locale = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
            var localeMap = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', 'en': 'en-US', 'ja': 'ja-JP' };
            return Math.round(num).toLocaleString(localeMap[locale] || 'zh-TW');
        }
        // 取得幣值符號（固定 NT$，但 toLocaleString 使用正確千分位格式）
        function getCurrencyPrefix() { return 'NT$ '; }
        // ── 數字輸入框防錯：防止負數、非數字、超出上下限破版 ──

        // ── debounce 工具函數 ──────────────────────────────────────
        // 只用在 oninput（自由文字輸入），onchange（checkbox/radio/select）維持即時
        function debounce(fn, ms) {
            let t;
            return function() { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); };
        }
        // textarea oninput 專用的 debounce 版本（150ms 後才觸發計算）
        // ─────────────────────────────────────────────────────────




        // ==================== 動畫設計 邏輯 ====================




        // ===== 核取方塊視覺同步 =====
        function syncCheckboxVisuals() {
            document.querySelectorAll('input[type="checkbox"].sr-only, input[type="radio"].sr-only').forEach(input => {
                const label = input.closest('label');
                if (!label) return;
                const box = label.querySelector('.w-6.h-6');
                const icon = label.querySelector('.fa-check');
                if (box) {
                    if (input.checked) {
                        box.style.backgroundColor = 'var(--accent-primary)';
                        box.style.borderColor = 'var(--accent-primary)';
                    } else {
                        box.style.backgroundColor = '';
                        box.style.borderColor = '';
                    }
                }
                if (icon) {
                    icon.style.opacity = input.checked ? '1' : '0';
                }
                // option-card selected state
                if (input.checked) {
                    label.style.borderColor = 'var(--accent-primary)';
                    label.style.background = 'rgba(139,92,246,0.15)';
                    label.style.boxShadow = '0 0 20px rgba(139,92,246,0.4) inset';
                } else {
                    label.style.borderColor = '';
                    label.style.background = '';
                    label.style.boxShadow = '';
                }
            });
        }

        // 覆寫所有 sr-only input 的 change 事件以觸發視覺同步
        function bindCheckboxSync() {
            document.querySelectorAll('input[type="checkbox"].sr-only, input[type="radio"].sr-only').forEach(input => {
                input.addEventListener('change', () => { setTimeout(syncCheckboxVisuals, 0); });
            });
        }

        // ==================== 創意背景動畫 V2 ====================
        // 已拆分至獨立檔案 effects/meteor-bg.js（流星／星空／星雲背景特效）。
        // 如需調整流星數量、速度、顏色等視覺參數，請直接編輯該檔案，
        // 不要在這裡重新加回程式碼，以免又變回大雜燴。
        // 對外介面：window.setMeteorMode(isLight) 由下方 toggleTheme() 呼叫。



        // ==================== Live2D 互動分頁邏輯 ====================
        // 已拆分至 creative/live2d-demo/live2d-demo-render.js，只有
        // live2d-demo.html 會載入這個檔案，其餘 9 個頁面不會再跟著下載。


        // ================================================================
        // 表單網址設定已搬到 site-config.js（window.FORM_URLS），全站共用設定檔。
        // ================================================================

        /**
         * 依目前語言取得對應表單 URL，無多語言版本時自動 fallback 中文版
         * @param {'commission_vp'|'commission_anim'|'artists'|'fanart'} key
         */
        function getFormUrl(key) {
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
            const suffix = (lang === 'en' || lang === 'ja') ? '_en' : '';
            const url = window.FORM_URLS[key + suffix];
            return (url && url.trim() !== '') ? url : window.FORM_URLS[key] || '#';
        }

        /** 將全站所有帶有 data-form-key 屬性的連結同步為正確 URL（含語言切換後重新套用）*/
        function applyFormUrls() {
            document.querySelectorAll('[data-form-key]').forEach(function(el) {
                const key = el.getAttribute('data-form-key');
                el.href = getFormUrl(key);
            });
        }

        // 頁面載入後立即套用一次
        document.addEventListener('DOMContentLoaded', applyFormUrls);
        // ================================================================

        // ---- 委託狀態 ----
        // 🔧 開放委託時改為 true，暫停時改為 false
        // window.IS_COMMISSION_OPEN 已搬到 site-config.js
        (function() {
            const badge = document.getElementById('commissionBadge');
            if (!badge) return;
            if (window.IS_COMMISSION_OPEN) {
                badge.className = 'text-sm bg-green-500/20 text-green-400 px-3 py-1.5 rounded-md flex items-center gap-2 font-bold';
                badge.innerHTML = `<span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> ${(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].comm_open:'開放委託中'}`;
            } else {
                badge.className = 'text-sm bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-md flex items-center gap-2 font-bold';
                badge.innerHTML = `<span class="w-2 h-2 bg-orange-500 rounded-full"></span> ${(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].comm_closed:'委託暫停中'}`;
            }
        })();

        // ---- 直播狀態偵測 ----
        // 🔧 開台時將此值改為 true，關台改回 false
        // ── 自己的 Twitch 直播狀態（動態查詢）──
        let _myLiveStatus = false;

        function setLiveStatus(isLive) {
            if (typeof isLive !== 'undefined') _myLiveStatus = isLive;
            const live = _myLiveStatus;
            const applyStatus = (dotId, textId, badgeId, sm) => {
                const dot  = document.getElementById(dotId);
                const text = document.getElementById(textId);
                const badge = document.getElementById(badgeId);
                if (!dot) return;
                const _d = (typeof currentLang !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : I18N['zh-TW'];
                if (live) {
                    dot.className   = sm ? 'w-1.5 h-1.5 rounded-full bg-red-500 animate-ping' : 'w-2 h-2 rounded-full bg-red-500 animate-ping';
                    text.textContent = _d.live_on || 'Twitch 直播中！';
                    badge.className = (sm ? 'text-xs' : 'text-sm') + ' px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold bg-red-500/20 text-red-400 border border-red-500/30';
                } else {
                    dot.className   = sm ? 'w-1.5 h-1.5 rounded-full bg-gray-500' : 'w-2 h-2 rounded-full bg-gray-500';
                    text.textContent = _d.live_off || 'Twitch 未直播';
                    badge.className = (sm ? 'text-xs' : 'text-sm') + ' px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold bg-gray-500/20 text-gray-400';
                }
            };
            applyStatus('liveDot', 'liveText', 'twitterLiveBadge', false);
        }

        // ── 查詢自己的頻道直播狀態 ──
        async function checkMyLiveStatus() {
            const channel = 'hakkanekolive2d';
            // 嘗試多個免費 proxy，任一成功即停止
            const endpoints = [
                () => fetch(`https://decapi.me/twitch/uptime/${channel}`, { signal: AbortSignal.timeout(5000) })
                        .then(r => r.text())
                        .then(t => !t.includes('offline') && !t.includes('error') && t.trim().length > 3),
                () => fetch(`https://api.ivr.fi/v2/twitch/user?login=${channel}`, { signal: AbortSignal.timeout(5000) })
                        .then(r => r.json())
                        .then(d => !!(d[0] && d[0].stream)),
            ];
            for (const endpoint of endpoints) {
                try {
                    const live = await endpoint();
                    setLiveStatus(live);
                    return;
                } catch(e) { /* try next */ }
            }
            // All endpoints failed → keep offline (default)
        }

        // ---- Footer 年份 ----
        const fyEl = document.getElementById('footerYear');
        if(fyEl) fyEl.textContent = new Date().getFullYear();

        // ==================== 推薦頻道直播狀態 ====================
        // 已拆分至 channels-config.js（頻道清單）+ channels-render.js（偵測邏輯），
        // 只有 channels.html 會載入這兩個檔案。這裡保留一個空殼 checkAllChannels，
        // 讓下面 setLang() 的呼叫在其他頁面上不會噴錯（channels-render.js 載入時
        // 會覆寫成真正的實作）。
        function checkAllChannels() {}


        // ── GIF 閃爍修復：視窗重新獲得焦點時同步 GPU 幀快取 ──
        // 原因：Chromium 在 Window Blur 時可能釋放 compositing layer 快取，
        // 此處強制微小的 GPU 層更新，讓 GIF 解碼狀態得以續接而非重置。
        window.addEventListener('focus', () => {
            const portfolioPage = document.getElementById('page-portfolio');
            if (portfolioPage && !portfolioPage.classList.contains('gif-hidden')) {
                portfolioPage.style.transform = 'translateZ(0)';
            }
        });

        // ==================== 統一頁面初始化 initPage() ====================
        // v40 重構：這裡原本是 window.onload（要等頁面「所有」資源，包括圖片、
        // 外部 CDN 等全部載入完成才觸發，通常明顯比 DOM 解析完晚很多），
        // 現在改成 DOMContentLoaded（HTML 解析完就觸發，不用等圖片）。
        // 這裡做的事全部都只需要 DOM 結構存在，不需要等圖片/外部資源，
        // 所以搬到更早的時機觸發是安全的，也能讓 nav 高亮、常見問題手風琴、
        // 二創/Live2D 初始化等更快完成，不會被慢速圖片拖住。
        //
        // 同時修掉一個先前拆分 core.html／anim.html 報價計算機邏輯到獨立檔案
        // 時，不小心留下的嚴重錯誤：以前這裡有 _safe(calculate)／
        // _safe(calculateAnim)／_safe(updateAnimFields) 這幾行，直接把
        // 「可能根本沒被定義」的函式當參數傳給 _safe()。問題在於 JS 在呼叫
        // _safe(calculate) 之前，就要先計算「calculate」這個參數的值——
        // 如果目前這一頁根本沒有載入定義 calculate 的檔案（例如在
        // artists.html／portfolio.html 等 8 個非報價頁面上，calculate 只存在
        // 於 core.html 專屬的 core-render.js 裡），這一行會直接丟出「未攔截」
        // 的 ReferenceError，導致整個初始化流程從這裡中斷，後面的
        // bindCheckboxSync()／syncCheckboxVisuals()／自己直播狀態檢查全部
        // 都不會執行！這幾行本來就是多餘的（core-render.js／anim-render.js
        // 現在都已經在自己腳本載入時立刻算過一次），這次直接移除，
        // 不再有這個風險。
        function initPage() {
            function _safe(fn){ try { if (typeof fn === 'function') fn(); } catch(e) { console.warn('[init]', e); } }
            var _firstPage = document.querySelector('.page-content');
            if (_firstPage) { _safe(function(){ switchTab(_firstPage.id.replace('page-','')); }); }
            _safe(bindCheckboxSync);
            _safe(syncCheckboxVisuals);

            // checkMyLiveStatus／setLiveStatus 是查「阿卡貓自己」的直播狀態，
            // 對應的徽章（#twitterLiveBadge）目前只有 index.html 有，
            // 先確認頁面上真的有這個徽章才查詢，避免其他頁面白白發送請求。
            // （推薦頻道的直播狀態查詢在 channels-render.js，只有
            //   channels.html 會執行，這裡不用管。）
            if (document.getElementById('twitterLiveBadge')) {
                _safe(setLiveStatus);
                setTimeout(() => checkMyLiveStatus(), 0);
                setInterval(checkMyLiveStatus, 3 * 60 * 1000);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPage);
        } else {
            initPage();
        }
		
        // ==================== 二創展示載入 ====================
        // 已拆分至 fanart-render.js（FANART_API/FANART_RAW/loadFanart()），
        // 只有 fanart.html 會載入這個檔案。下面 switchTab() 裡 tabId==='fanart'
        // 時呼叫的 loadFanart()，就是由那個檔案提供。


        // ==================== 動態貼圖 / Logo GIF 展示 ====================
        // 零閃爍核心原則：
        //   1. 所有 <img> 在 gifBuildAll() 時一次建好，src 只設一次，之後絕不修改
        //   2. 切換分頁只改 card.style.display（'none' / ''）
        //   3. 無任何 opacity/visibility transition 作用在 GIF 的父層上
        //   4. 每個 img 用 transform:translateZ(0) 放入獨立 GPU compositing layer

        // ==================== 動態貼圖 / Logo GIF 展示：資料 ====================
        // 已拆分至 portfolio-config.js（GIF_DATA/GIF_PER_PAGE），只有 portfolio.html
        // 會載入這個檔案；gifPage（目前分頁狀態）搬到 portfolio-render.js 裡。


        // ==================== v29 功能一：一鍵複製委託需求清單 ====================
        /**
         * copySummaryToClipboard(type)
         * 從計算機當前狀態擷取所有已選方案、加購項目、數量與總金額，
         * 組合成格式化純文字後存入剪貼簿，並顯示 Toast 確認通知。
         * @param {'vp'|'anim'} type - 計算機類型
         */
        function copySummaryToClipboard(type) {
            const _d = (typeof currentLang !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : I18N['zh-TW'];
            const authorName = _d.name_short || '阿卡貓 HakkaNeko';
            // v32 換行修復：使用 CRLF(\r\n) 確保 Discord / X / LINE 全平台正常折行
            const NL  = '\r\n';
            const DIV = '──────────────────────────────';
            let lines = [];

            if (type === 'vp') {
                const details  = window.currentVpDetails || [];
                const total    = window.currentVpTotal   || 0;
                const plan     = details.length > 0 ? details[0].name : '—';
                const addons   = details.slice(1);
                const orderId  = (document.getElementById('orderIdVP')?.textContent || '').trim();
                const isRush   = document.getElementById('rush')?.checked || false;
                const rushNote = (document.getElementById('rushInfo')?.value || '').trim();
                const suppNote = (document.getElementById('supplementInfo')?.value || '').trim();

                lines.push(`📋 ${authorName} ${_d.summary_vp_title || 'Live2D V皮設計 委託需求清單'}`);
                lines.push(DIV);
                lines.push(`▸ ${_d.summary_order_id || '委託編號'}：${orderId && orderId !== '—' ? orderId : (_d.summary_order_id_pending || '（請先勾選同意條款以生成）')}`);
                lines.push(`▸ ${_d.summary_plan || '方案選擇'}：${plan}`);
                if (addons.length) {
                    lines.push(`▸ ${_d.summary_addons || '加購項目'}：`);
                    addons.forEach(i => lines.push(`   ✦ ${i.name}：${getCurrencyPrefix()}${formatMoney(i.price)}`));
                }
                lines.push(`▸ ${_d.opt_rush || '加急趕工'}：${isRush ? (_d.label_rush_yes || '是 / 已加急') : (_d.label_no || '否')}`);
                if (isRush && rushNote) {
                    lines.push('');
                    rushNote.split(/\r?\n/).forEach(l => lines.push('  ' + l));
                }
                lines.push('');
                lines.push(`▸ ${_d.sidebar_supp_label || '補充資訊'}：`);
                (suppNote || (_d.label_none || '無')).split(/\r?\n/).forEach(l => lines.push('  ' + l));
                lines.push('');
                lines.push(`▸ ${_d.summary_total || '預算總計'}：${getCurrencyPrefix()}${formatMoney(total)}`);
                lines.push(DIV);

            } else {
                const details  = window.currentAnimDetails || [];
                const total    = window.currentAnimTotal   || 0;
                const orderId  = (document.getElementById('orderIdAnim')?.textContent || '').trim();
                const isRush   = document.getElementById('animRush')?.checked || false;
                const rushNote = (document.getElementById('animRushInfo')?.value || '').trim();
                const suppNote = (document.getElementById('animSupplementInfo')?.value || '').trim();

                lines.push(`📋 ${authorName} ${_d.summary_anim_title || 'Live2D 動畫設計 委託需求清單'}`);
                lines.push(DIV);
                lines.push(`▸ ${_d.summary_order_id || '委託編號'}：${orderId && orderId !== '—' ? orderId : (_d.summary_order_id_pending || '（請先勾選同意條款以生成）')}`);
                lines.push(`▸ ${_d.summary_items || '委託項目'}：`);
                details.forEach(i => lines.push(`   ✦ ${i.name}：${getCurrencyPrefix()}${formatMoney(i.price)}`));
                lines.push(`▸ ${_d.opt_rush || '加急趕工'}：${isRush ? (_d.label_rush_yes || '是 / 已加急') : (_d.label_no || '否')}`);
                if (isRush && rushNote) {
                    lines.push('');
                    rushNote.split(/\r?\n/).forEach(l => lines.push('  ' + l));
                }
                lines.push('');
                lines.push(`▸ ${_d.sidebar_supp_label || '補充資訊'}：`);
                (suppNote || (_d.label_none || '無')).split(/\r?\n/).forEach(l => lines.push('  ' + l));
                lines.push('');
                lines.push(`▸ ${_d.summary_total || '預算總計'}：${getCurrencyPrefix()}${formatMoney(total)}`);
                lines.push(DIV);
            }

            // 組合成最終字串：CRLF 換行確保跨平台相容
            const text = lines.join(NL);

            // ── X (Twitter) 字數提醒：超過 240 字時追加提示行 ──
            // Discord / LINE 全文貼入；X 上建議只貼關鍵摘要
            const X_LIMIT = 240;
            const textForCopy = text.replace(/\r\n/g,'\n').length > X_LIMIT
                ? text + NL + `⚠️ 字數超過 ${X_LIMIT} 字，貼至 X(Twitter) 時請手動摘錄關鍵欄位以避免被截切。`
                : text;

            const btnId = type === 'vp' ? 'btn-copy-summary-vp' : 'btn-copy-summary-anim';
            const btn   = document.getElementById(btnId);

            copyToClipboardFallback(textForCopy);

            // 按鈕視覺回饋
            if (btn) {
                btn.classList.add('copied');
                const span = btn.querySelector('span');
                const origText = span ? span.textContent : '';
                if (span) span.textContent = '✓ ' + (_d.toast_copied || '已複製！');
                setTimeout(function() {
                    btn.classList.remove('copied');
                    if (span) span.textContent = origText;
                }, 2200);
            }

            // Toast 通知
            const toast = document.getElementById('toast');
            if (toast) {
                const msg = _d.toast_summary_copied || '委託清單已複製至剪貼簿！';
                toast.querySelector('span').textContent = msg;
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
                setTimeout(function() {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px)';
                    setTimeout(function() {
                        toast.querySelector('span').textContent = (_d.toast_copied || '已複製到剪貼簿！');
                    }, 300);
                }, 3500);
            }
        }

        // ==================== v29 功能二：平滑捲動至委託規範 ====================
        /**
         * scrollToRules()
         * 切換到流程與規範分頁，並平滑捲動到該頁頂部。
         * 若當前已在 rules 頁，則直接平滑捲動到頁面頂端。
         */
        function scrollToRules() {
            if (!document.getElementById('page-rules')) { window.location.href = (window.SITE_BASE || '') + 'commission/rules/rules.html'; return; }
            switchTab('rules');
            // switchTab 已呼叫 window.scrollTo({top:0}), 此處再補一次確保動畫
            setTimeout(function() {
                var rulesEl = document.getElementById('page-rules');
                if (rulesEl) {
                    rulesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 80);
        }

        // ==================== v29 功能三：燈箱雙版本圖片讀取 ====================
        // GIF_DATA 中每個項目可選填 srcThumb（預覽縮圖，WebP/輕量GIF）
        // 若無 srcThumb，則縮圖與全圖相同（向後相容）
        // 燈箱打開時才載入 item.src 原圖，列表只顯示 srcThumb
        //
        // 目前 GIF_DATA 不含 srcThumb，此機制為未來擴充保留鉤子。
        // gifBuildAll() 中 img.dataset.gifSrc 已存原圖 URL，
        // 若日後為每項新增 srcThumb，只需把 wrap img 的 src 改為 srcThumb 即可。
        //
        // ulbOpen 已覆寫：優先使用 GIF_DATA[key][idx].src 作為全圖，確保燈箱永遠顯示原圖。
        var _origUlbOpen = window.ulbOpen;
        window.ulbOpen = function(group, idx) {
            // 確保燈箱使用原始高品質 GIF（不使用縮圖）
            if (typeof GIF_DATA !== 'undefined' && GIF_DATA[group] && GIF_DATA[group][idx]) {
                // 直接使用 GIF_DATA 中的完整 src（高品質原圖）
                var fullSrc = GIF_DATA[group][idx].src;
                // 傳給原始 ulbOpen，內部會呼叫 ulbRender → 設定 #ulbImg.src
                _origUlbOpen(group, idx);
                // 確保 #ulbImg 使用原圖 src（若 ulbGroups 中存的是縮圖時覆寫）
                var ulbImg = document.getElementById('ulbImg');
                if (ulbImg && fullSrc && ulbImg.src !== fullSrc) {
                    ulbImg.style.opacity = '0';
                    ulbImg.src = fullSrc;
                    ulbImg.onload = function() {
                        this.style.transition = 'opacity 0.25s';
                        this.style.opacity = '1';
                    };
                }
            } else {
                _origUlbOpen(group, idx);
            }
        };

        // v38：移除了一整段「為了以後可能會用 Swiper.js 輪播」預先寫好、
        // 但 Swiper.js 從來沒有真的被載入過的管理程式碼（portfolioSwipers /
        // initPortfolioSwiper() / beforeunload 清理監聽器），純屬從未使用過
        // 的臆測性程式碼，站上目前的作品展示分頁邏輯跟這個完全無關
        // （見 portfolio-render.js 的 gifRenderPage/gifNav）。


        // ==================== 動態貼圖 / Logo GIF 展示：渲染邏輯 ====================
        // 已拆分至 portfolio-render.js（gifBuildAll/gifRenderPage/gifNav/gifEnsureInit），
        // 只有 portfolio.html 會載入這個檔案。資料本身在 portfolio-config.js。


        // ==================== 回到頂部 (v28 rAF 節流，v60 修復嚴重 bug) ====================
        // v60 修復：發現「回到頂部」按鈕的 HTML 元素（id="backToTop"）在
        // 全站任何一個頁面都不存在——common.css 裡樣式（圓形按鈕、淡入
        // 淡出、hover 效果）都寫好了，但沒有任何頁面真的建立這個元素。
        // 下面這段程式碼卻直接假設它一定存在，對它呼叫 classList.add()／
        // remove()，結果是只要使用者在「任何」頁面往下捲超過 300px，
        // 就會丟出 null reference 錯誤，整個「回到頂部」功能形同虛設。
        // 這是全站規模的問題，不是單一頁面的個案。
        // 修法：改成由這裡動態建立按鈕（含點擊回到頂部的行為），只寫一次、
        // 全站共用，不需要在每個 HTML 檔案裡各自補上這個元素，也不會有
        // 「漏掉某一頁」的風險。
        let backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) {
            backToTopBtn = document.createElement('button');
            backToTopBtn.id = 'backToTop';
            backToTopBtn.type = 'button';
            backToTopBtn.setAttribute('aria-label', 'Back to top');
            backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(backToTopBtn);
        }
        let _scrollRafPending = false;
        function _handleScrollFrame() {
            const y = window.scrollY;
            if (y > 300) backToTopBtn.classList.add('show');
            else backToTopBtn.classList.remove('show');
            _scrollRafPending = false;
        }
        window.addEventListener('scroll', function() {
            if (!_scrollRafPending) {
                _scrollRafPending = true;
                window.requestAnimationFrame(_handleScrollFrame);
            }
        }, { passive: true });

        // ==================== Scroll Reveal ====================
        (function() {
            // v51 重寫（修正「合作繪師頁面到第 6 張卡片開始全部一起彈出」／
            // 「流程頁兩個區塊順序顛倒」的問題）：
            // 上一版把「同一批一起進入視窗的元素」依 compareDocumentPosition
            // 排序，理論上沒錯，但延遲用 Math.min(i * 90, 450) 硬性封頂在 450ms——只要同一批
            // 一起進入視窗的元素超過 6 個（450 / 90 = 5），第 6 個以後全部會被
            // 硬壓到同一個 450ms，變成「前 5 個依序出現，後面全部同時彈出」，
            // 合作繪師頁面 18 位繪師一次進入視窗就正好踩到這個問題。
            // 另外，排序時用 IntersectionObserver 每次 callback 給的 entries
            // 陣列即時用 compareDocumentPosition 兩兩比較，理論上能還原文件
            // 順序，但這個排序結果依賴瀏覽器當下如何回報 entries、且每次
            // callback 都要重新比較一次，多一層不必要的不確定性。
            //
            // 這次改成：元素被 attachReveal() 接手觀察的當下，就依照
            // querySelectorAll() 回傳的文件順序，直接指派一個遞增的絕對序號
            // （revealSeq），不用等 IntersectionObserver 回報才去猜順序。
            // 同一批進入視窗的元素，直接照這個序號排序——不會受任何瀏覽器
            // 回報順序影響，一定跟頁面由上到下的實際順序一致。
            // 延遲的部分則改成「依這一批的元素數量自動縮放間隔」：固定用
            // 500ms 當作整批最多需要多久出完，元素越多、每個間隔就自動縮小
            // （但絕對不會讓兩個不同元素被壓成同一個延遲值），元素少的時候
            // （例如 2~3 個）間隔維持接近 90ms，跟之前小批次的手感一樣。
            let revealSeq = 0;
            const io = new IntersectionObserver(entries => {
                const visible = entries.filter(e => e.isIntersecting);
                if (!visible.length) return;
                visible.sort((a, b) => a.target._revealSeq - b.target._revealSeq);
                const n = visible.length;
                // 500ms 除以這批的元素數量，但單一間隔絕不超過 90ms（元素很少
                // 時，維持原本明快的節奏，不會因為只有 1~2 個元素反而算出
                // 超過 90ms 的怪異間隔）。
                const step = Math.min(90, 500 / n);
                visible.forEach((e, i) => {
                    io.unobserve(e.target);
                    const delayMs = Math.round(i * step);
                    setTimeout(function() {
                        e.target.classList.add('visible');
                    }, delayMs);
                });
            }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

            function attachReveal(page) {
                // .no-reveal 標記的元素（如 carousel card、固定右上角的日夜模式／
                // 語言切換按鈕）跳過，避免 GIF 二次閃爍，也避免這些固定不動的
                // UI 按鈕被誤算進「內容淡入」的順序裡。
                const els = page.querySelectorAll('.glass-panel:not(.no-reveal), .faq-item');
                els.forEach((el) => {
                    if (el.classList.contains('reveal')) return;
                    el.classList.add('reveal');
                    // v51：觀察當下就指派絕對序號，順序完全交給程式碼自己
                    // 決定，不依賴瀏覽器回報 entries 的順序或事後排序猜測。
                    el._revealSeq = revealSeq++;
                    io.observe(el);
                });
            }

            // v48：公開給各頁面自己的 xxx-render.js 呼叫。
            // 原因：common.js 只會在自己載入的當下，對「當時已經存在」的
            // .glass-panel／.faq-item 掃描一次並接上淡入動畫。但 template /
            // portfolio / channels / fanart 這幾頁，卡片內容其實是各自的
            // render.js（有些甚至要等非同步 API 回應才 innerHTML 畫出來）
            // 在 common.js 掃描「之後」才建立的——這些卡片從頭到尾沒被
            // IntersectionObserver 接手過，於是完全沒有淡入動畫，會直接
            // 瞬間整批彈出。渲染腳本自己在 innerHTML 完成、卡片元素真正
            // 出現在 DOM 之後，呼叫一次 window.attachReveal(容器或 document)，
            // 就能讓這些「後來才出生」的卡片補上一樣的淡入效果。
            window.attachReveal = attachReveal;

            // v39 修復：之前只有 index.html 自己的內容（page-intro）在這裡立刻
            // attachReveal()，其餘 9 個頁面都要等 window.onload 呼叫 switchTab()
            // 才會補上 .reveal（見下面的 window.switchTab 攔截）。這造成的畫面
            // 現象是：頁面先用預設樣式顯示 → window.onload 觸發時突然被加上
            // .reveal（opacity:0，瞬間消失）→ IntersectionObserver 偵測到才
            // 又淡入——等於「先顯示、又隱藏、才慢慢出現」，跟其他頁面的呈現
            // 時機明顯不同步。現在改成：不管是哪一頁，一律立刻對「自己」的
            // 內容執行 attachReveal()，不用再等 window.onload。
            const currentPage = document.querySelector('.page-content');
            if (currentPage) attachReveal(currentPage);

            // v46 修復：這裡原本還有一段攔截 window.switchTab 的程式碼，
            // 用意是「切回已經展示過的分頁時，重新補上 .visible」——這是一體式
            // SPA 版本才需要的情境（同一頁裡有好幾個分頁、使用者可以在不同分頁
            // 之間來回切換）。現在每個頁面都是各自獨立的 html，不會再有「切回
            // 已展示過的分頁」這種情況，但這段程式碼還是會在頁面載入時執行一次
            // （initPage() 會呼叫 switchTab(目前頁面自己的 id) 一次），而且會做一件
            // 更嚴重的事：把「已經有 .reveal 但還沒 .visible」的元素（也就是還沒被
            // 使用者捲動到、IntersectionObserver 還沒觸發的下方內容）全部強制立即
            // 顯示，等於讓「捲動到才淡入」的效果對第一次載入完全失效——所有低於
            // 螢幕高度的內容，會在頁面一載入時全部同時蹦出來，而不是使用者實際
            // 捲動到那裡時才淡入。這其實是這幾輪你回報「上滑特效時間不對」問題的
            // 另一個共同原因。現在已經直接移除這段攔截，讓 IntersectionObserver
            // 用它原本該有的方式運作：捲到哪裡才淡入哪裡。

        })();

        // v46：這裡原本還有一份幾乎一模一樣的 debounce() 函式（註解寫著
        // 「v27 效能：Debounce 工具函數」），跟本檔案更前面已經定義過的
        // debounce() 做的事完全一樣，只是寫法略有不同——JS 對同名的
        // function 宣告，後面那份會覆蓋前面那份，所以這裡並沒有造成
        // 錯誤，純粹是重複定義、多餘的程式碼，已經移除，統一使用
        // 前面那一份。

        // ==================== 金額滾動數字動畫（共用工具函式） ====================
        // v40 修復：這裡原本用一個立即執行的 IIFE，嘗試包裝 window.calculate／
        // window.calculateAnim 加上數字滾動動畫效果。但這段程式碼在 common.js
        // 裡，會比 core-render.js／anim-render.js 更早執行——那時候
        // window.calculate／window.calculateAnim 根本還不存在（還沒載入），
        // 包裝的對象等於是 undefined。等 core-render.js／anim-render.js
        // 稍後才真正定義 calculate()／calculateAnim() 時，又會把這裡包裝好的
        // 版本整個覆蓋掉——等於這個滾動動畫效果自從報價機邏輯拆檔之後，
        // 已經完全沒有作用過。
        // 修法：animateCounter() 留在這裡當共用工具函式，實際「包裝」的動作
        // 改到 core-render.js／anim-render.js 自己的檔案裡，在它們各自定義
        // 完 calculate()／calculateAnim() 之後才進行包裝，順序才會正確。
        // ==================== 浮動報價提示條（取代 position:sticky） ====================
        // v45：試過兩輪 position:sticky 的修法（overflow / items-stretch）都沒有讓
        // 使用者實際看到浮動效果，改用更直接可靠的做法：position:fixed 的小提示條，
        // 完全不依賴祖先元素的 overflow/對齊設定，只靠 JS 控制「捲動超過原本報價區時
        // 顯示、捲回去時隱藏」，用 MutationObserver 自動同步顯示的金額文字，不需要
        // 每次改報價計算邏輯時都要記得同步更新這裡。
        // 只需要在 core.html／anim.html／template.html 各自的 HTML 裡準備好一個
        // id="floatingQuoteBar" 的 fixed 元素（含一個顯示金額的子元素），
        // 然後呼叫 initFloatingQuoteBar('quoteSummaryPanel', 'totalPrice') 即可。
        // ==================== 報價欄捲動跟隨（取代 position:sticky） ====================
        // v47：改用這個做法取代 position:sticky —— 不依賴任何 CSS 定位機制，
        // 純粹用 JS 在每個動畫幀計算「面板現在應該在哪」，用 transform: translateY
        // 直接移動面板本身，搭配 LERP（線性插值）讓移動過程平滑漸緩，
        // 不會有 sticky 定位常見的、跟祖先元素 overflow/對齊設定互相影響的問題。
        function initScrollFollowPanel(panelSelector, containerId) {
            const panel = document.querySelector(panelSelector);
            const container = document.getElementById(containerId);
            if (!panel || !container) return;
            let currentY = 0;   // 當前面板位移
            let targetY = 0;    // 目標面板位移
            let isAnimating = false;
            // 緩和係數：數字越小越滑順/延遲感越強（0.08~0.15 之間為佳）
            const ease = 0.1;

            function updatePosition() {
                // 大螢幕（>=1024px）才啟用跟隨，手機版維持原本排列
                if (window.innerWidth < 1024) {
                    panel.style.transform = 'none';
                    isAnimating = false;
                    return;
                }
                const containerRect = container.getBoundingClientRect();
                const panelHeight = panel.offsetHeight;
                const topOffset = 24; // 距離視窗頂部 24px
                if (containerRect.top < topOffset) {
                    const maxTranslateY = Math.max(0, containerRect.height - panelHeight);
                    targetY = Math.min(Math.abs(containerRect.top - topOffset), maxTranslateY);
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
            window.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
            onScrollOrResize(); // 頁面載入時如果已經在捲動位置，先算一次
        }

        function initFloatingQuoteBar(panelId, priceId, prefix) {
            var panel = document.getElementById(panelId);
            var priceEl = document.getElementById(priceId);
            var bar = document.getElementById('floatingQuoteBar');
            var barPriceEl = document.getElementById('floatingQuoteBarPrice');
            if (!panel || !priceEl || !bar || !barPriceEl) return;

            function syncPrice() { barPriceEl.textContent = (prefix || '') + priceEl.textContent; }
            syncPrice();
            // 金額文字改變時（calculate()/calculateAnim() 更新畫面時）自動同步，
            // 不需要另外去每個計算函式裡加同步的程式碼。
            new MutationObserver(syncPrice).observe(priceEl, { characterData: true, childList: true, subtree: true });

            function updateVisibility() {
                var rect = panel.getBoundingClientRect();
                // 原本的報價區「已經捲出畫面上方」時才顯示浮動提示條，
                // 避免報價區本身還看得到時，畫面上同時出現兩份一樣的金額。
                var shouldShow = rect.bottom < 60;
                bar.classList.toggle('visible', shouldShow);
            }
            updateVisibility();
            window.addEventListener('scroll', debounce(updateVisibility, 50), { passive: true });
            window.addEventListener('resize', debounce(updateVisibility, 100));

            bar.addEventListener('click', function() {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        // ── 金額變動「閃光脈衝」效果（修復問題4：預估總金額顯示效果差）──
        // 搭配 common.css 的 .amount-flash / .amount-enter，
        // 提供給 core-render.js／anim-render.js／template-render.js 共用：
        //   flashAmount(el)      → 金額變動時呼叫，短暫脈衝提示「數字剛剛變了」
        //   revealAmountOnLoad(el) → 頁面首次載入、金額第一次顯示時呼叫，
        //                            讓總金額緩緩淡入（取代原本瞬間顯示）
        function flashAmount(el, variant) {
            if (!el) return;
            // v50：加入 variant 參數，template.html 用 'fuchsia' 對應該頁
            // 自己的桃紅色主題（見 common.css 的 .amount-flash-fuchsia），
            // 不傳就維持 core.html／anim.html 原本的紫色系。
            var cls = (variant === 'fuchsia') ? 'amount-flash-fuchsia' : 'amount-flash';
            el.classList.remove('amount-flash', 'amount-flash-fuchsia');
            // 強制 reflow，確保移除又加回同一個 class 時動畫會重新播放，
            // 不會因為 class 名稱沒變化而被瀏覽器忽略。
            void el.offsetWidth;
            el.classList.add(cls);
        }
        // v49：把「等某元素最近的 .reveal 祖先真的淡入之後，才執行某個
        // 動畫」抽成共用函式，讓 core.html／anim.html／template.html 三處
        // 都能共用同一套修法，不必各自重複寫一次 MutationObserver。
        function whenPanelVisible(el, cb) {
            if (!el || typeof cb !== 'function') return;
            const panel = el.closest('.reveal');
            if (panel && !panel.classList.contains('visible')) {
                const mo = new MutationObserver(function() {
                    if (panel.classList.contains('visible')) {
                        mo.disconnect();
                        cb();
                    }
                });
                mo.observe(panel, { attributes: true, attributeFilter: ['class'] });
            } else {
                cb();
            }
        }
        window.whenPanelVisible = whenPanelVisible;

        function revealAmountOnLoad(el) {
            if (!el) return;
            // v50：真正的金額文字這時候已經被算出來、寫進 textContent 了，
            // 骨架屏（.price-skeleton）的任務到此結束，立刻拿掉——不需要
            // 特地等到面板淡入可見才移除，因為骨架屏本來就是蓋在文字上面，
            // 面板本身還是透明的話兩者都一樣看不到，移除的時間點早晚不影響
            // 視覺結果，但邏輯上「數字算好了」跟「面板剛好捲進畫面」是兩件
            // 不相關的事，不需要綁在一起判斷。
            el.classList.remove('price-skeleton');
            function play() {
                el.classList.remove('amount-enter');
                void el.offsetWidth;
                el.classList.add('amount-enter');
            }
            // v49 修復：金額所在的面板（如 #quoteSummaryPanel）本身也是
            // Scroll Reveal 系統管理的 .reveal 元素，一開始是完全透明的，
            // 要等 IntersectionObserver 判定進入視窗後才會加上 .visible
            // 淡入。如果金額動畫在這之前就搶先播放（腳本一執行就立刻播），
            // 0.6 秒的動畫會在面板還看不見的時候就播完，等面板真正淡入
            // 時金額早已是「完成」狀態，使用者只會看到面板整個浮現、
            // 金額本身卻像是瞬間蹦出來，感覺不到任何專屬效果。
            // 修法：等金額最近的 .reveal 祖先元素真的被標記 .visible
            // （真正淡入）之後，才觸發金額自己的緩緩浮現動畫，讓兩者
            // 視覺上同步發生。
            whenPanelVisible(el, play);
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
                if (t < 1) { rafId = requestAnimationFrame(step); }
                else el.textContent = getCurrencyPrefix() + formatMoney(to);
            }
            if (el._rafId) cancelAnimationFrame(el._rafId);
            el._rafId = requestAnimationFrame(step);
            flashAmount(el); // 數字滾動的同時，附加一次短暫的閃光脈衝，強化「金額變了」的視覺提示
        }


        // switchTab 已在上方內建 fanart 支援 (else if tabId==='fanart') loadFanart()

/* ── 多國語言字典、頻道直播偵測、iframe高度自適應、Loader ── */
    // ==================== 多語言 i18n 系統 ====================
    // ==================== 多語言 i18n 系統 ====================
    // I18N 字典已拆分至 locales/*.js（zh-TW / zh-CN / en / ja），
    // 並在檔案最上方合併進 window.I18N。currentLang 也已移至檔案頂部宣告，
    // 避免『let 變數暫時性死區（TDZ）』造成的 ReferenceError。

    // v52 修復：setLang() 本體會把上百個 [data-i18n] 元素的 innerHTML
    // 在同一個 tick 內全部換成新語言的文字——文字內容本身沒辦法用 CSS
    // transition 做動畫，逐一元素做動畫成本又太高。改成外面包一層：
    // 切換的當下先讓整個頁面極短暫地淡下去（見 common.css 的
    // .lang-switching），實際換字的動作刻意安排在畫面最暗的那一刻執行，
    // 使用者比較不容易看到文字瞬間跳動，換完之後再淡回來，體感上更像是
    // 一次有意圖的過渡，而不是硬生生地閃一下。
    // v55 修復：之前每次「切換到其他分頁」時，common.js 都會重新呼叫一次
    // setLang(儲存的語言) 來套用使用者已經選好的語言——即使語言其實根本
    // 沒有改變，這只是把同一個語言重新套用在剛載入的新頁面上。但 v52
    // 加的「淡出→換字→淡入」效果，只要呼叫 setLang() 就會觸發，於是變成
    // 每次翻頁都會跑一次淡出淡入，才會看起來像是「閃一下、文字也跟著
    // 微調了一下」。
    // 修法：加一個 animate 參數，預設是 true（維持使用者在語言選單裡
    // 主動點選切換語言時，原本淡出淡入的效果）；只有 common.js 內部在
    // 「頁面剛載入、套用已儲存語言」這幾個地方，才明確傳入 false，
    // 跳過淡出淡入、直接瞬間套用——因為這些情境下畫面本來就还在載入
    // 過程，不是使用者正在看著內容、主動切換語言，不需要也不應該有
    // 過渡動畫。另外也把過渡時間從 0.16 秒拉長到 0.28 秒，手感更從容
    // 一些，不會太趕。
    function setLang(lang, animate) {
        if (!I18N[lang]) return;
        if (animate === false) { _applyLang(lang); return; }
        document.body.classList.add('lang-switching');
        setTimeout(function() {
            _applyLang(lang);
            requestAnimationFrame(function() {
                document.body.classList.remove('lang-switching');
            });
        }, 280);
    }
    function _applyLang(lang) {
        if (!I18N[lang]) return;
        currentLang = lang;
        const dict = I18N[lang];

        // Update html lang attribute
        document.documentElement.lang = dict.htmlLang;

        // Update all data-i18n elements
        // v36 修正：原本用 textContent 覆寫，如果該元素裡面包了 <i> icon 或
        // <span>/<strong> 這類強調樣式，會被整個「壓平」成純文字、樣式消失
        // （例如每一頁小標題旁邊的裝飾星星圖示 ✦，切換語言/甚至第一次載入
        // 套用語言包時就會不見）。改用 innerHTML，讓翻譯字串可以視需要保留
        // 這些行內標籤；沒有內嵌標籤的一般文字翻譯完全不受影響。
        // 這裡的翻譯內容都是我們自己維護的固定字串（不是使用者輸入），
        // 沒有 XSS 疑慮，可以放心用 innerHTML。
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        // Update lang flag button
        const flagEl = document.getElementById('langFlag');
        if (flagEl) flagEl.innerHTML = `<span class="fi fi-${dict.langFlag}" aria-hidden="true"></span>`;
        const codeEl = document.getElementById('langCode');
        if (codeEl) codeEl.textContent = dict.langCode||'';

        // Update commission badge (JS-rendered)
        const badge = document.getElementById('commissionBadge');
        if (badge) {
            const isOpen = typeof window.IS_COMMISSION_OPEN !== 'undefined' ? window.IS_COMMISSION_OPEN : true;
            if (isOpen) {
                badge.innerHTML = `<span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> ${dict.comm_open}`;
            } else {
                badge.innerHTML = `<span class="w-2 h-2 bg-orange-500 rounded-full"></span> ${dict.comm_closed}`;
            }
        }

        // Update live status badge
        const liveText = document.getElementById('liveText');
        if (liveText) {
            const isLive = typeof IS_LIVE !== 'undefined' ? IS_LIVE : false;
            liveText.textContent = isLive ? dict.live_on : dict.live_off;
        }

        // Update placeholder texts
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (dict[key] !== undefined) el.placeholder = dict[key];
        });

        // Update select option text
        document.querySelectorAll('option[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) el.textContent = dict[key];
        });

        // Close language menu
        const menu = document.getElementById('langMenu');
        if (menu) menu.classList.add('hidden');

        // Highlight active lang option
        document.querySelectorAll('.lang-opt').forEach(btn => {
            btn.classList.remove('bg-white/10', 'text-white');
        });
        // Re-add active highlight to the selected language button
        document.querySelectorAll('.lang-opt').forEach(btn => {
            if (btn.getAttribute('onclick') === `setLang('${lang}')`) {
                btn.classList.add('bg-white/10', 'text-white');
            }
        });

        // Save preference
        try { localStorage.setItem('hakka_lang', lang); } catch(e) {}
        // Re-apply form URLs for new language (multi-language form support)
        if (typeof applyFormUrls === 'function') applyFormUrls();
        // Re-apply dynamic JS texts in new language
        if (typeof setLiveStatus === 'function') setLiveStatus();
        if (typeof checkAllChannels === 'function') checkAllChannels();
        document.querySelectorAll('.ch-offline-text').forEach(function(el){ el.textContent = dict.ch_offline || '離線'; });
        document.querySelectorAll('.ch-follow-label').forEach(function(el){ el.textContent = dict.ch_followers || ''; });
        document.querySelectorAll('.ch-sub-label').forEach(function(el){ el.textContent = dict.ch_subscribers || ''; });
        // Update page title
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = (dict.name_short||'阿卡貓 HakkaNeko') + ' ✦ Live2D';
        // Re-render quote panels in new language (defer so option text flush happens first)
        // v28 修正：同時支援 calculateTotal 別名，確保任何計算機命名方式都能觸發
        setTimeout(function(){
            // 強制重繪所有 select option 的文字（部分瀏覽器快取 option innerHTML）
            document.querySelectorAll('select[data-i18n-options]').forEach(function(sel) {
                var evt = new Event('change', { bubbles: false });
                sel.dispatchEvent(evt);
            });
            if (typeof calculate     === 'function') calculate();
            if (typeof calculateAnim === 'function') calculateAnim();
            // v28：支援 calculateTotal 函數名別名（漏洞三補強）
            if (typeof calculateTotal === 'function') calculateTotal();
        }, 0);
    }

    function toggleLangMenu() {
        const menu = document.getElementById('langMenu');
        if (menu) menu.classList.toggle('hidden');
    }

    // Close lang menu on outside click
    document.addEventListener('click', function(e) {
        const wrap = document.getElementById('langSwitcherWrap');
        if (wrap && !wrap.contains(e.target)) {
            const menu = document.getElementById('langMenu');
            if (menu) menu.classList.add('hidden');
        }
    });

    // ── Loader 啟動邏輯 ──
    // 雙保險：DOMContentLoaded（DOM 解析完即可跑，不等圖片/CDN）
    // 與 window.load 同時監聽，誰先到誰觸發，另一個自動跳過。
    // 這樣即使某些 CDN 資源被瀏覽器擋住或逾時，
    // Loader 仍能在 DOM 就緒後立刻正常完成動畫並套用語言。

    // v32 Google Sites iframe 高度自動自適應邏輯已移除：網站現在是獨立的
    // GitHub Pages 站台，不會再被嵌進 Google Sites 的 iframe 裡，這段對外
    // postMessage 回報高度、並攔截 window.switchTab 的邏輯已經沒有作用
    // （postMessage 送給的 window.parent 在一般瀏覽情境下就是自己，沒有人在聽）。

    (function() {
        var _loaderDone = false;

        // 是否為「本次瀏覽階段」第一次進站：用 sessionStorage 記錄。
        // sessionStorage 只在同一個分頁/瀏覽階段內有效，關閉分頁或瀏覽器
        // 就會重置，符合「只有一開始點入網站時才跑一次 Loading」的需求。
        var _skipAnimation = false;
        try { _skipAnimation = sessionStorage.getItem('hakka_visited') === '1'; } catch (e) {}

        function detectLang() {
            var savedLang = null;
            try { savedLang = localStorage.getItem('hakka_lang'); } catch(e) {}
            var bl = (navigator.language || navigator.userLanguage || 'zh-TW').toLowerCase();
            var detected = 'zh-TW';
            if (bl.startsWith('zh-tw') || bl.startsWith('zh-hant')) detected = 'zh-TW';
            else if (bl.startsWith('zh')) detected = 'zh-CN';
            else if (bl.startsWith('ja')) detected = 'ja';
            else if (bl.startsWith('en')) detected = 'en';
            return (savedLang && typeof I18N !== 'undefined' && I18N[savedLang]) ? savedLang : detected;
        }

        function startLoader() {
            if (_loaderDone) return;
            _loaderDone = true;

            var bar    = document.getElementById('rpgBarFill');
            var status = document.getElementById('rpgStatus');
            var loader = document.getElementById('rpgLoader');
            if (!bar || !status || !loader) return;

            var targetLang = detectLang();

            try { sessionStorage.setItem('hakka_visited', '1'); } catch (e) {}

            // 同一瀏覽階段內，非第一次進站的分頁：直接套用語言、立即隱藏 Loading，
            // 不再跑逐步動畫，滿足「切換分頁不用每次都看 Loading」的需求。
            if (_skipAnimation) {
                if (typeof setLang === 'function') setLang(targetLang, false);
                loader.style.display = 'none';
                document.body.classList.remove('loading');
                return;
            }

            var msgs = {
                'zh-TW': ['初始化中…','載入語言包…','套用介面…','準備完畢！'],
                'zh-CN': ['初始化中…','加载语言包…','应用界面…','准备完毕！'],
                'en':    ['Initializing…','Loading language…','Applying UI…','Ready!'],
                'ja':    ['初期化中…','言語を読み込み中…','UIを適用中…','準備完了！'],
            };
            var steps   = msgs[targetLang] || msgs['zh-TW'];
            var targets = [25, 55, 82, 100];
            var step    = 0;

            function runStep() {
                if (step >= steps.length) return;
                status.textContent = steps[step];
                bar.style.width = targets[step] + '%';
                step++;
                if (step < steps.length) {
                    setTimeout(runStep, step === 1 ? 280 : step === 2 ? 220 : 180);
                } else {
                    setTimeout(function() {
                        if (typeof setLang === 'function') setLang(targetLang, false);
                        loader.classList.add('fade-out');
                        document.body.classList.remove('loading');
                        setTimeout(function() { loader.style.display = 'none'; }, 650);
                    }, 260);
                }
            }
            setTimeout(runStep, 120);
        }

        // DOMContentLoaded：DOM 就緒即觸發（不等外部資源）
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startLoader);
        } else {
            // 已經是 interactive 或 complete（e.g. 腳本在底部執行時）
            startLoader();
        }
        // window.load 作為補充（若 DOMContentLoaded 因故未觸發）
        window.addEventListener('load', startLoader);
    })();

/* ── Loader 安全備援 ── */
    // 安全備用：若 3 秒後 Loader 仍未關閉（極端環境），強制關閉並套用語言
    setTimeout(function() {
        var loader = document.getElementById('rpgLoader');
        if (loader && loader.style.display !== 'none' && !loader.classList.contains('fade-out')) {
            try {
                var bl = (navigator.language || navigator.userLanguage || 'zh-TW').toLowerCase();
                var lang = 'zh-TW';
                if (bl.startsWith('zh-tw') || bl.startsWith('zh-hant')) lang = 'zh-TW';
                else if (bl.startsWith('zh')) lang = 'zh-CN';
                else if (bl.startsWith('ja')) lang = 'ja';
                else if (bl.startsWith('en')) lang = 'en';
                if (typeof setLang === 'function') setLang(lang, false);
            } catch(e) {}
            loader.classList.add('fade-out');
            document.body.classList.remove('loading');
            setTimeout(function() { loader.style.display = 'none'; }, 650);
        }
    }, 3000);
