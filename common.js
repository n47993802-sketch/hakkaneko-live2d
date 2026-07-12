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

        function buildChildItem(item) {
            var iconHtml = item.icon
                ? '<i class="fa-solid ' + escAttr(item.icon) + (item.color ? ' ' + escAttr(item.color) : '') + ' w-4"></i> '
                : '';
            return '<button onclick="location.href=\'' + escAttr(item.href) + '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">'
                + iconHtml + '<span data-i18n="' + escAttr(item.label) + '">' + escAttr(item.text) + '</span></button>';
        }

        function buildTopButton(item) {
            return '<button onclick="location.href=\'' + escAttr(item.href) + '\'" id="tab-' + escAttr(item.id) + '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">'
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

        function renderMainNav() {
            var nav = document.getElementById('mainNav');
            var config = window.NAV_CONFIG;
            if (!nav) return;
            if (!config) {
                console.error('[nav] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 common.js 之前載入');
                return;
            }

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
    (function(){
        // ══ 衣裝類型清單（30 款，後續 src 換成實際預覽圖 URL）══
        var TMPL_OUTFITS = [
            { name:'01 女僕', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/01.png' },
            { name:'02 執事', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/02.png' },
            { name:'03 白無垢', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/03.png' },
            { name:'04 黑紋付', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/04.png' },
            { name:'05 少女睡衣', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/05.png' },
            { name:'06 長袖睡衣', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/06.png' },
            { name:'07 水手裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/07.png' },
            { name:'08 水手褲裝', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/08.png' },
            { name:'09 陰陽師', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/09.png' },
            { name:'10 巫女', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/10.png' },
            { name:'11 天使長', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/11.png' },
            { name:'12 小天使', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/12.png' },
            { name:'13 地雷裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/13.png' },
            { name:'14 地雷褲裝', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/14.png' },
            { name:'15 行燈袴', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/15.png' },
            { name:'16 小惡魔', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/16.png' },
            { name:'17 惡魔公爵', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/17.png' },
            { name:'18 大正紳士', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/18.png' },
            { name:'19 旗袍', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/19.png' },
            { name:'20 草裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/20.png' },
            { name:'21 夏威夷襯衫', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/21.png' },
            { name:'22 長衫', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/22.png' },
            { name:'23 儀隊', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/23.jpg' },
            { name:'24 和洋折衷', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/24.jpg' },
            { name:'25 比基尼', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/25.jpg' },
            { name:'26 軍官', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/26.jpg' },
            { name:'27 忍者', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/27.jpg' },
            { name:'28 泳圈', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/28.jpg' },
            { name:'29 歌德蘿莉塔', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/29.jpg' },
            { name:'30 歌德男爵', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/30.jpg' },
        ];
        var PRICE_ADD = 400; // 第2套起每套追加
        var PER_PAGE  = 8;   // 展示區每頁顯示數
        var gifPage   = 0;
        var selectedOutfits = new Set(); // 已勾選的衣裝索引
        var tmplQty = { hairBang:0, hairFull:0, acc:0, expr:0, chanyeQty:1 };
        var tmplCurrentModel = 'kanso'; // 'kanso' | 'chanye'
        var PRICE   = { hairBang:150, hairFull:300, acc:100, expr:100 };

        // ── GIF 展示區渲染 ──
        function renderGifGrid() {
            var grid = document.getElementById('tmplGifGrid');
            var dots = document.getElementById('tmplGifDots');
            if (!grid) return;
            var totalPages = Math.ceil(TMPL_OUTFITS.length / PER_PAGE);
            var start = gifPage * PER_PAGE;
            var slice = TMPL_OUTFITS.slice(start, start + PER_PAGE);

            grid.innerHTML = slice.map(function(o, i) {
                var realIdx = start + i;
                var isChecked = selectedOutfits.has(realIdx);
                var borderCls = isChecked
                    ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/60'
                    : 'border-white/10';
                var hoverStyle = 'transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.22s ease,border-color 0.2s ease;';
                return '<div class="carousel-img-wrap relative cursor-pointer rounded-2xl overflow-hidden border ' + borderCls + ' bg-black/40 group tmpl-card-hover" style="aspect-ratio:1;' + hoverStyle + '" onclick="tmplToggleOutfitFromGif(' + realIdx + ')">'
                    + '<img src="' + o.src + '" alt="' + o.name + '" class="carousel-img w-full h-full object-cover" style="transform:translate3d(0,0,0);will-change:transform;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);" loading="lazy">'
                    + '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" style="transition:opacity 0.2s ease;"></div>'
                    + '<div class="absolute inset-0 rounded-2xl opacity-0 tmpl-hover-glow" style="background:linear-gradient(135deg,rgba(192,68,255,0.18),rgba(99,102,241,0.12));transition:opacity 0.2s ease;pointer-events:none;"></div>'
                    + '<div class="absolute bottom-0 left-0 right-0 p-1.5 text-center">'
                    + '<span class="text-[0.65rem] font-bold text-white leading-tight block">' + o.name + '</span>'
                    + '</div>'
                    + (isChecked ? '<div class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/50"><i class="fa-solid fa-check text-white text-[0.55rem]"></i></div>' : '')
                    + '</div>';
            }).join('');

            // dots
            if (dots) {
                dots.innerHTML = '';
                for (var p = 0; p < totalPages; p++) {
                    var dot = document.createElement('button');
                    dot.className = 'w-2 h-2 rounded-full transition-all ' + (p === gifPage ? 'bg-fuchsia-400 scale-125' : 'bg-white/20 hover:bg-white/40');
                    dot.setAttribute('onclick', 'tmplGifGoPage(' + p + ')');
                    dots.appendChild(dot);
                }
            }
        }

        window.tmplGifNav = function(dir) {
            var totalPages = Math.ceil(TMPL_OUTFITS.length / PER_PAGE);
            gifPage = (gifPage + dir + totalPages) % totalPages;
            renderGifGrid();
        };
        window.tmplGifGoPage = function(p) { gifPage = p; renderGifGrid(); };

        // ── Checkbox 卡片渲染 ──
        function renderCheckGrid() {
            var grid = document.getElementById('tmplOutfitCheckGrid');
            if (!grid) return;
            grid.innerHTML = TMPL_OUTFITS.map(function(o, idx) {
                var checked = selectedOutfits.has(idx);
                return '<label class="tmpl-outfit-check ' + (checked ? 'active' : '') + '" onclick="event.preventDefault(); tmplToggleOutfit(' + idx + ')">'
                    + '<div class="check-box">' + (checked ? '<i class="fa-solid fa-check text-white text-[0.6rem]"></i>' : '') + '</div>'
                    + '<span>' + o.name + '</span>'
                    + '</label>';
            }).join('');
        }

        window.tmplToggleOutfit = function(idx) {
            if (selectedOutfits.has(idx)) { selectedOutfits.delete(idx); }
            else { selectedOutfits.add(idx); }
            renderCheckGrid();
            renderGifGrid();
            tmplCalculate();
        };
        window.tmplToggleOutfitFromGif = function(idx) {
            tmplToggleOutfit(idx);
        };

        // ── qty helpers ──
        window.tmplSwitchModel = function(model) {
            tmplCurrentModel = model;
            // 切換分頁內容
            var kansoEl  = document.getElementById('tmpl-kanso-sections');
            var chanyeEl = document.getElementById('tmpl-chanye-sections');
            if (kansoEl)  kansoEl.style.display  = (model === 'kanso')  ? 'flex' : 'none';
            if (chanyeEl) chanyeEl.style.display = (model === 'chanye') ? 'flex' : 'none';
            if (kansoEl)  kansoEl.style.flexDirection  = 'column';
            if (chanyeEl) chanyeEl.style.flexDirection = 'column';
            if (kansoEl)  kansoEl.style.gap  = '1.5rem';
            if (chanyeEl) chanyeEl.style.gap = '1.5rem';
            // 切換時重置衣裝選擇
            selectedOutfits.clear();
            tmplQty.hairBang = 0; tmplQty.hairFull = 0;
            tmplQty.acc = 0; tmplQty.expr = 0;
            ['tmplHairBang','tmplHairFull','tmplAcc','tmplExpr'].forEach(function(id){
                var el = document.getElementById(id); if(el) el.checked = false;
            });
            ['tmplHairBangQty','tmplHairFullQty','tmplAccQty','tmplExprQty'].forEach(function(id){
                var el = document.getElementById(id); if(el) el.textContent = '0';
            });
            if (model === 'kanso') { renderCheckGrid(); renderGifGrid(); }
            if (model === 'chanye') { renderChanyeGifGrid(); }
            tmplCalculate();
        };

        // ── 長夜月搖 合作模板展示圖（之後替換為實際 GIF URL）──
        var CHANYE_GIFS = [
            { src: 'https://pbs.twimg.com/profile_images/2002045915809656832/kDFrBERD_400x400.png', label: '長夜月搖 展示圖 1' },
            { src: 'https://pbs.twimg.com/profile_images/2002045915809656832/kDFrBERD_400x400.png', label: '長夜月搖 展示圖 2' },
            { src: 'https://pbs.twimg.com/profile_images/2002045915809656832/kDFrBERD_400x400.png', label: '長夜月搖 展示圖 3' },
        ];
        var chanyeGifPage = 0;
        var CHANYE_PER_PAGE = 3;

        function renderChanyeGifGrid() {
            var grid = document.getElementById('tmplChanyeGifGrid');
            var dots = document.getElementById('tmplChanyeGifDots');
            if (!grid) return;
            var totalPages = Math.ceil(CHANYE_GIFS.length / CHANYE_PER_PAGE);
            var start = chanyeGifPage * CHANYE_PER_PAGE;
            var slice = CHANYE_GIFS.slice(start, start + CHANYE_PER_PAGE);
            grid.innerHTML = slice.map(function(o) {
                return '<div class="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 tmpl-card-hover" style="aspect-ratio:3/4;cursor:default;">'
                    + '<img src="' + o.src + '" alt="' + o.label + '" class="w-full h-full object-cover" style="transform:translate3d(0,0,0);will-change:transform;" loading="lazy">'
                    + '<div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>'
                    + '<div class="absolute bottom-0 left-0 right-0 p-2 text-center">'
                    + '<span class="text-xs font-bold text-white/90">' + o.label + '</span>'
                    + '</div></div>';
            }).join('');
            if (dots) {
                dots.innerHTML = '';
                for (var p = 0; p < totalPages; p++) {
                    var dot = document.createElement('button');
                    dot.className = 'w-2 h-2 rounded-full transition-all ' + (p === chanyeGifPage ? 'bg-rose-400 scale-125' : 'bg-white/20 hover:bg-white/40');
                    dot.setAttribute('onclick', 'tmplChanyeGifGoPage(' + p + ')');
                    dots.appendChild(dot);
                }
            }
        }
        window.tmplChanyeGifNav = function(dir) {
            var totalPages = Math.ceil(CHANYE_GIFS.length / CHANYE_PER_PAGE);
            chanyeGifPage = (chanyeGifPage + dir + totalPages) % totalPages;
            renderChanyeGifGrid();
        };
        window.tmplChanyeGifGoPage = function(p) { chanyeGifPage = p; renderChanyeGifGrid(); };

        // 長夜月搖數量 checkbox（預設已勾選，視覺一致性用）
        window.tmplChanyeQtyToggle = function() {
            var cb = document.getElementById('tmplChanyeQtyCheck');
            var box = cb ? cb.closest('label').querySelector('.w-6.h-6') : null;
            var icon = box ? box.querySelector('.fa-check') : null;
            if (!cb) return;
            // 強制保持勾選（數量至少 1 隻）
            if (!cb.checked) { cb.checked = true; }
            if (box)  { box.style.backgroundColor = 'var(--accent-primary)'; box.style.borderColor = 'var(--accent-primary)'; }
            if (icon) { icon.style.opacity = '1'; }
        };

        window.tmplToggleQty = function(id) {
            var key = id.replace('tmpl','').replace('HairBang','hairBang').replace('HairFull','hairFull').replace('Acc','acc').replace('Expr','expr');
            key = key.charAt(0).toLowerCase() + key.slice(1);
            var el = document.getElementById(id);
            if (el && el.checked) {
                if (tmplQty[key] === 0) { tmplQty[key] = 1; var qEl = document.getElementById(id+'Qty'); if(qEl) qEl.textContent = 1; }
            } else {
                tmplQty[key] = 0; var qEl2 = document.getElementById(id+'Qty'); if(qEl2) qEl2.textContent = 0;
            }
            // 配件文字框顯示
            if (id === 'tmplAcc') {
                var wrap = document.getElementById('tmplAccDescWrap');
                if (wrap) wrap.classList.toggle('hidden', !el.checked);
            }
            tmplCalculate();
        };

        window.tmplChangeQty = function(key, delta) {
            var idMap = { hairBang:'tmplHairBang', hairFull:'tmplHairFull', acc:'tmplAcc', expr:'tmplExpr' };
            var _min = (key === 'chanyeQty') ? 1 : 0;
            var _max = (key === 'chanyeQty') ? 99 : 20;
            tmplQty[key] = Math.max(_min, Math.min(_max, tmplQty[key] + delta));
            var qtyIdMap = { hairBang:'tmplHairBangQty', hairFull:'tmplHairFullQty', acc:'tmplAccQty', expr:'tmplExprQty', chanyeQty:'tmplChanyeQtyDisplay' };
            var qEl = document.getElementById(qtyIdMap[key] || ('tmpl' + key.charAt(0).toUpperCase() + key.slice(1) + 'Qty'));
            if (qEl) qEl.textContent = tmplQty[key];
            // 同步 checkbox 狀態
            var cb = document.getElementById(idMap[key]);
            if (cb) cb.checked = (tmplQty[key] > 0);
            // 配件文字框
            if (key === 'acc') {
                var wrap = document.getElementById('tmplAccDescWrap');
                if (wrap) wrap.classList.toggle('hidden', tmplQty[key] === 0);
            }
            tmplCalculate();
        };

        // ── 核心計算 ──
        window.tmplCalculate = function() {
            var count = selectedOutfits.size;
            var outfitCost = 0;
            if (count >= 1) {
                outfitCost = 1000 + Math.max(0, count - 1) * PRICE_ADD;
            }

            var total = outfitCost;
            var details = [];

            if (count >= 1) {
                // 衣裝名稱子列
                var selectedNames = Array.from(selectedOutfits).sort(function(a,b){return a-b;}).map(function(i){ return TMPL_OUTFITS[i].name; });
                var _dCalc = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
                var outfitDetailName = (_dCalc.tmpl_detail_outfit || '模板衣裝') + ' × ' + count + ' ' + (_dCalc.tmpl_detail_suit || '套');
                details.push({ name: outfitDetailName, price: outfitCost, subItems: selectedNames });
            }
            var keys = ['hairBang','hairFull','acc','expr'];
            // 長夜月搖數量（只在選擇該模板時計入，每隻 NT$ 2,000）
            var CHANYE_UNIT_PRICE = 2000;
            if (tmplCurrentModel === 'chanye' && tmplQty.chanyeQty >= 1) {
                var _dCh = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
                var chanyeCost = tmplQty.chanyeQty * CHANYE_UNIT_PRICE;
                total += chanyeCost;
                details.push({ name: (_dCh.tmpl_chanye_qty_detail||'長夜月搖擺') + ' × ' + tmplQty.chanyeQty + ' ' + (_dCh.tmpl_chanye_qty_unit||'隻'), price: chanyeCost });
            }
            var _d = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
            var labels = {
                hairBang: _d.tmpl_hair_bang    || '修改瀏海/後髮',
                hairFull: _d.tmpl_hair_full    || '整頂新髮型',
                acc:      _d.tmpl_acc_label    || '可開關配件',
                expr:     _d.tmpl_expr_label   || '簡單表情微調'
            };
            keys.forEach(function(k) {
                if (tmplQty[k] > 0) {
                    var c = tmplQty[k] * PRICE[k];
                    total += c;
                    details.push({ name: labels[k] + ' × ' + tmplQty[k], price: c });
                }
            });

            // 更新選中套數統計
            var countEl = document.getElementById('tmplSelectedCount');
            var subtEl  = document.getElementById('tmplOutfitSubtotal');
            if (countEl) countEl.textContent = count;
            if (subtEl) subtEl.textContent = 'NT$ ' + fmt(outfitCost);

            // 更新明細
            var dl = document.getElementById('tmplDetailList');
            if (dl) {
                if (details.length === 0) {
                    var _dEm = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
                    dl.innerHTML = '<div class="text-xs text-purple-400/50 text-center py-2">'+(_dEm.tmpl_detail_empty||'尚未選擇任何項目')+'</div>';
                } else {
                    dl.innerHTML = details.map(function(i){
                        var sub = '';
                        if (i.subItems && i.subItems.length > 0) {
                            sub = '<ul class="mt-1 ml-3 space-y-0.5">'
                                + i.subItems.map(function(n){ return '<li style="color:rgba(196,181,253,0.6);font-size:0.68rem;display:flex;align-items:center;gap:4px;"><span style="opacity:0.5">—</span>'+n+'</li>'; }).join('')
                                + '</ul>';
                        }
                        return '<div class="py-1.5 border-b border-white/5">'
                            + '<div class="flex justify-between items-start">'
                            + '<span class="text-purple-200/80 text-xs">' + i.name + '</span>'
                            + '<span class="text-white font-bold text-xs ml-2 shrink-0">NT$ ' + fmt(i.price) + '</span>'
                            + '</div>'
                            + sub
                            + '</div>';
                    }).join('');
                }
            }

            // 更新總計
            var tp = document.getElementById('tmplTotalPrice');
            if (tp) tp.textContent = fmt(total);

            // 訂金資訊
            var dep = document.getElementById('tmplDepositInfo');
            var _dDep = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
            if (dep && total > 0) dep.innerHTML = '<span class="text-purple-300/70">'+(_dDep.tmpl_deposit_label||'訂金（50%）')+'：</span><strong class="text-white">NT$ ' + fmt(Math.ceil(total * 0.5)) + '</strong>';
            else if (dep) dep.innerHTML = '';

            // 配件說明 & 補充資訊
            var accDesc = (document.getElementById('tmplAccDesc') || {}).value || '';
            var _suppEl = tmplCurrentModel === 'chanye' ? document.getElementById('tmplChanyeSuppInfo') : document.getElementById('tmplSuppInfo');
            var suppInfo = (_suppEl || {}).value || '';
            var accSumWrap = document.getElementById('tmplAccSummary');
            var accSumText = document.getElementById('tmplAccSummaryText');
            if (accSumWrap && accSumText) {
                accSumWrap.classList.toggle('hidden', !accDesc.trim());
                accSumText.textContent = accDesc.trim();
            }
            var suppWrap = document.getElementById('tmplSuppSummary');
            var suppText = document.getElementById('tmplSuppSummaryText');
            if (suppWrap && suppText) {
                suppWrap.classList.toggle('hidden', !suppInfo.trim());
                suppText.textContent = suppInfo.trim();
            }

            window.tmplCurrentDetails = details;
            window.tmplCurrentTotal   = total;
            window.tmplCurrentAccDesc = accDesc;
            window.tmplCurrentSupp    = suppInfo;
        };

        function fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

        // ── 同意條款切換複製 & 截圖按鈕 ──
        window.tmplToggleSubmit = function() {
            var cb  = document.getElementById('tmplAgreeTerms');
            var btn = document.getElementById('tmplCopyBtn');
            var sbt = document.getElementById('tmplScreenshotBtn');
            var badge = document.getElementById('orderBadgeTmpl');
            var orderEl = document.getElementById('orderIdTmpl');
            var enabled = cb && cb.checked;
            [btn, sbt].forEach(function(b) {
                if (!b) return;
                b.disabled = !enabled;
                b.style.opacity = enabled ? '1' : '0.45';
                b.style.cursor  = enabled ? 'pointer' : 'not-allowed';
            });
            if (badge) badge.style.display = enabled ? '' : 'none';
            if (orderEl && enabled && orderEl.textContent === '—') {
                // 生成委託編號
                var ts  = Date.now().toString(36).toUpperCase();
                var rnd = Math.random().toString(36).substr(2,4).toUpperCase();
                orderEl.textContent = 'T-' + ts.slice(-4) + '-' + rnd;
            }
        };

        // ── 重置 ──
        window.tmplReset = function() {
            selectedOutfits.clear();
            tmplQty = { hairBang:0, hairFull:0, acc:0, expr:0 };
            tmplQty.chanyeQty = 1;
            var chQtyEl = document.getElementById('tmplChanyeQtyDisplay'); if(chQtyEl) chQtyEl.textContent = '1';
            ['tmplHairBang','tmplHairFull','tmplAcc','tmplExpr'].forEach(function(id){
                var el = document.getElementById(id); if (el) el.checked = false;
            });
            ['tmplHairBangQty','tmplHairFullQty','tmplAccQty','tmplExprQty'].forEach(function(id){
                var el = document.getElementById(id); if (el) el.textContent = '0';
            });
            var w = document.getElementById('tmplAccDescWrap'); if(w) w.classList.add('hidden');
            var ad = document.getElementById('tmplAccDesc');    if(ad) ad.value = '';
            var si = document.getElementById('tmplSuppInfo');   if(si) si.value = '';
            var si2 = document.getElementById('tmplChanyeSuppInfo'); if(si2) si2.value = '';
            var at = document.getElementById('tmplAgreeTerms'); if(at) at.checked = false;
            renderCheckGrid(); renderGifGrid(); tmplCalculate(); tmplToggleSubmit();
        };

        // ── 一鍵複製 ──
        window.tmplCopySummary = function() {
            var selectedNames = Array.from(selectedOutfits).sort(function(a,b){return a-b;}).map(function(i){ return TMPL_OUTFITS[i].name; });
            var _dCopy = (typeof currentLang!=='undefined' && typeof I18N!=='undefined' && I18N[currentLang]) ? I18N[currentLang] : {};
            var lines = [
                '💜 ' + (_dCopy.nav_template||'聯名模板') + ' — ' + (_dCopy.tmpl_copy_header||'委託需求清單') + ' 💜',
                '================================',
                '【' + (_dCopy.tmpl_copy_type||'模板類型') + '】' + (tmplCurrentModel === 'chanye'
                    ? (_dCopy.tmpl_card_chanye_name||'長夜月搖（紅妻）')
                    : (_dCopy.tmpl_card_kanso_name||'換裝娃娃（殘光）')),
                '【' + (_dCopy.tmpl_copy_outfits||'選擇衣裝') + '】' + (selectedNames.length ? selectedNames.join('、') : (_dCopy.tmpl_copy_none||'（未選擇）')),
                '--------------------------------',
            ];
            (window.tmplCurrentDetails || []).forEach(function(i){
                lines.push(i.name + '：NT$ ' + fmt(i.price));
            });
            lines.push('--------------------------------');
            lines.push('預估總計：NT$ ' + fmt(window.tmplCurrentTotal || 0));
            if (window.tmplCurrentAccDesc && window.tmplCurrentAccDesc.trim()) {
                lines.push('');
                lines.push('【' + (_dCopy.tmpl_copy_acc||'配件需求') + '】' + window.tmplCurrentAccDesc.trim());
            }
            if (window.tmplCurrentSupp && window.tmplCurrentSupp.trim()) {
                lines.push('');
                lines.push('【' + (_dCopy.tmpl_copy_supp||'補充說明') + '】' + window.tmplCurrentSupp.trim());
            }
            lines.push('');
            lines.push('※ ' + (_dCopy.tmpl_copy_note||'以上為初步估算，實際報價以確認後為準'));
            var text = lines.join('\r\n');
            if (typeof copyToClipboardFallback === 'function') { copyToClipboardFallback(text); return; }
            try {
                navigator.clipboard.writeText(text).then(function(){
                    if (typeof showToast === 'function') showToast('已複製到剪貼簿！');
                }).catch(function(){
                    var ta = document.createElement('textarea');
                    ta.value = text; ta.style.cssText='position:fixed;opacity:0;';
                    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                    if (typeof showToast === 'function') showToast('已複製到剪貼簿！');
                });
            } catch(e) {}
        };

        // ── switchTab 攔截 ──
        document.addEventListener('DOMContentLoaded', function() {
            var _orig = window.switchTab;
            window.switchTab = function(tabId) {
                if (typeof _orig === 'function') _orig(tabId);
                if (tabId === 'template') {
                    renderCheckGrid();
                    renderGifGrid();
                    renderChanyeGifGrid();
                    tmplCalculate();
                }
            };
        });
    })();

/* ── 核心邏輯：分頁切換、報價計算機、主題/語言切換等 ── */
        // 白天/夜晚切換邏輯
        // ==================== V5 功能 JS ====================

        // ==================== 截圖 + 寄信 ====================
        function screenshotAndEmail(panelId, emailInputId, type) {
            const agreeId = panelId === 'quoteSummaryPanel' ? 'agreeTerms' : 'animAgreeTerms';
            if (!document.getElementById(agreeId).checked) { alert((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].toast_agree||'請先勾選同意條款':'請先勾選同意條款'); return; }
            const userEmail = document.getElementById(emailInputId).value;
            const targetEmail = 'n47993802@gmail.com';
            const subject = encodeURIComponent(`【委託表單】Live2D ${type} 委託試算`);
            const body = encodeURIComponent(`申請人信箱: ${userEmail}\n\n請查看附件截圖（已另存為圖片）。\n\n${type === 'V皮設計' ? getQuoteText() : getAnimQuoteText()}`);
            // Screenshot first then open mail
            screenshotQuote(panelId);
            setTimeout(() => window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`), 800);
        }

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

        function screenshotQuote(panelId, type) {
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
            // Load html2canvas if not already loaded
            if (!window.html2canvas) {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                s.onload = () => doScreenshot(panel, orderId);
                document.head.appendChild(s);
            } else {
                doScreenshot(panel, orderId);
            }
        }
        function doScreenshot(panel, orderId) {
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

        function toggleTheme() {
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
            });
        }
        function toggleNavDropdown(e, key) { e.stopPropagation();
            const dd = document.getElementById(key + 'Dropdown');
            const other = key === 'comm' ? 'creativeDropdown' : 'commDropdown';
            document.getElementById(other)?.classList.add('hidden');
            dd.classList.toggle('hidden');
        }
        document.addEventListener('click', e => {
            if(!document.getElementById('commDropdownWrap')?.contains(e.target) &&
               !document.getElementById('creativeDropdownWrap')?.contains(e.target)) {
                closeDropdowns();
            }
        });

        // ---- FAQ Accordion ----
        function togglePlanCompare(btn) {
            const body  = document.getElementById('planCompareBody');
            const arrow = document.getElementById('planCompareArrow');
            const open  = !body.classList.contains('hidden');
            body.classList.toggle('hidden', open);
            arrow.style.transform = open ? '' : 'rotate(180deg)';
            btn.setAttribute('aria-expanded', String(!open));
            // 更新提示文字 i18n
            const hintEl = btn.querySelector('[data-i18n="plan_compare_hint"]');
            if (hintEl) {
                const _d = (typeof currentLang !== 'undefined' && I18N[currentLang]) ? I18N[currentLang] : I18N['zh-TW'];
                hintEl.textContent = open ? (_d.plan_compare_hint || '（點擊展開）') : (_d.plan_compare_hint_open || '（點擊收合）');
            }
        }

        function toggleFaq(btn) {
            const body = btn.nextElementSibling;
            const arrow = btn.querySelector('.faq-arrow');
            const isOpen = !body.classList.contains('hidden');
            // 關閉所有已開啟的項目
            document.querySelectorAll('.faq-body').forEach(b => b.classList.add('hidden'));
            document.querySelectorAll('.faq-arrow').forEach(a => a.style.transform = '');
            // 若點擊的是已關閉的，才展開它
            if (!isOpen) {
                body.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
                setTimeout(() => body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        }

        function switchTab(tabId) {
            if (tabId === undefined) return;
            closeDropdowns();
            // 隱藏所有頁面：page-portfolio 用 gif-hidden（visibility 方案）避免 display:none 重置 GIF 幀
            document.querySelectorAll('.page-content').forEach(el => {
                if (el.id === 'page-portfolio') {
                    el.classList.add('gif-hidden');
                    el.classList.remove('flex', 'block');
                } else {
                    el.classList.add('hidden');
                    el.classList.remove('flex', 'block');
                }
            });
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('active');
                el.classList.remove('text-white');
                el.classList.add('text-purple-300');
            });
            const targetPage = document.getElementById('page-' + tabId);
            if (!targetPage) return;
            if(tabId === 'core' || tabId === 'anim') {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('flex');
                targetPage.style.animation = 'none';
                targetPage.offsetHeight;
                targetPage.style.animation = '';
            } else if(tabId === 'portfolio') {
                // portfolio：移除 gif-hidden，不加任何 animation，保持 GIF 持續播放
                targetPage.classList.remove('gif-hidden', 'hidden');
                targetPage.classList.add('block');
                targetPage.style.animation = 'none';
                // 每次切入都重新觸發 port-reveal 緩入動畫（用雙 rAF 確保佈局完成後才 transition）
                (function triggerPortReveal() {
                    const portEls = targetPage.querySelectorAll('.port-reveal');
                    portEls.forEach(function(el) {
                        el.classList.remove('visible');
                        el.style.transition = 'none';
                    });
                    requestAnimationFrame(function() {
                        requestAnimationFrame(function() {
                            portEls.forEach(function(el, i) {
                                el.style.transition = '';
                                setTimeout(function() { el.classList.add('visible'); }, i * 70);
                            });
                        });
                    });
                })();
            } else if (tabId === 'template') {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('flex');
                targetPage.style.animation = 'none';
                targetPage.offsetHeight;
                targetPage.style.animation = '';
            } else {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('block');
            }
            // Highlight parent dropdown trigger if child tab active
            (function() {
                var activeBtn = null;
                if (['rules','core','anim','template'].includes(tabId)) {
                    activeBtn = document.getElementById('tab-comm-trigger');
                } else if (['live2d-demo','portfolio','channels','fanart'].includes(tabId)) {
                    activeBtn = document.getElementById('tab-creative-trigger');
                } else {
                    activeBtn = document.getElementById('tab-' + tabId);
                }
                if (activeBtn) {
                    activeBtn.classList.add('active');
                    activeBtn.classList.remove('text-purple-300');
                    activeBtn.classList.add('text-white');
                }
            })();
            if(tabId === 'core') calculate();
            else if(tabId === 'anim') calculateAnim();
            else if(tabId === 'template') { /* tmplCalculate called by interceptor */ }
            else if(tabId === 'live2d-demo') initLive2DDemo();
            else if(tabId === 'fanart') loadFanart();
            else if(tabId === 'portfolio') {
                // 手動翻頁模式，無自動計時器
                // 首次進入時才初始化 GIF 展示（lazy init，防止 hidden 狀態下 GIF decode 閃爍）
                gifEnsureInit();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // --- Google Sites 剪貼簿繞過方案 (Fallback) ---
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
        let quantities = { extraExpr: 0, smallAcc: 0, gesture: 0, pose: 0, hairset: 0, clothes: 0, specialFx: 0 };
        const prices = { base: {10000: "plan_basic", 15000: "plan_pro", 20000: "plan_adv"}, tongue: 1000, ear: 1000, tail: 500, vowel: 800, extraExpr: 200, smallAcc: 250, gesture: 1200, pose: 1500, hairset: 1500, clothes: 2000, specialFx: 250, trackingLoss: 600, loli: 4000, vbridger: 3500 };

        function toggleQtyItem(type) {
            const cb = document.getElementById(type);
            if (!cb) return;
            if (cb.checked && quantities[type] === 0) {
                // 勾選時若數量為 0，自動設為 1
                quantities[type] = 1;
                document.getElementById(type + 'Qty').textContent = 1;
            } else if (!cb.checked) {
                // 取消勾選時歸零
                quantities[type] = 0;
                document.getElementById(type + 'Qty').textContent = 0;
            }
            calculate();
        }

        function changeQty(type, delta) {
            quantities[type] = Math.max(0, quantities[type] + delta);
            document.getElementById(type + 'Qty').textContent = quantities[type];
            // 數量 > 0 時自動勾選；歸零時自動取消勾選
            if (document.getElementById(type)) document.getElementById(type).checked = quantities[type] > 0;
            calculate();
        }

        function selectPayment(selected) {
            ['bank', 'paypal', 'ecpay'].forEach(p => { if (p !== selected) document.getElementById(p).checked = false; });
            document.getElementById(selected).checked = true; calculate(); syncCheckboxVisuals();
        }

        function updatePaymentFields() { calculate(); }
        function toggleSubmitButton() {
            const checked = document.getElementById('agreeTerms').checked;
            // 截圖按鈕
            document.getElementById('copyBtn').disabled = !checked;
            // 委託編號 badge：勾選後展開，並確保編號已生成
            const badge = document.getElementById('orderBadgeVP');
            if (badge) badge.style.display = checked ? '' : 'none';
            if (checked) {
                const orderEl = document.getElementById('orderIdVP');
                if (orderEl && (!orderEl.textContent.trim() || orderEl.textContent.trim() === '—')) {
                    orderEl.textContent = generateOrderNumber('vp');
                }
            }
            // 一鍵複製：勾選後解鎖
            const copyBtn = document.getElementById('btn-copy-summary-vp');
            if (copyBtn) {
                copyBtn.disabled = !checked;
                copyBtn.style.opacity = checked ? '1' : '0.45';
                copyBtn.style.cursor  = checked ? 'pointer' : 'not-allowed';
            }
        }
        function toggleRushField() { document.getElementById('rushContainer').classList.toggle('hidden', !document.getElementById('rush').checked); calculate(); }
        // ── 幣值格式化（依語系自動套用千分位 locale）──
        function formatMoney(num) {
            var locale = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
            var localeMap = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', 'en': 'en-US', 'ja': 'ja-JP' };
            return Math.round(num).toLocaleString(localeMap[locale] || 'zh-TW');
        }
        // 取得幣值符號（固定 NT$，但 toLocaleString 使用正確千分位格式）
        function getCurrencyPrefix() { return 'NT$ '; }
        // ── 數字輸入框防錯：防止負數、非數字、超出上下限破版 ──
        function sanitizeNumberInput(el, min, max) {
            var raw = String(el.value).replace(/[^0-9]/g, '');
            var val = parseInt(raw, 10);
            if (isNaN(val) || val < min) val = min;
            if (max !== undefined && val > max) val = max;
            el.value = val;
        }

        // ── debounce 工具函數 ──────────────────────────────────────
        // 只用在 oninput（自由文字輸入），onchange（checkbox/radio/select）維持即時
        function debounce(fn, ms) {
            let t;
            return function() { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); };
        }
        // textarea oninput 專用的 debounce 版本（150ms 後才觸發計算）
        const calculateDebounced     = debounce(function() { if (typeof calculate     === 'function') calculate(); },     150);
        const calculateAnimDebounced = debounce(function() { if (typeof calculateAnim === 'function') calculateAnim(); }, 150);
        // ─────────────────────────────────────────────────────────

        function calculate() {
            let baseElement = document.querySelector('input[name="baseModel"]:checked');
            let basePrice = baseElement ? parseInt(baseElement.value) : 15000;

            // ── v32 漏洞修復①：頂級方案已內含特效動畫，自動取消加購並鎖定 ──
            const isTopPlan = (basePrice === 20000);
            const fxCb     = document.getElementById('specialFx');
            const fxLabel  = fxCb ? fxCb.closest('label') : null;
            if (fxCb) {
                if (isTopPlan) {
                    // 強制取消勾選 + 歸零 + disabled
                    fxCb.checked  = false;
                    fxCb.disabled = true;
                    quantities['specialFx'] = 0;
                    const fxQtyEl = document.getElementById('specialFxQty');
                    if (fxQtyEl) fxQtyEl.textContent = '0';
                    // 視覺提示：半透明 + 不可點擊
                    if (fxLabel) {
                        fxLabel.style.opacity  = '0.42';
                        fxLabel.style.cursor   = 'not-allowed';
                        fxLabel.style.pointerEvents = 'none';
                        // 在標題旁補充說明文字（只插入一次）
                        let incTag = fxLabel.querySelector('.fx-included-tag');
                        if (!incTag) {
                            const _d2 = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW'];
                            incTag = document.createElement('span');
                            incTag.className = 'fx-included-tag';
                            incTag.style.cssText = 'font-size:.65rem;font-weight:700;color:#fbbf24;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);border-radius:4px;padding:1px 6px;margin-left:6px;letter-spacing:.03em;';
                            incTag.textContent = _d2.plan_compare_fx_top || '✦ 內含基礎特效';
                            const fxTitle = fxLabel.querySelector('[data-i18n="opt_fx"]');
                            if (fxTitle) fxTitle.parentElement.insertBefore(incTag, fxTitle.nextSibling);
                        }
                    }
                } else {
                    // 解除 disabled，恢復正常
                    fxCb.disabled = false;
                    if (fxLabel) {
                        fxLabel.style.opacity  = '';
                        fxLabel.style.cursor   = '';
                        fxLabel.style.pointerEvents = '';
                        // 移除說明標籤
                        const incTag = fxLabel.querySelector('.fx-included-tag');
                        if (incTag) incTag.remove();
                    }
                }
            }
            syncCheckboxVisuals();

            let extra = 0; const _d = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; const _planKey = prices.base[basePrice]; const _planName = _d[_planKey]||_planKey; let details = [{name: `[${_d.core_s1||'方案'}] ${_planName}`, price: basePrice}];

            ['tongue','ear','tail','vowel'].forEach(id => {
                if (document.getElementById(id) && document.getElementById(id).checked) { extra += prices[id];
                    const _nm = {tongue:_d.opt_tongue||'吐舌', ear:_d.opt_ear||'獸耳', tail:_d.opt_tail||'尾巴', vowel:_d.opt_vowel||'母音口型'}[id];
                    details.push({name: _nm, price: prices[id]}); }
            });
            ['extraExpr', 'smallAcc', 'hairset', 'clothes', 'gesture', 'pose', 'specialFx'].forEach(type => {
                if (document.getElementById(type) && document.getElementById(type).checked && quantities[type] > 0) { 
                    let cost = quantities[type] * prices[type]; extra += cost; 
                    const _nmap = {extraExpr:_d.opt_expr||'表情', smallAcc:_d.opt_acc||'小配件', hairset:_d.opt_hair||'髮型', clothes:_d.opt_clothes||'服裝', gesture:_d.opt_gesture||'手勢', pose:_d.opt_pose||'姿態', specialFx:_d.opt_fx||'特效動畫'};
                    let n = _nmap[type];
                    details.push({name: `${n} x${quantities[type]}`, price: cost}); 
                }
            });
            ['trackingLoss', 'loli', 'vbridger'].forEach(id => {
                if (document.getElementById(id) && document.getElementById(id).checked) { extra += prices[id]; const _sn = {trackingLoss:_d.opt_tracking||'追蹤丟失動畫', loli:_d.opt_chibi||'人物Q版化', vbridger:_d.opt_vbridger||'VBridger'}[id];
                    details.push({name: _sn, price: prices[id]}); }
            });

            let subtotalForProject = basePrice + extra;

            // 工程資料加購計算
            if (document.getElementById('projectFile') && document.getElementById('projectFile').checked) {
                let projectCost = Math.round(subtotalForProject * 1.5);
                extra += projectCost;
                details.push({name: `${_d.opt_project||'工程資料加購'} (x1.5)`, price: projectCost});
            }

            if (document.getElementById('rush') && document.getElementById('rush').checked) { 
                let rushPrice = parseInt(document.getElementById('rushPrice').value) || 3500;
                extra += rushPrice; details.push({name: _d.opt_rush||'加急趕工', price: rushPrice}); 
            }

            let subtotal = basePrice + extra;
            let fee = 0; let paymentMethod = _d.pay_bank||'銀行匯款';
            if (document.getElementById('paypal').checked) {
                let rate = parseFloat(document.getElementById('paypalRate').value) || 0; fee += Math.round(subtotal * (rate / 100)); paymentMethod = 'PayPal';
                if(fee > 0) details.push({name: `PayPal ${_d.pay_fee||'手續費'} (${rate}%)`, price: fee});
            } else if (document.getElementById('ecpay').checked) {
                let rate = parseFloat(document.getElementById('ecpayRate').value) || 0; fee += Math.round(subtotal * (rate / 100)); paymentMethod = _d.pay_ecpay||'綠界/超商';
                if(fee > 0) details.push({name: `${_d.pay_ecpay||'綠界'} ${_d.pay_fee||'手續費'} (${rate}%)`, price: fee});
            }

            let finalTotal = subtotal + fee;
            const plan = document.querySelector('input[name="paymentPlan"]:checked').value;
            let paymentHtml = '';
            
            if (plan === 'one') { paymentHtml = `${_d.pay_one||'一次付清'}：<strong class="text-emerald-400">${getCurrencyPrefix()}${formatMoney(finalTotal)}</strong>`; } 
            else if (plan === 'two') { /* two installments */
                let instFee = Math.round(finalTotal * 0.03); finalTotal += instFee; details.push({name: `${_d.pay_two||'兩期分款'} ${_d.pay_fee||'手續費'} (3%)`, price: instFee});
                paymentHtml = `<div class="flex justify-between"><span>第一期 (50%):</span> <strong class="text-white">${getCurrencyPrefix()}${formatMoney(Math.round(finalTotal*0.5))}</strong></div>`;
            } else if (plan === 'three') {
                let instFee = Math.round(finalTotal * 0.05); finalTotal += instFee; details.push({name: `${_d.pay_three||'三期分款'} ${_d.pay_fee||'手續費'} (5%)`, price: instFee});
                paymentHtml = `<div class="flex justify-between"><span>第一期 (40%):</span> <strong class="text-white">${getCurrencyPrefix()}${formatMoney(Math.round(finalTotal*0.4))}</strong></div>`;
            }
            
            document.getElementById('depositInfo').innerHTML = paymentHtml;
            document.getElementById('totalPrice').textContent = `${getCurrencyPrefix()}${formatMoney(finalTotal)}`;
            document.getElementById('detailList').innerHTML = details.map(i => `<div class="flex justify-between py-1 border-b border-white/5"><span>${i.name}</span><span>${getCurrencyPrefix()}${formatMoney(i.price)}</span></div>`).join('');

            window.currentQuoteDetails = details; window.currentFinalTotal = finalTotal; window.currentPayment = paymentMethod; window.currentPaymentPlan = plan;
            // v29：為一鍵複製功能提供別名
            window.currentVpDetails = details; window.currentVpTotal = finalTotal;
            // 同步加急說明 & 補充資訊到截圖面板
            const rushText = document.getElementById('rushInfo')?.value || '';
            const suppText = document.getElementById('supplementInfo')?.value || '';
            const rushBlock = document.getElementById('quoteRushSummary');
            const suppBlock = document.getElementById('quoteSuppSummary');
            if (rushBlock) { rushBlock.classList.toggle('hidden', !rushText.trim()); document.getElementById('quoteRushSummaryText').textContent = rushText; }
            if (suppBlock) { suppBlock.classList.toggle('hidden', !suppText.trim()); document.getElementById('quoteSuppSummaryText').textContent = suppText; }
            syncCheckboxVisuals();
        }

        function getQuoteText() {
            const _d = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW'];
            const _qn = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].name_short||'阿卡貓 HakkaNeko':'阿卡貓 HakkaNeko';
            let text = `💜 ${_qn} Live2D 試算價目表 💜\n================================\n`;
            window.currentQuoteDetails.forEach(item => { text += `${item.name}：${getCurrencyPrefix()}${formatMoney(item.price)}\n`; });
            const planLabel = window.currentPaymentPlan==='one'?(_d.pay_one||'一次付清'):window.currentPaymentPlan==='two'?(_d.pay_two||'兩期分款'):(_d.pay_three||'三期分款');
            text += `--------------------------------\n${_d.pay_method||'支付方式'}：${window.currentPayment}\n${_d.pay_installment||'付款方式'}：${planLabel}\n總金額：${getCurrencyPrefix()}${formatMoney(window.currentFinalTotal)}\n`;
            const supp = document.getElementById('supplementInfo').value; if(supp) text += `\n${_d.sidebar_supp_label||'補充資訊'}：\n${supp}\n`;
            if (document.getElementById('rush') && document.getElementById('rush').checked) { const rush = document.getElementById('rushInfo').value; if(rush) text += `\n【${_d.opt_rush||'加急趕工'}】\n${rush}\n`; }
            return text;
        }

        function copyQuote() { if(document.getElementById('agreeTerms').checked) { copyToClipboardFallback(getQuoteText()); } }
        function resetForm() {
            document.querySelectorAll('#page-core input[type="checkbox"]').forEach(i => i.checked = false);
            // Reset radio buttons to default plan (pro = 15000)
            const defaultRadio = document.querySelector('#page-core input[name="baseModel"][value="15000"]');
            if (defaultRadio) defaultRadio.checked = true;
            const defaultPlan = document.querySelector('#page-core input[name="paymentPlan"][value="one"]');
            if (defaultPlan) defaultPlan.checked = true;
            // Reset all quantities to 0
            Object.keys(quantities).forEach(k => {
                quantities[k] = 0;
                const qEl = document.getElementById(k + 'Qty');
                if (qEl) qEl.textContent = 0;
            });
            // Hide rush container
            const rushContainer = document.getElementById('rushContainer');
            if (rushContainer) rushContainer.classList.add('hidden');
            const rushInfo = document.getElementById('rushInfo');
            if (rushInfo) rushInfo.value = '';
            const suppInfo = document.getElementById('supplementInfo');
            if (suppInfo) suppInfo.value = '';
            // 重置時清空編號，下次報價重新生成新號碼
            const vpOrd = document.getElementById('orderIdVP');
            if (vpOrd) vpOrd.textContent = '—';
            calculate();
            syncCheckboxVisuals();
        }

        // ==================== 動畫設計 邏輯 ====================
        function updateAnimFields() {
            const isSticker = document.querySelector('input[name="animBaseType"]:checked').value === 'sticker';
            const stickerEl = document.getElementById('animStickerFields');
            const processEl = document.getElementById('animProcessFields');
            if (isSticker) {
                stickerEl.style.display = 'grid';
                processEl.style.display = 'none';
            } else {
                stickerEl.style.display = 'none';
                processEl.style.display = 'grid';
            }
        }
        function selectPaymentAnim(s) { ['bank', 'paypal', 'ecpay'].forEach(p => document.getElementById('anim'+p.charAt(0).toUpperCase()+p.slice(1)).checked = (p === s)); calculateAnim(); syncCheckboxVisuals();
            // 委託編號：第一次報價時生成，之後固定不變
            const vpOrderEl = document.getElementById('orderIdVP');
            if (vpOrderEl && vpOrderEl.textContent.trim() === '\u2014') {
                vpOrderEl.textContent = generateOrderNumber('vp');
            }
        }
        function toggleAnimSubmitButton() {
            const checked = document.getElementById('animAgreeTerms').checked;
            // 截圖按鈕
            document.getElementById('animCopyBtn').disabled = !checked;
            // 委託編號 badge：勾選後展開，並確保編號已生成
            const badge = document.getElementById('orderBadgeAnim');
            if (badge) badge.style.display = checked ? '' : 'none';
            if (checked) {
                const orderEl = document.getElementById('orderIdAnim');
                if (orderEl && (!orderEl.textContent.trim() || orderEl.textContent.trim() === '—')) {
                    orderEl.textContent = generateOrderNumber('anim');
                }
            }
            // 一鍵複製：勾選後解鎖
            const copyBtn = document.getElementById('btn-copy-summary-anim');
            if (copyBtn) {
                copyBtn.disabled = !checked;
                copyBtn.style.opacity = checked ? '1' : '0.45';
                copyBtn.style.cursor  = checked ? 'pointer' : 'not-allowed';
            }
        }
        function toggleAnimRushField() { document.getElementById('animRushContainer').classList.toggle('hidden', !document.getElementById('animRush').checked); calculateAnim(); }

        function calculateAnim() {
            const _d2 = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW'];
            const isSticker = document.querySelector('input[name="animBaseType"]:checked').value === 'sticker';
            let extra = 0; let details = [];

            if (isSticker) {
                let qty = Math.min(99, Math.max(1, parseInt(document.getElementById('stickerQty').value) || 1));
                let physics = parseInt(document.getElementById('stickerPhysics').value) || 0;
                let time = Math.min(60, Math.max(1, parseInt(document.getElementById('stickerTime').value) || 3));
                let baseSticker = 400;
                details.push({name: `${_d2.anim_type_sticker||'動態貼圖'} x${qty}`, price: baseSticker * qty});
                if(physics > 0) details.push({name: _d2.physics_high_200||'高精細度', price: physics * qty});
                if(time > 3) details.push({name: `${_d2.field_duration||'動態時間'} +${time-3}s x${qty}`, price: (time-3)*50*qty});
                extra += (baseSticker + physics + (time > 3 ? (time-3)*50 : 0)) * qty;
            } else {
                let physics = parseInt(document.getElementById('processPhysics').value) || 0;
                let time = Math.min(600, Math.max(1, parseInt(document.getElementById('processTime').value) || 5));
                let chars = Math.min(20, Math.max(1, parseInt(document.getElementById('processChars').value) || 1));
                let baseCost = 2500;
                details.push({name: `${_d2.anim_type_process||'動畫處理'}`, price: baseCost});
                if(physics > 0) {
                    const physicsLabel = physics===1000 ? (_d2.physics_high_1000||'高精細度') : physics===2000 ? (_d2.physics_ultra||'極致精細') : `+${physics}`;
                    details.push({name: physicsLabel, price: physics});
                }
                if(time > 5) details.push({name: `${_d2.field_duration||'動畫時長'} +${time-5}s`, price: (time-5)*200});
                if(chars > 1) details.push({name: `${_d2.field_chars||'人物數量'} x${chars}`, price: (chars-1)*1000});
                if(document.getElementById('processPerformance').checked) details.push({name: _d2.field_performance||'表演設計', price: 1000});
                if(document.getElementById('processBg').checked) details.push({name: _d2.field_bg||'背景動畫', price: 500});
                let cost = baseCost + physics + (time>5?(time-5)*200:0) + (chars>1?(chars-1)*1000:0);
                if(document.getElementById('processPerformance').checked) cost += 1000;
                if(document.getElementById('processBg').checked) cost += 500;
                extra += cost;
            }

            if (document.getElementById('animRush') && document.getElementById('animRush').checked) {
                let rPrice = parseInt(document.getElementById('animRushPrice').value) || 1000;
                extra += rPrice; details.push({name: _d2.opt_rush||'加急趕工', price: rPrice});
            }

            let subtotal = extra; let fee = 0; let paymentMethod = _d2.pay_bank||'銀行匯款';
            if (document.getElementById('animPaypal').checked) {
                let r = parseFloat(document.getElementById('animPaypalRate').value)||0;
                fee += Math.round(subtotal*(r/100)); paymentMethod = 'PayPal';
                if(fee>0) details.push({name:`PayPal ${_d2.pay_fee||'手續費'} (${r}%)`, price: fee});
            } else if (document.getElementById('animEcpay').checked) {
                let r = parseFloat(document.getElementById('animEcpayRate').value)||0;
                fee += Math.round(subtotal*(r/100)); paymentMethod = _d2.pay_ecpay||'綠界/超商';
                if(fee>0) details.push({name:`${_d2.pay_ecpay||'綠界'} ${_d2.pay_fee||'手續費'} (${r}%)`, price: fee});
            }

            let finalTotal = subtotal + fee;
            const plan = document.querySelector('input[name="animPaymentPlan"]:checked').value;
            if(plan==='two') { let f=Math.round(finalTotal*0.03); finalTotal+=f; details.push({name:`${_d2.pay_two||'兩期'} ${_d2.pay_fee||'手續費'} (3%)`, price:f}); }
            else if(plan==='three') { let f=Math.round(finalTotal*0.05); finalTotal+=f; details.push({name:`${_d2.pay_three||'三期'} ${_d2.pay_fee||'手續費'} (5%)`, price:f}); }

            const animPlan = plan;
            let animPayHtml = '';
            if(animPlan==='one') { animPayHtml = `${_d2.pay_one||'一次付清'}：<strong class="text-emerald-400">${getCurrencyPrefix()}${formatMoney(finalTotal)}</strong>`; }
            else { animPayHtml = `${_d2.pay_installment||'分期付款'}：<strong class="text-blue-400">${_d2.deposit_label||'頭款'} ${getCurrencyPrefix()}${formatMoney(Math.ceil(finalTotal/(animPlan==='two'?2:3)))}</strong>`; }
            
            document.getElementById('animDepositInfo').innerHTML = animPayHtml;
            document.getElementById('animTotalPrice').textContent = `${getCurrencyPrefix()}${formatMoney(finalTotal)}`;
            document.getElementById('animDetailList').innerHTML = details.map(i => `<div class="flex justify-between py-1 border-b border-white/5"><span>${i.name}</span><span>${getCurrencyPrefix()}${formatMoney(i.price)}</span></div>`).join('');
            
            window.currentAnimDetails = details; window.currentAnimTotal = finalTotal; window.currentAnimPayment = paymentMethod; window.currentAnimPlan = plan;
            // 同步加急說明 & 補充資訊到截圖面板
            const animRushText = document.getElementById('animRushInfo')?.value || '';
            const animSuppText = document.getElementById('animSupplementInfo')?.value || '';
            const animRushBlock = document.getElementById('animQuoteRushSummary');
            const animSuppBlock = document.getElementById('animQuoteSuppSummary');
            if (animRushBlock) { animRushBlock.classList.toggle('hidden', !animRushText.trim()); document.getElementById('animQuoteRushSummaryText').textContent = animRushText; }
            if (animSuppBlock) { animSuppBlock.classList.toggle('hidden', !animSuppText.trim()); document.getElementById('animQuoteSuppSummaryText').textContent = animSuppText; }
            syncCheckboxVisuals();
            // 委託編號：第一次報價時生成，之後固定不變
            const animOrderEl = document.getElementById('orderIdAnim');
            if (animOrderEl && animOrderEl.textContent === '—') {
                animOrderEl.textContent = generateOrderNumber('anim');
            }
        }

        function getAnimQuoteText() {
            const _qna = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].name_short||'阿卡貓 HakkaNeko':'阿卡貓 HakkaNeko';
            let text = `💜 ${_qna} Live2D 動畫設計 💜\n================================\n`;
            window.currentAnimDetails.forEach(item => { text += `${item.name}：${getCurrencyPrefix()}${formatMoney(item.price)}\n`; });
            text += `--------------------------------\n總金額：${getCurrencyPrefix()}${formatMoney(window.currentAnimTotal)}\n`;
            return text;
        }

        function copyAnimQuote() { if(document.getElementById('animAgreeTerms').checked) { copyToClipboardFallback(getAnimQuoteText()); } }
        function resetAnimForm() {
            document.querySelectorAll('#page-anim input[type="checkbox"]').forEach(i => i.checked = false);
            // Reset anim type to sticker (default)
            const defaultType = document.querySelector('#page-anim input[name="animBaseType"][value="sticker"]');
            if (defaultType) defaultType.checked = true;
            const defaultPlan = document.querySelector('#page-anim input[name="animPaymentPlan"][value="one"]');
            if (defaultPlan) defaultPlan.checked = true;
            // Reset numeric fields to defaults
            ['stickerQty','stickerPhysics','stickerTime','processPhysics','processTime','processChars'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const defaults = { stickerQty: 1, stickerPhysics: 0, stickerTime: 3, processPhysics: 0, processTime: 5, processChars: 1 };
                el.value = defaults[id] ?? el.defaultValue;
            });
            // Hide rush container and clear text fields
            const animRushContainer = document.getElementById('animRushContainer');
            if (animRushContainer) animRushContainer.classList.add('hidden');
            const animRushInfo = document.getElementById('animRushInfo');
            if (animRushInfo) animRushInfo.value = '';
            const animSuppInfo = document.getElementById('animSupplementInfo');
            if (animSuppInfo) animSuppInfo.value = '';
            updateAnimFields();
            // 重置時清空編號，下次報價重新生成新號碼
            const animOrd = document.getElementById('orderIdAnim');
            if (animOrd) animOrd.textContent = '—';
            calculateAnim();
            syncCheckboxVisuals();
        }

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
        let live2dApp = null;
        let live2dModel = null;
        let live2dInited = false;
        let demoParams = { eye: 0.5, body: 0.5, exp: 0.5, breath: 0.5, blink: true, lip: false, physics: true };

        function initLive2DDemo() {
            if (live2dInited) return;
            live2dInited = true;
        }

        // 模型固定 URL — 📌 改為 GitHub raw URL 後即可正常載入
        // 格式：https://raw.githubusercontent.com/你的帳號/repo/main/live2d/yourmodel.model3.json
        const LIVE2D_MODEL_URL = 'https://raw.githubusercontent.com/你的帳號/repo/main/live2d/yourmodel.model3.json';
        const CORS_PROXY = 'https://corsproxy.io/?url=';

        async function loadLive2DModel() {
            const badge = document.getElementById('demoStatusBadge');
            const placeholder = document.getElementById('live2dPlaceholder');
            const canvasEl = document.getElementById('live2dCanvas');
            { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; badge.textContent = _d.badge_loading||'載入中…'; badge.className = 'text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full'; }

            // Dynamically load pixi + live2d-display
            if (!window.PIXI) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.5.10/browser/pixi.min.js');
            }
            if (!window.Live2DModel) {
                await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js');
                if (window.PIXI && window.Live2DModel) {
                    window.Live2DModel.registerTicker(PIXI.Ticker);
                }
            }

            // Try direct URL first, then CORS proxy
            const urlsToTry = [
                LIVE2D_MODEL_URL,
                CORS_PROXY + encodeURIComponent(LIVE2D_MODEL_URL)
            ];

            try {
                const wrapper = document.getElementById('live2dWrapper');
                const w = wrapper.clientWidth, h = wrapper.clientHeight;

                if (live2dApp) { live2dApp.destroy(true); live2dApp = null; }

                live2dApp = new PIXI.Application({ width: w, height: h, backgroundAlpha: 0, view: canvasEl, antialias: true });
                canvasEl.style.display = 'block';
                placeholder.style.display = 'none';

                let loadedModel = null;
                for (const url of urlsToTry) {
                    try {
                        loadedModel = await window.Live2DModel.from(url, { autoHitTest: true, autoFocus: true });
                        break;
                    } catch(e) { continue; }
                }
                if (!loadedModel) throw new Error('All URLs failed');
                live2dModel = loadedModel;

                live2dApp.stage.addChild(live2dModel);

                // Scale to fit
                const scale = Math.min(w / live2dModel.internalModel.originalWidth, h / live2dModel.internalModel.originalHeight) * 0.85;
                live2dModel.scale.set(scale);
                live2dModel.x = w / 2 - (live2dModel.internalModel.originalWidth * scale) / 2;
                live2dModel.y = h / 2 - (live2dModel.internalModel.originalHeight * scale) / 2;

                // Mouse eye tracking
                wrapper.addEventListener('mousemove', e => {
                    if (!live2dModel) return;
                    const rect = wrapper.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                    const sens = demoParams.eye;
                    live2dModel.focus(rect.left + (x * sens + 1) * rect.width / 2, rect.top + (y * sens + 1) * rect.height / 2);
                });

                // Touch support for mobile
                wrapper.addEventListener('touchmove', e => {
                    if (!live2dModel) return;
                    const touch = e.touches[0];
                    const rect = wrapper.getBoundingClientRect();
                    live2dModel.focus(touch.clientX, touch.clientY);
                }, { passive: true });

                // Click to trigger motion
                live2dModel.on('hit', areas => {
                    const headAreas = ['Head','head','Face','face','Hair','hair'];
                    if (areas.some(a => headAreas.includes(a))) {
                        live2dModel.motion('FlickHead');
                    } else {
                        live2dModel.motion('TapBody');
                    }
                });

                { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; badge.textContent = _d.badge_loaded||'✓ 已載入'; badge.className = 'text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full'; }
            } catch(e) {
                { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; badge.textContent = _d.badge_fail||'載入失敗'; badge.className = 'text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full'; }
                placeholder.style.display = 'flex';
                canvasEl.style.display = 'none';
                console.error('Live2D load error:', e);
            }
        }

        function loadScript(src) {
            return new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = src; s.onload = res; s.onerror = rej;
                document.head.appendChild(s);
            });
        }

        function triggerMotion(name) {
            if (!live2dModel) { alert('請先載入模型！'); return; }
            try { live2dModel.motion(name); } catch(e) {
}
        }

        function updateParam(type, val) {
            const pct = Math.round(val);
            demoParams[type] = pct / 100;
            if (type === 'eye') document.getElementById('eyeVal').textContent = pct + '%';
            if (type === 'body') document.getElementById('bodyVal').textContent = pct + '%';
            if (type === 'exp') document.getElementById('expVal').textContent = pct + '%';
            if (type === 'breath') document.getElementById('breathVal').textContent = pct + '%';

            if (live2dModel) {
                try {
                    if (type === 'body') live2dModel.internalModel?.motionManager?.groups?.idle && (live2dModel.internalModel.motionManager.preferredFrameRate = 30 + Math.round(demoParams.body * 30));
                } catch(e) {}
            }
        }

        function toggleSwitch(type, val) {
            demoParams[type] = val;
            if (!live2dModel) return;
            try {
                if (type === 'blink') live2dModel.internalModel.eyeBlink && (live2dModel.internalModel.eyeBlink.enabled = val);
                if (type === 'lip') live2dModel.internalModel.lipSync && (live2dModel.internalModel.lipSync.enabled = val);
            } catch(e) {}
        }

        // ---- Intro avatar sound ----
        function playIntroSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

        // ---- Bonk 音效 ----
        function playBonk() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

        // ================================================================
        // 🔧 表單 URL 集中設定區 — 只需在這裡更改，全站自動套用
        // ================================================================
        const FORM_URLS = {
            // 個人委託（VP 模型建模）
            commission_vp:   'https://forms.gle/4C5KzcuAiEAndyMf6',
            // 個人委託（動態貼圖）— 若與 VP 共用同一份表單請填相同網址
            commission_anim: 'https://forms.gle/4C5KzcuAiEAndyMf6',
            // 合作繪師申請
            artists:         'https://forms.gle/a75ybdYE3jNdeGUn9',
            // 二創作品投稿
            fanart:          'https://forms.gle/FTnW6fVrQpXQhqrN6',

            // 英文 / 日文版（若有另外製作多語言表單，填入對應網址；若無則沿用上方連結）
            commission_vp_en:   '',   // 留空 = 自動 fallback 到 commission_vp
            commission_anim_en: '',
            artists_en:         '',
            fanart_en:          '',
        };

        /**
         * 依目前語言取得對應表單 URL，無多語言版本時自動 fallback 中文版
         * @param {'commission_vp'|'commission_anim'|'artists'|'fanart'} key
         */
        function getFormUrl(key) {
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
            const suffix = (lang === 'en' || lang === 'ja') ? '_en' : '';
            const url = FORM_URLS[key + suffix];
            return (url && url.trim() !== '') ? url : FORM_URLS[key] || '#';
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
        const IS_COMMISSION_OPEN = true;
        (function() {
            const badge = document.getElementById('commissionBadge');
            if (!badge) return;
            if (IS_COMMISSION_OPEN) {
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
        // Twitch Helix API 需要 Client-ID + OAuth Token，瀏覽器端直接呼叫會被 CORS 擋住。
        // 這裡使用 free proxy workaround via twitch-status.vercel.app (若失效請改用後端方案)
        // 每次載入時嘗試查詢，失敗則靜默保持「離線」顯示，不影響其他功能。
        const TWITCH_CHANNELS = ['bunny0422', 'yazawaribii', 'shinyuki2511', 'yukina_nya_026', 'darkmeyaya'];

        async function checkTwitchLive(channel) {
            try {
                // 使用 decapi.me 的免費 Twitch 狀態查詢
                const res = await fetch(`https://decapi.me/twitch/uptime/${channel}`, { signal: AbortSignal.timeout(4000) });
                const text = await res.text();
                // decapi returns uptime string if live, or error message if offline
                const isLive = !text.includes('offline') && !text.includes('error') && text.trim().length > 0;
                updateChannelBadge(channel, isLive);
            } catch(e) {
                // silently fail - stays "離線"
            }
        }

        function updateChannelBadge(channel, isLive) {
            // 更新按鈕內的 .btn-status
            const statusEl = document.getElementById(`live-${channel}`);
            if (!statusEl) return;
            const _ll = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].ch_live:'直播中';
            const _ol = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].ch_offline:'離線';
            if (isLive) {
                statusEl.className = 'btn-status online';
                statusEl.innerHTML = `<span class="status-dot"></span>${_ll}`;
            } else {
                statusEl.className = 'btn-status offline';
                statusEl.innerHTML = `<span class="status-dot"></span>${_ol}`;
            }
        }

        // YouTube 直播狀態（利用 oEmbed 間接偵測）
        const YOUTUBE_CHANNELS = [
            { id: 'yt-live-MurichanChannel', handle: 'MurichanChannel' },
            { id: 'yt-live-darkmeyaya',      handle: 'darkmeyaya' }
        ];

        async function checkYoutubeLive(entry) {
            const badge = document.getElementById(entry.id);
            if (!badge) return;
            const _ll = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].ch_live:'直播中';
            const _ol = (typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].ch_offline:'離線';
            try {
                // YouTube oEmbed 可判斷頻道是否存在，但無法直接取得直播狀態
                // 使用 yt.lemnoslife.com 免費 no-key API 查詢 isLive
                const url = `https://yt.lemnoslife.com/noKey/search?part=snippet&q=${encodeURIComponent(entry.handle)}&type=video&eventType=live`;
                const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
                const data = await res.json();
                const isLive = data.items && data.items.length > 0;
                if (isLive) {
                    badge.className = 'btn-status online';
                    badge.innerHTML = `<span class="status-dot"></span>${_ll}`;
                } else {
                    badge.className = 'btn-status offline';
                    badge.innerHTML = `<span class="status-dot"></span>${_ol}`;
                }
            } catch(e) {
                badge.className = 'btn-status offline';
                badge.innerHTML = `<span class="status-dot"></span>${_ol}`;
            }
        }

        function checkAllChannels() {
            TWITCH_CHANNELS.forEach(ch => checkTwitchLive(ch));
            YOUTUBE_CHANNELS.forEach(ch => checkYoutubeLive(ch));
        }

        // ── GIF 閃爍修復：視窗重新獲得焦點時同步 GPU 幀快取 ──
        // 原因：Chromium 在 Window Blur 時可能釋放 compositing layer 快取，
        // 此處強制微小的 GPU 層更新，讓 GIF 解碼狀態得以續接而非重置。
        window.addEventListener('focus', () => {
            const portfolioPage = document.getElementById('page-portfolio');
            if (portfolioPage && !portfolioPage.classList.contains('gif-hidden')) {
                portfolioPage.style.transform = 'translateZ(0)';
            }
        });

        window.onload = () => {
            function _safe(fn){ try { if (typeof fn === 'function') fn(); } catch(e) { console.warn('[init]', e); } }
            var _firstPage = document.querySelector('.page-content');
            if (_firstPage) { _safe(function(){ switchTab(_firstPage.id.replace('page-','')); }); }
            _safe(calculate);
            _safe(calculateAnim);
            _safe(updateAnimFields);
            _safe(bindCheckboxSync);
            _safe(syncCheckboxVisuals);
            _safe(setLiveStatus);

            // ── 直播狀態查詢：錯開發送，避免同時佔滿瀏覽器並發連線配額 ──
            // checkMyLiveStatus 只在這裡呼叫一次（移除了頁面頂層的重複呼叫）
            setTimeout(() => checkMyLiveStatus(), 0);
            // 各外部頻道每隔 350ms 依序發出，共 9 個請求不再同時競搶
            const allChannelChecks = [
                ...TWITCH_CHANNELS.map(ch => () => checkTwitchLive(ch)),
                ...YOUTUBE_CHANNELS.map(ch => () => checkYoutubeLive(ch)),
            ];
            allChannelChecks.forEach((fn, i) => setTimeout(fn, 800 + i * 350));

            // Re-check every 3 minutes while page is open
            setInterval(checkMyLiveStatus, 3 * 60 * 1000);
        };
		
        const FANART_API = 'https://api.github.com/repos/n47993802-sketch/Live2D-/contents/HakkaNeko/Second%20creation%20drawing';
        const FANART_RAW  = 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/Second%20creation%20drawing/';
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

                // 填入統一燈箱的 fanart 群組
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
            } catch(e) {
                const isRateLimit = e.message.includes('Rate limit') || e.message.includes('rate limit') || e.message.includes('API rate limit exceeded');
                grid.innerHTML = `<div class="col-span-full glass-panel p-8 text-center border border-dashed border-pink-500/20">
                    <i class="fa-brands fa-github text-3xl text-purple-400/40 mb-3 block"></i>
                    <p class="text-purple-300/60 text-sm font-bold mb-2">${isRateLimit ? ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].github_rate_short||'GitHub 請求次數已達上限':'GitHub 請求次數已達上限') : ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].badge_fail||'載入失敗':'載入失敗')}</p>
                    <p class="text-xs text-purple-400/40 mb-4">${isRateLimit ? ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].github_rate_tip||'每小時最多 60 次請求，請稍後再重試。':'每小時最多 60 次請求，請稍後再重試。') : ((typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang].error_prefix||'錯誤：':'錯誤：') + e.message}</p>
                    <button onclick="fanartLoaded=false;document.getElementById('fanartGrid').innerHTML='<div class=\'col-span-full glass-panel p-8 text-center\'><i class=\'fa-solid fa-spinner fa-spin text-purple-400 text-2xl mb-3 block\'></i><p class=\'text-purple-200/60 text-sm\'>重新載入中⋯</p></div>';loadFanart();"
                        class="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 text-xs font-bold rounded-xl border border-purple-500/30 transition-all">
                        <i class="fa-solid fa-rotate-right mr-1"></i> 重新載入
                    </button>
                </div>`;
            }
        }

        // ==================== 動態貼圖 / Logo GIF 展示 ====================
        // 零閃爍核心原則：
        //   1. 所有 <img> 在 gifBuildAll() 時一次建好，src 只設一次，之後絕不修改
        //   2. 切換分頁只改 card.style.display（'none' / ''）
        //   3. 無任何 opacity/visibility transition 作用在 GIF 的父層上
        //   4. 每個 img 用 transform:translateZ(0) 放入獨立 GPU compositing layer

        const GIF_DATA = {
            stickers: [
                { src: 'https://drive.google.com/file/d/1QTFcN7bVfYEKJcBu29ZiB7Voi8aVA6EW/view?usp=drive_link',  label: '殘光不在',        sub: '繪師：殘光',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/815418_750290.gif',  label: '紅妻戰鬥姿態',    sub: '繪師：紅妻',    tags: ['動態貼圖', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/240931_341304.gif',  label: '搖晃的莉比',      sub: '繪師：莉比Ribi', tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/411719_225934.gif',  label: '羊毛團搖晃',      sub: '繪師：紅妻',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/73214_46903.gif',   label: '生日快樂！楷KAI', sub: '繪師：馬恩斯',  tags: ['動態貼圖', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/798671_652807.gif',  label: '金穗偷看',        sub: '繪師：曉緋',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/80740_176251.gif',   label: '潔諾搖晃',        sub: '繪師：潔諾',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicStickers/399928_890637.gif',  label: '阿卡貓奔跑',      sub: '繪師：赤兔芽',  tags: ['動態貼圖', '含特效動畫 +NT$250'] },
            ],
            logos: [
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/725598_179142.gif',  label: '阿卡貓用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/842497_993032.gif',  label: '花咲小春用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/506386_489301.gif',  label: '祤兒用 Logo',     sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/499991_926064.gif',  label: '緋奈用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/332415_991716.gif',  label: '嘎冰用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/182500_354262.gif',  label: '姆莉醬用 Logo',   sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/108371_241418.gif',  label: '音羽米奈用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/DynamicLogo/SnowCatLogo.gif',    label: '雪奈喵用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
            ]
        };
        const GIF_PER_PAGE = 4;
        const gifPage = { stickers: 0, logos: 0 };

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
            if (!document.getElementById('page-rules')) { window.location.href = 'rules.html'; return; }
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

        // ==================== v29 patch：儲存 VP 計算機詳細資料供複製功能使用 ====================
        // 漏洞背景：若未來引入 Swiper.js 輪播組件，重複呼叫 new Swiper() 而不銷毀舊實例
        // 會導致 DOM 監聽器常駐記憶體，頻繁切換時越滑越卡。
        // 此全域管理器確保每個容器 ID 同時只存在一個 Swiper 實例。
        var portfolioSwipers = {};
        function initPortfolioSwiper(containerId, config) {
            // 💡 核心漏洞修復：若該區塊已有 Swiper 實例，先進行銷毀，釋放 DOM 監聽器與記憶體
            if (portfolioSwipers[containerId]) {
                try {
                    portfolioSwipers[containerId].destroy(true, true);
                } catch(e) { /* 容錯：實例可能已在外部被銷毀 */ }
                portfolioSwipers[containerId] = null;
            }
            // 重新初始化並存入全域追蹤（Swiper 未載入時不執行，避免 ReferenceError）
            if (typeof Swiper !== 'undefined') {
                portfolioSwipers[containerId] = new Swiper(containerId, config);
            }
            return portfolioSwipers[containerId] || null;
        }
        // 頁面卸載時統一銷毀所有 Swiper 實例，防止瀏覽器標籤頁切換後記憶體殘留
        window.addEventListener('beforeunload', function() {
            Object.keys(portfolioSwipers).forEach(function(id) {
                if (portfolioSwipers[id]) {
                    try { portfolioSwipers[id].destroy(true, true); } catch(e) {}
                }
            });
        });

        // ==================== v28 效能：GIF IntersectionObserver 視窗外凍結 ====================
        // 當 GIF 卡片離開視窗時，清除 img.src（暫停 GIF 解碼佔用記憶體）
        // 重新進入視窗時，復原 src 並顯示骨架屏直到載入完畢
        // v30 修正：停用 GIF src 清除邏輯（會導致 GIF 在滾動時變空白）
        // 改為僅保留骨架屏顯示，不清空 src
        function initGifFreezeObserver() {
            // 已停用：src 凍結會導致視窗外的 GIF 重新進入時短暫空白
            // 直接使用 img.src + loading="lazy" 搭配 GPU layer 即可
        }

        // 一次性建立所有卡片 DOM，img.src 只設一次
        function gifBuildAll() {
            // v27：初始化 IntersectionObserver
            initGifFreezeObserver();

            ['stickers', 'logos'].forEach(function(key) {
                var grid  = document.getElementById('gif-grid-' + key);
                if (!grid || grid.children.length > 0) return; // 已建立則跳過
                var items = GIF_DATA[key];
                var isS   = key === 'stickers';
                var borderActive = isS ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)';
                var badgeBg = isS ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)';

                items.forEach(function(item, idx) {
                    var card = document.createElement('div');
                    card.style.cssText = [
                        'background:#0f0720',
                        'border:1px solid rgba(255,255,255,0.07)',
                        'border-radius:1rem',
                        'overflow:hidden',
                        'cursor:default',
                        'transition:border-color .25s,box-shadow .25s',
                    ].join(';');
                    card.onmouseenter = function() {
                        this.style.borderColor = borderActive;
                        this.style.boxShadow = '0 0 16px ' + (isS ? 'rgba(52,211,153,.12)' : 'rgba(251,191,36,.12)');
                    };
                    card.onmouseleave = function() {
                        this.style.borderColor = 'rgba(255,255,255,0.07)';
                        this.style.boxShadow = '';
                    };
                    // v28 燈箱回歸：點擊 GIF 卡片開啟純覆蓋燈箱（不含導覽點與箭頭）
                    card.style.cursor = 'pointer';
                    (function(captureKey, captureIdx) {
                        card.onclick = function() { ulbOpen(captureKey, captureIdx); };
                    })(key, idx);

                    // ── v27 骨架屏容器 ──
                    // 加入 gif-skeleton class 顯示微光，載入完成後移除
                    var wrap = document.createElement('div');
                    wrap.style.cssText = 'width:100%;aspect-ratio:1;background:#0c0618;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;';
                    wrap.classList.add('gif-skeleton'); // 初始顯示骨架屏

                    var img = document.createElement('img');
                    img.alt = item.label;
                    // v27：改用 loading="lazy"（原本是 eager）
                    img.loading = 'lazy';
                    // v27：新增 gif-img-fade class，初始透明，載入後淡入
                    img.className = 'gif-img-fade';
                    // 獨立 GPU layer：防止外層 scroll/repaint 干擾 GIF 解碼時序
                    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;transform:translateZ(0);-webkit-transform:translateZ(0);position:relative;z-index:1;';
                    img.onerror = function() {
                        this.style.display = 'none';
                        var p = this.parentElement;
                        if (p) {
                            p.classList.remove('gif-skeleton');
                            p.innerHTML += '<i class="fa-solid fa-image" style="font-size:2rem;color:rgba(168,85,247,.25);position:absolute;"></i>';
                        }
                    };
                    // v27：載入完成 → 移除骨架屏 + 淡入顯示
                    img.onload = function() {
                        this.classList.add('loaded');
                        var p = this.parentElement;
                        if (p) p.classList.remove('gif-skeleton');
                    };
                    // v33 修正：本頁作品展示以前一次會把「所有」貼圖/Logo 的 <img src>
                    // 都設定好（即使當下分頁只顯示 GIF_PER_PAGE 張），導致一進頁面就
                    // 同時對 GitHub 發出 stickers+logos 全部張數的圖片請求，
                    // 這也是這個頁面明顯比其他頁面慢一步「還在補圖」的主因。
                    // 現在改成：只有「目前分頁」內的圖片會立刻設定 src 開始下載，
                    // 其餘分頁的圖片先存進 data-src，等使用者真的翻到那一頁
                    // （gifRenderPage 內）才臨時補上 src，網路請求量從一次全部
                    // 變成跟其他頁面一樣「每次只載入看得到的量」。
                    if (idx < GIF_PER_PAGE) {
                        img.src = item.src;
                        img.dataset.loaded = '1';
                    } else {
                        img.dataset.src = item.src;
                    }

                    wrap.appendChild(img);

                    // 文字標籤
                    var info = document.createElement('div');
                    info.style.cssText = 'padding:.55rem .7rem .65rem;text-align:center;';
                    var labelEl = document.createElement('p');
                    labelEl.textContent = item.label;
                    labelEl.style.cssText = 'font-size:.72rem;font-weight:700;color:#e9d5ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:' + badgeBg + ';border-radius:.4rem;padding:.15rem .45rem;text-align:center;';
                    info.appendChild(labelEl);
                    if (item.sub) {
                        var subEl = document.createElement('p');
                        subEl.textContent = item.sub;
                        subEl.style.cssText = 'font-size:.62rem;color:rgba(196,167,255,.45);margin-top:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;';
                        info.appendChild(subEl);
                    }
                    // v30：移除「作品規格」標籤區塊，僅保留作品名稱與繪師資訊

                    card.appendChild(wrap);
                    card.appendChild(info);
                    grid.appendChild(card);
                });

                // 初次顯示第 0 頁
                gifRenderPage(key);
            });
        }

        // 只改 display，絕不碰 img.src
        function gifRenderPage(key) {
            var grid    = document.getElementById('gif-grid-' + key);
            var dotsEl  = document.getElementById('gif-dots-' + key);
            if (!grid) return;
            var cards   = grid.children;
            var total   = GIF_DATA[key].length;
            var pages   = Math.ceil(total / GIF_PER_PAGE);
            var page    = gifPage[key];
            var start   = page * GIF_PER_PAGE;
            var end     = start + GIF_PER_PAGE;
            var isS     = key === 'stickers';
            var dotActive = isS ? '#34d399' : '#fbbf24';

            for (var i = 0; i < cards.length; i++) {
                var isVisible = (i >= start && i < end);
                cards[i].style.display = isVisible ? '' : 'none';
                // v33：翻頁翻到這一頁時才補上還沒載入的圖片 src（見 gifBuildAll 的說明）
                if (isVisible) {
                    var lazyImg = cards[i].querySelector('img');
                    if (lazyImg && !lazyImg.dataset.loaded && lazyImg.dataset.src) {
                        lazyImg.src = lazyImg.dataset.src;
                        lazyImg.dataset.loaded = '1';
                    }
                }
            }

            // 圓點分頁
            dotsEl.innerHTML = '';
            for (var p = 0; p < pages; p++) {
                (function(pi) {
                    var dot = document.createElement('span');
                    dot.style.cssText = 'display:inline-block;width:8px;height:8px;border-radius:50%;cursor:pointer;transition:background .2s,transform .2s;background:' +
                        (pi === page ? dotActive : 'rgba(255,255,255,.2)') + ';' +
                        (pi === page ? 'transform:scale(1.3);' : '');
                    dot.onclick = function() { gifPage[key] = pi; gifRenderPage(key); };
                    dotsEl.appendChild(dot);
                })(p);
            }
        }

        function gifNav(key, dir) {
            var pages = Math.ceil(GIF_DATA[key].length / GIF_PER_PAGE);
            var next  = gifPage[key] + dir;
            if (next < 0 || next >= pages) return;
            gifPage[key] = next;
            gifRenderPage(key);
        }

        // GIF 立即初始化：page-portfolio 從頁面載入就在 DOM 中渲染（gif-hidden 只用 visibility 隱藏）
        // 提早建立 img 讓 GIF 開始解碼，切換到 portfolio 時已在持續播放，不會閃爍
        var _gifBuilt = false;
        function gifEnsureInit() {
            if (_gifBuilt) return;
            _gifBuilt = true;
            gifBuildAll();
        }
        // 頁面 DOMContentLoaded 後立刻 init，使 GIF 在背景持續解碼
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { gifEnsureInit(); });
        } else {
            gifEnsureInit();
        }

        // ==================== 回到頂部 (v28 rAF 節流) ====================
        // 原本的 scroll listener 每幀觸發 60-120 次，改用 requestAnimationFrame 節流
        // 確保每個顯示幀最多執行一次，完全消除高頻率 DOM 操作造成的掉幀。
        const backToTopBtn = document.getElementById('backToTop');
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
            const io = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        e.target.style.transitionDelay = '0s'; // 出現後清掉 delay
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

            function attachReveal(page) {
                // .no-reveal 標記的元素（如 carousel card）跳過，避免 GIF 二次閃爍
                const els = page.querySelectorAll('.glass-panel:not(.no-reveal), .faq-item');
                els.forEach((el, i) => {
                    if (el.classList.contains('reveal')) return;
                    el.classList.add('reveal');
                    // delay 以本頁 index 計算，最多 0.18s，避免後面的元素等太久
                    el.style.transitionDelay = Math.min(i * 0.035, 0.18) + 's';
                    io.observe(el);
                });
            }

            // 初始頁面（page-intro 是唯一可見的）
            const introPage = document.getElementById('page-intro');
            if (introPage) attachReveal(introPage);

            const _origSwitch = window.switchTab;
            window.switchTab = function(tabId) {
                _origSwitch && _origSwitch(tabId);
                if (tabId === 'portfolio') {
                    return;
                }
                const page = document.getElementById('page-' + tabId);
                if (!page) return;

                const els = page.querySelectorAll('.glass-panel:not(.no-reveal), .faq-item');

                // ── v32 修復：切回已展示過的分頁（如自我介紹）時，
                //    元素已有 .reveal 但 IntersectionObserver 早已 unobserve，
                //    不會再次觸發，導致永遠 opacity:0（全白）。
                //    解法：對已有 .reveal 但尚未 .visible 的元素直接補上 .visible；
                //    對完全未初始化（無 .reveal）的元素走原本 attachReveal 流程。 ──
                let newIdx = 0;
                els.forEach(el => {
                    if (el.classList.contains('reveal') && !el.classList.contains('visible')) {
                        // 已標記但未顯示 → 立即顯示（stagger delay 保留）
                        el.style.transitionDelay = Math.min(newIdx * 0.035, 0.18) + 's';
                        requestAnimationFrame(() => el.classList.add('visible'));
                        newIdx++;
                    } else if (!el.classList.contains('reveal')) {
                        // 從未初始化 → 走 attachReveal
                        el.style.transitionDelay = Math.min(newIdx * 0.035, 0.18) + 's';
                        newIdx++;
                    }
                });

                // 仍需 attachReveal 處理未曾 observe 的新元素
                const hasUninitialized = Array.from(els).some(el => !el.classList.contains('reveal'));
                if (hasUninitialized) {
                    requestAnimationFrame(() => attachReveal(page));
                }
            };
        })();

        // ==================== v27 效能：Debounce 工具函數 ====================
        /**
         * debounce(fn, delay)
         * 在 delay ms 內若再次呼叫，重設計時器，確保連續點擊只觸發一次。
         * 對計算機選項的快速切換可消除微卡頓。
         */
        function debounce(fn, delay) {
            var timer = null;
            return function() {
                var ctx = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
            };
        }

        // ==================== 金額滾動數字動畫 ====================
        (function() {
            function animateCounter(el, from, to) {
                const diff = to - from;
                const duration = Math.min(Math.abs(diff) / 30 + 200, 550);
                const startTime = performance.now();
                let rafId;
                function step(now) {
                    const t = Math.min((now - startTime) / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    el.textContent = getCurrencyPrefix() + Math.round(from + diff * ease).toLocaleString();
                    if (t < 1) { rafId = requestAnimationFrame(step); }
                    else el.textContent = getCurrencyPrefix() + to.toLocaleString();
                }
                if (el._rafId) cancelAnimationFrame(el._rafId);
                el._rafId = requestAnimationFrame(step);
            }

            // patch：先記舊值，呼叫原始函數後再動畫
            const _origCalc = window.calculate;
            // v27 Debounce：50ms 防抖，消除連續點擊的微卡頓
            const _debouncedCalc = debounce(function() {
                const el = document.getElementById('totalPrice');
                if (el) el.dataset.animFrom = el.textContent.replace(/[^0-9]/g, '') || '0';
                _origCalc && _origCalc();
                if (!el) return;
                const from = parseInt(el.dataset.animFrom || '0');
                const to   = parseInt(el.textContent.replace(/[^0-9]/g, '') || '0');
                if (from !== to) animateCounter(el, from, to);
            }, 60);
            window.calculate = function() {
                // 先同步跑一次（讓 DOM 數字立即更新），再 debounce 動畫渲染
                const el = document.getElementById('totalPrice');
                if (el) el.dataset.animFrom = el.textContent.replace(/[^0-9]/g, '') || '0';
                _origCalc && _origCalc();
                if (!el) return;
                const from = parseInt(el.dataset.animFrom || '0');
                const to   = parseInt(el.textContent.replace(/[^0-9]/g, '') || '0');
                if (from !== to) _debouncedCalc();
            };

            const _origAnimCalc = window.calculateAnim;
            const _debouncedAnimCalc = debounce(function() {
                const el = document.getElementById('animTotalPrice');
                if (el) el.dataset.animFrom = el.textContent.replace(/[^0-9]/g, '') || '0';
                _origAnimCalc && _origAnimCalc();
                if (!el) return;
                const from = parseInt(el.dataset.animFrom || '0');
                const to   = parseInt(el.textContent.replace(/[^0-9]/g, '') || '0');
                if (from !== to) animateCounter(el, from, to);
            }, 60);
            window.calculateAnim = function() {
                const el = document.getElementById('animTotalPrice');
                if (el) el.dataset.animFrom = el.textContent.replace(/[^0-9]/g, '') || '0';
                _origAnimCalc && _origAnimCalc();
                if (!el) return;
                const from = parseInt(el.dataset.animFrom || '0');
                const to   = parseInt(el.textContent.replace(/[^0-9]/g, '') || '0');
                if (from !== to) _debouncedAnimCalc();
            };
        })();

        // switchTab 已在上方內建 fanart 支援 (else if tabId==='fanart') loadFanart()

/* ── 多國語言字典、頻道直播偵測、iframe高度自適應、Loader ── */
    // ==================== 多語言 i18n 系統 ====================
    // ==================== 多語言 i18n 系統 ====================
    // I18N 字典已拆分至 locales/*.js（zh-TW / zh-CN / en / ja），
    // 並在檔案最上方合併進 window.I18N。currentLang 也已移至檔案頂部宣告，
    // 避免『let 變數暫時性死區（TDZ）』造成的 ReferenceError。

    function setLang(lang) {
        if (!I18N[lang]) return;
        currentLang = lang;
        const dict = I18N[lang];

        // Update html lang attribute
        document.documentElement.lang = dict.htmlLang;

        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.textContent = dict[key];
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
            const isOpen = typeof IS_COMMISSION_OPEN !== 'undefined' ? IS_COMMISSION_OPEN : true;
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
    // 這樣即使 Google Sites iframe 中 CDN 資源被 CSP 擋住或超時，
    // Loader 仍能在 DOM 就緒後立刻正常完成動畫並套用語言。

    // ── v32 Google Sites iframe 高度自動自適應 ──
    // 使用 ResizeObserver 偵聽 document.body 尺寸變化（展開對照表等互動）
    // 自動向父層 postMessage 通知最新 scrollHeight，解決雙滾動條與底部裁切。
    (function() {
        function notifyParentHeight() {
            try {
                var h = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight
                );
                window.parent.postMessage({ type: 'iframeHeight', height: h }, '*');
            } catch(e) {}
        }

        // ResizeObserver 持續偵聽 body 尺寸變化
        if (typeof ResizeObserver !== 'undefined') {
            var _roDebounce = null;
            var ro = new ResizeObserver(function() {
                clearTimeout(_roDebounce);
                _roDebounce = setTimeout(notifyParentHeight, 80);
            });
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() { ro.observe(document.body); });
            } else {
                ro.observe(document.body);
            }
        }

        // 初始通知（頁面完全載入後）
        window.addEventListener('load', function() { setTimeout(notifyParentHeight, 300); });

        // 分頁切換後也通知（接在 reveal 的 switchTab 覆寫之後，補充一次高度回報）
        // 使用 DOMContentLoaded 確保在所有覆寫完成後才 patch，維持正確的覆寫鏈
        document.addEventListener('DOMContentLoaded', function() {
            var _stForResize = window.switchTab;
            window.switchTab = function(tabId) {
                if (typeof _stForResize === 'function') _stForResize(tabId);
                setTimeout(notifyParentHeight, 320);
            };
        });
    })();
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
                if (typeof setLang === 'function') setLang(targetLang);
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
                        if (typeof setLang === 'function') setLang(targetLang);
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
                if (typeof setLang === 'function') setLang(lang);
            } catch(e) {}
            loader.classList.add('fade-out');
            document.body.classList.remove('loading');
            setTimeout(function() { loader.style.display = 'none'; }, 650);
        }
    }, 3000);
