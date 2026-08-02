/* ============================================================
   阿卡貓 HakkaNeko 網站 — 聯名模板頁 互動邏輯
   ============================================================
   從 common.js 拆分出來，只有 template.html 會載入這個檔案。
   需要先載入 template-config.js（提供 window.TMPL_OUTFITS /
   window.TMPL_PRICE_ADD）。

   內容包含：衣裝展示區（分頁/GIF 輪播）、報價計算機、複製報價、
   送出委託表單前的檢查。衣裝的「資料」都不在這裡，只有「怎麼把
   資料畫出來、怎麼算錢」的邏輯，資料在 template-config.js。
   ============================================================ */
/* ── 聯名模板頁互動邏輯 ── */
    (function(){
        var PER_PAGE  = 8;   // 展示區每頁顯示數
        var gifPage   = 0;
        var selectedOutfits = new Set(); // 已勾選的衣裝索引
        var tmplQty = { hairBang:0, hairFull:0, acc:0, expr:0, chanyeQty:1 };
        var tmplCurrentModel = 'kanso'; // 'kanso' | 'chanye'
        var PRICE   = { hairBang:150, hairFull:300, acc:100, expr:100 };
        var _tmplFirstAmountRender = true; // v49：標記總金額是否還沒播過第一次入場動畫

        // ── GIF 展示區渲染 ──
        function renderGifGrid() {
            var grid = document.getElementById('tmplGifGrid');
            var dots = document.getElementById('tmplGifDots');
            if (!grid) return;
            var totalPages = Math.ceil(window.TMPL_OUTFITS.length / PER_PAGE);
            var start = gifPage * PER_PAGE;
            var slice = window.TMPL_OUTFITS.slice(start, start + PER_PAGE);

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
            var totalPages = Math.ceil(window.TMPL_OUTFITS.length / PER_PAGE);
            gifPage = (gifPage + dir + totalPages) % totalPages;
            renderGifGrid();
        };
        window.tmplGifGoPage = function(p) { gifPage = p; renderGifGrid(); };

        // ── Checkbox 卡片渲染 ──
        function renderCheckGrid() {
            var grid = document.getElementById('tmplOutfitCheckGrid');
            if (!grid) return;
            grid.innerHTML = window.TMPL_OUTFITS.map(function(o, idx) {
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
                outfitCost = 1000 + Math.max(0, count - 1) * window.TMPL_PRICE_ADD;
            }

            var total = outfitCost;
            var details = [];

            if (count >= 1) {
                // 衣裝名稱子列
                var selectedNames = Array.from(selectedOutfits).sort(function(a,b){return a-b;}).map(function(i){ return window.TMPL_OUTFITS[i].name; });
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
            // v48 修復（問題4：template.html 完全沒有動畫，只有文字的即時
            // 切換）：改成跟 core.html／anim.html 一樣，先讀舊值、算出新值，
            // 再用滾動數字動畫從舊值過渡到新值（tmplTotalPrice 元素本身只有
            // 純數字、不含「NT$」字樣，所以用自訂的 tmplAnimateAmount()，
            // 不能直接沿用 common.js 的 animateCounter()——那個函式的每一幀
            // 都會把 getCurrencyPrefix() 一起寫進 textContent，會讓「NT$」
            // 重複出現在數字前面）。
            var tp = document.getElementById('tmplTotalPrice');
            if (tp) {
                // v50：金額這時候已經算好了，骨架屏（.price-skeleton）的
                // 任務結束，立刻拿掉，換回真正的數字（邏輯跟 common.js 的
                // revealAmountOnLoad() 一致）。
                tp.classList.remove('price-skeleton');
                var _tpFrom = parseInt(tp.textContent.replace(/[^0-9]/g, '') || '0', 10);
                if (_tpFrom !== total) {
                    // v49 修復：只有「第一次」(頁面剛載入、從 0 開始數) 需要
                    // 等父層 #tmplQuoteSummaryPanel 真正淡入後才播放，避免
                    // 動畫在面板還透明時就默默播完；使用者互動後的後續變動，
                    // 面板早已可見，直接照常播放即可，不需要再等。
                    if (_tmplFirstAmountRender && typeof window.whenPanelVisible === 'function') {
                        _tmplFirstAmountRender = false;
                        window.whenPanelVisible(tp, function() { tmplAnimateAmount(tp, _tpFrom, total); });
                    } else {
                        tmplAnimateAmount(tp, _tpFrom, total);
                    }
                } else {
                    tp.textContent = fmt(total);
                }
            }

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

        // ── 總金額滾動數字動畫（template.html 專用版本） ──
        // 邏輯跟 common.js 的 animateCounter() 一樣（ease-out 三次方緩動），
        // 但輸出格式只有純數字（fmt()，不含「NT$」前綴），因為 tmplTotalPrice
        // 元素本身只放數字，「NT$」字樣是寫在 HTML 裡、在這個 <span> 外面的
        // 固定文字（見 template.html：'NT$ <span id="tmplTotalPrice">0</span>'）。
        // 動畫結束後一樣呼叫 common.js 的 flashAmount()，讓變動的視覺回饋
        // （閃光脈衝）跟 core.html／anim.html 完全一致。
        function tmplAnimateAmount(el, from, to) {
            var diff = to - from;
            var duration = Math.min(Math.abs(diff) / 30 + 200, 550);
            var startTime = performance.now();
            function step(now) {
                var t = Math.min((now - startTime) / duration, 1);
                var ease = 1 - Math.pow(1 - t, 3);
                el.textContent = fmt(Math.round(from + diff * ease));
                if (t < 1) { el._tmplRafId = requestAnimationFrame(step); }
                else el.textContent = fmt(to);
            }
            if (el._tmplRafId) cancelAnimationFrame(el._tmplRafId);
            el._tmplRafId = requestAnimationFrame(step);
            if (typeof flashAmount === 'function') flashAmount(el, 'fuchsia');
        }

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
            var selectedNames = Array.from(selectedOutfits).sort(function(a,b){return a-b;}).map(function(i){ return window.TMPL_OUTFITS[i].name; });
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

        // ── v48 修復（嚴重錯誤：服裝展示框／GIF輪播／價格面板在頁面載入時
        // 完全沒有初始化，一直保持空白直到使用者手動互動）──
        // 成因：這裡原本「唯一」會呼叫 renderCheckGrid()／renderGifGrid()／
        // renderChanyeGifGrid()／tmplCalculate() 的地方，是攔截後的
        // window.switchTab，而攔截本身要等這支腳本自己的 DOMContentLoaded
        // 監聽器觸發才會裝上去。問題是 common.js 的 initPage() 也監聽了
        // DOMContentLoaded，而且它的監聽器比這支檔案早註冊（template.html
        // 裡 common.js 排在 template-render.js 之前載入）——同一個事件的
        // 多個監聽器會按註冊順序依序執行，所以 initPage() 會先跑，用「舊版、
        // 還沒被攔截」的 switchTab('template') 呼叫一次，那時候攔截根本
        // 還沒裝上去，等於這唯一的初始化呼叫點完全沒有真正執行到render
        // 函式；等這支腳本的監聽器終於裝上攔截時，已經沒有人會再呼叫
        // switchTab('template') 第二次了——三個區塊因此永遠停留在初始
        // 空白狀態，直到使用者手動點擊觸發同一批函式才會第一次畫出來。
        //
        // 修法：這支腳本本身是非 defer、非 async，且 <script> 標籤緊接在
        // 頁面所有內容之後才載入，代表它執行的當下，#tmplCheckGrid／
        // #tmplGifGrid／#tmplTotalPrice 等容器都已經確實存在於 DOM 中，
        // 不需要等待 DOMContentLoaded 才能安全操作它們。因此改成腳本一
        // 載入就立刻直接呼叫一次，不再依賴「攔截 switchTab 之後才觸發」
        // 這個有時序風險的間接路徑。攔截仍然保留（給日後若真的需要在
        // 執行期間再次呼叫 switchTab('template') 的情境使用），但不再是
        // 唯一的初始化入口。
        renderCheckGrid();
        renderGifGrid();
        renderChanyeGifGrid();
        tmplCalculate();

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
            // v45：初始化浮動報價提示條（見 common.js 的 initFloatingQuoteBar()）。
            // tmplTotalPrice 這個元素本身只有數字（「NT$」文字在外面），
            // 所以這裡多帶一個 'NT$ ' 前綴參數，讓浮動提示條顯示完整格式。
            if (typeof initFloatingQuoteBar === 'function') {
                initFloatingQuoteBar('tmplQuoteSummaryPanel', 'tmplTotalPrice', 'NT$ ');
            }
            // v47：啟用報價欄捲動跟隨效果（見 common.js 的 initScrollFollowPanel()）
            if (typeof initScrollFollowPanel === 'function') {
                initScrollFollowPanel('.sticky-summary', 'page-template');
            }
        });
    })();
