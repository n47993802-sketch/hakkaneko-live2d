/* ============================================================
   阿卡貓 HakkaNeko 網站共用 JS
   內含：分頁切換邏輯、多國語言(I18N)、報價計算機、燈箱、
   聯名範本互動、頻道直播狀態偵測、Loader、iframe自適應等
   由原本單頁 SPA 拆分而來，供 10 個獨立頁面共同引用
   ============================================================ */

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
        (function() {
            const canvas = document.getElementById('meteor-canvas');
            const ctx = canvas.getContext('2d');
            let meteors = [], stars = [], nebulae = [], orbs = [];
            let animId, isLight = false, t = 0;
            let _resizeTimer = null;

            // ── 裝置效能分級 ──
            // isMobile：觸控裝置 or 視窗寬度 ≤ 768px（含 Google Sites iframe 內的行動瀏覽器）
            const isMobile = (
                ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
                window.innerWidth <= 900
            ) || window.innerWidth <= 768;

            // 低效能模式設定（手機：星星減少、關閉星芒、關閉星雲、流星減少）
            const STAR_COUNT   = isMobile ? 40  : 100;   // 手機 40 顆，桌機 100 顆
            const MAX_METEORS  = isMobile ? 2   : 6;     // 手機最多 2 顆流星
            const ENABLE_BURST = !isMobile;               // 手機關閉星芒特效
            const ENABLE_NEBULA = !isMobile;              // 手機關閉星雲（省掉每幀 3 次 RadialGradient）

            // ── 幀率自動降級：連續幀時間超標 3 次就切換低效能模式 ──
            let _lastTs = 0, _slowFrames = 0, _degraded = false;

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                initStars(); initNebulae();
            }

            // ── debounce resize：視窗拖曳時最多每 300ms 重建一次 ──
            function resizeDebounced() {
                clearTimeout(_resizeTimer);
                _resizeTimer = setTimeout(resize, 300);
            }

            function initStars() {
                stars = Array.from({length: STAR_COUNT}, () => ({
                    x:   Math.random() * canvas.width,
                    y:   Math.random() * canvas.height,
                    r:   Math.random() * 1.4 + 0.2,
                    a:   Math.random() * 0.6 + 0.2,
                    tw:  Math.random() * Math.PI * 2,
                    spd: Math.random() * 0.022 + 0.006,
                    vx:  (Math.random() - 0.5) * 0.08,
                    vy:  (Math.random() - 0.5) * 0.05,
                }));
            }

            function initNebulae() {
                if (!ENABLE_NEBULA) { nebulae = []; return; }
                nebulae = [
                    {x: canvas.width * 0.15, y: canvas.height * 0.2, r: 220, color: 'rgba(168,85,247,', a: 0.04},
                    {x: canvas.width * 0.85, y: canvas.height * 0.15, r: 180, color: 'rgba(236,72,153,', a: 0.03},
                    {x: canvas.width * 0.5, y: canvas.height * 0.75, r: 260, color: 'rgba(99,102,241,', a: 0.035},
                ];
            }

            function spawnMeteor() {
                if (meteors.length >= MAX_METEORS) return;
                const colors = ['#e879f9','#a855f7','#818cf8','#67e8f9','#f472b6'];
                meteors.push({
                    x: Math.random() * canvas.width * 1.4 - canvas.width * 0.2,
                    y: -30,
                    len: Math.random() * 150 + 80,
                    speed: Math.random() * 5 + 4,
                    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
                    alpha: 1,
                    width: Math.random() * 1.8 + 0.4,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }

            function hexToRgba(hex, a) {
                const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                return `rgba(${r},${g},${b},${a})`;
            }

            function draw(ts) {
                // ── Page Visibility API：分頁不可見時跳過繪製 ──
                if (document.hidden) { animId = requestAnimationFrame(draw); return; }

                // ── 幀率監控：連續 3 幀 > 50ms（<20fps）自動進入降級模式 ──
                if (!_degraded && _lastTs > 0) {
                    const delta = ts - _lastTs;
                    if (delta > 50) {
                        _slowFrames++;
                        if (_slowFrames >= 3) {
                            _degraded = true;
                            // 降級：大幅減少星星數量
                            stars = stars.slice(0, Math.floor(stars.length * 0.4));
                            meteors = [];
                        }
                    } else {
                        _slowFrames = 0;
                    }
                }
                _lastTs = ts;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (isLight) { animId = requestAnimationFrame(draw); return; }
                t += 0.003;

                // Slow-pulsing nebula orbs（手機及降級模式下已為空陣列，跳過）
                nebulae.forEach(n => {
                    const pulse = 1 + 0.15 * Math.sin(t + n.r);
                    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * pulse);
                    grad.addColorStop(0, n.color + (n.a * 2) + ')');
                    grad.addColorStop(1, n.color + '0)');
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                });

                // ── 星星：逐顆渲染確保每顆獨立閃爍，加入緩慢漂移 ──
                stars.forEach(s => {
                    s.tw += s.spd;
                    s.x += s.vx;
                    s.y += s.vy;
                    if (s.x < -5) s.x = canvas.width  + 5;
                    if (s.x > canvas.width  + 5) s.x = -5;
                    if (s.y < -5) s.y = canvas.height + 5;
                    if (s.y > canvas.height + 5) s.y = -5;

                    const alpha = s.a * (0.4 + 0.6 * Math.sin(s.tw));

                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(220,200,255,${alpha.toFixed(3)})`;
                    ctx.fill();

                    // ── 星芒特效（手機及降級模式下關閉）──
                    if (ENABLE_BURST && !_degraded) {
                        if (alpha > 0.55 && s.burst === undefined && Math.random() < 0.002) {
                            s.burst = 1.0;
                        }
                        if (s.burst !== undefined) {
                            s.burst -= 0.04;
                            if (s.burst <= 0) {
                                s.burst = undefined;
                            } else {
                                const bAlpha = s.burst * 0.65;
                                const bLen   = s.r * (5 + s.burst * 9);
                                ctx.save();
                                ctx.strokeStyle = 'rgba(255,230,255,1)';
                                ctx.lineCap = 'round';
                                ctx.globalAlpha = bAlpha;
                                ctx.lineWidth = s.r * 0.55;
                                ctx.beginPath(); ctx.moveTo(s.x - bLen, s.y); ctx.lineTo(s.x + bLen, s.y); ctx.stroke();
                                ctx.beginPath(); ctx.moveTo(s.x, s.y - bLen); ctx.lineTo(s.x, s.y + bLen); ctx.stroke();
                                ctx.globalAlpha = bAlpha * 0.4;
                                ctx.lineWidth = s.r * 0.3;
                                const d = bLen * 0.5;
                                ctx.beginPath(); ctx.moveTo(s.x - d, s.y - d); ctx.lineTo(s.x + d, s.y + d); ctx.stroke();
                                ctx.beginPath(); ctx.moveTo(s.x + d, s.y - d); ctx.lineTo(s.x - d, s.y + d); ctx.stroke();
                                ctx.restore();
                            }
                        }
                    }
                });

                // Meteor spawn
                if (Math.random() < 0.015) spawnMeteor();

                // Draw meteors
                meteors = meteors.filter(m => m.alpha > 0.02);
                meteors.forEach(m => {
                    const dx = Math.cos(m.angle) * m.len;
                    const dy = Math.sin(m.angle) * m.len;
                    const grad = ctx.createLinearGradient(m.x, m.y, m.x - dx, m.y - dy);
                    grad.addColorStop(0, hexToRgba(m.color, m.alpha));
                    grad.addColorStop(0.3, hexToRgba(m.color, m.alpha * 0.5));
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath();
                    ctx.moveTo(m.x, m.y);
                    ctx.lineTo(m.x - dx, m.y - dy);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = m.width;
                    ctx.stroke();
                    // head glow
                    const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width * 4);
                    hg.addColorStop(0, hexToRgba(m.color, m.alpha));
                    hg.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath();
                    ctx.arc(m.x, m.y, m.width * 4, 0, Math.PI * 2);
                    ctx.fillStyle = hg;
                    ctx.fill();

                    m.x += Math.cos(m.angle) * m.speed;
                    m.y += Math.sin(m.angle) * m.speed;
                    m.alpha -= 0.01;
                });

                animId = requestAnimationFrame(draw);
            }

            window.setMeteorMode = function(light) { isLight = light; };
            window.addEventListener('resize', resizeDebounced);
            resize();
            animId = requestAnimationFrame(draw);
        })();



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
                    // v30 修正：直接設定 src，搭配 loading="lazy" 與 GPU 加速
                    // （移除 data-gif-src + IntersectionObserver 凍結邏輯，避免 gif-hidden 初始狀態時
                    //   Observer 永不觸發導致 src 始終為空的問題）
                    img.src = item.src;

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
                cards[i].style.display = (i >= start && i < end) ? '' : 'none';
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
    const I18N = {
        'zh-TW': {
            langFlag: 'tw', langCode: 'TW', htmlLang: 'zh-TW',
            // Header
            header_title: ' 的 Live2D 委託',
            header_sub: '透明專業流程 ✦ 夢想角色躍然而生',
            // Nav
            nav_intro: '自我介紹', nav_artists: '合作繪師',
            nav_commission: '委託資訊', nav_rules: '流程與規範',
            nav_core: 'V皮設計', nav_anim: '動畫設計',
            nav_template: '聯名模板',
            nav_creative: '創作空間', nav_portfolio: '作品展示',
            nav_channels: '推薦頻道', nav_fanart: '二創展示',
            // Intro
            intro_role: '個人接案建模師 · Live2D 導師',
            intro_bio: '自 2021 年起投入 Live2D 建模領域，不僅致力於商業委託，更在現實中擔任導師傳承技術。累計完成超過 1000 件委託，熱愛在 X 與同好交流、分享創作心得。憑藉對細節的極致追求與創意思維，我期待能與各類繪師攜手，賦予平面角色生動的靈魂。',
            intro_education: '學習經歷', intro_achievements: '特殊成就',
            intro_services_title: '提供的專業服務',
            svc_live2d: 'V皮設計', svc_live2d_desc: '提供 VTuber 模型製作，支援面部捕捉與滑鼠追蹤。',
            svc_anim: '動畫設計', svc_anim_desc: '動態 Logo、貼圖、PV 及遊戲 CG 動畫設計。',
            svc_consult: 'Live2D 顧問', svc_consult_desc: '諮詢協助、VTubeStudio 與 OBS 直播環境設定。',
            svc_project: '專案檔加購', svc_project_desc: '委託後可選擇買斷工程原始檔（不單單販售）。',
            collab_title: '專業繪師合作一條龍',
            collab_desc: '雖然我不直接從事繪畫，但我與多位優秀專業繪師長期配合，能為您提供從「角色設計」到「建模完成」的全方位服務。無論是簡單風格還是極致精細，皆能滿足您的需求。',
            collab_point1: '多樣化畫風選擇，量身打造', collab_point2: '溝通無礙，配合度高',
            collab_btn: '前往查看合作繪師',
            comm_open: '開放委託中', comm_closed: '委託暫停中',
            live_on: 'Twitch 直播中！', live_off: 'Twitch 未直播',
            // Artists
            artists_title: '合作繪師陣容',
            artists_subtitle: '與優秀的繪師們聯手，為您提供最優質的角色設計與美術支援。',
            artists_apply_label: '合作申請', artists_apply_btn: '申請加入合作繪師',
            artists_apply_notice: '此申請為建立合作繪師名單，並非受僱或工作邀約。阿卡貓將依風格與時程需求主動聯繫合適的繪師。',
            form_email: '您的 Google 信箱', form_note: '角色說明 / 備注',
            // Rules
            rules_contact_title: '聯絡與排單詢問',
            rules_contact_desc: '委託時間需配合排單，建議先查看 Google 排單表或直接聯繫詢問檔期！',
            rules_schedule_btn: '排單狀態',
            rules_process_title: 'Live2D 委託流程',
            rules_terms_title: '委託規範與著作權聲明',
            rules_terms_notice: '注意：提交委託即視為已閱讀並同意以下全部條款。',
            rules_s1: '一、委託資格', rules_s2: '二、取消、終止與退款',
            rules_s3: '三、製作期程與授權', rules_s4: '四、使用授權與展示',
            rules_s5: '五、禁止行為與違約責任', rules_s6: '六、著作權保護聲明',
            rules_step1_title: '1. 填寫委託表單', rules_step1_desc: '填寫委託項目表單，提供您的委託需求與偏好，資訊越完整越能準確估價。',
            rules_step2_title: '2. 查看拆分情況', rules_step2_desc: '如能提供完整 PSD 拆件，將能更準確估價；若無，僅能給予參考估價。',
            rules_step3_title: '3. 討論細節內容', rules_step3_desc: '我將與您確認需求與細節，確保理解您的要求與期望。',
            rules_step4_title: '4. 支付頭款', rules_step4_desc: '確認委託後，需支付頭款以啟動專案。',
            rules_step5_title: '5. 建模確認階段', rules_step5_desc: '提供 3次 修改機會（失誤免費修正）。超過次數或大幅修改需額外收費。',
            rules_step6_title: '6. 支付尾款與交件', rules_step6_desc: '完成後支付尾款交付最終成品 (moc3 等)。如需工程檔需另行加購。',
            rules_s1_body: '委託者須年滿 18 歲。若提供不實年齡資訊而引發法律糾紛，一切責任由委託方承擔，本工作室不負任何連帶責任（本人以個人身份接案）。',
            rules_s2_li1: '委託方主動取消：已付定金不退還，並需補足當前製作進度費用。',
            rules_s2_li2: '修改確認階段三個工作日內未回覆，將主動再次聯繫；若連續五個工作日無任何回應，視為自動放棄委託。',
            rules_s2_li3: '若因本人不可抗力因素取消，將全額退款。',
            rules_s2_pause_label: '暫停 / 延期申請：',
            rules_s2_pause_body: '若因個人狀況暫時無法回覆，請事先透過 Email 或 X 私訊告知，可協議暫停製作進度，待確認後再繼續，不影響已付費用。',
            rules_s3_li1: '商業授權 — 所有報價已包含商業使用授權費用，無需額外支付。',
            rules_s3_li2: '交件時程 — 一般案件約 4–8 週完成，實際依專案複雜度與排單狀況調整。',
            rules_s3_li3: '排單等待 — 目前排單情況請查看頁面上方「排單狀態」連結，或直接聯繫詢問目前檔期。',
            rules_s3_li4: '原始檔保留 — 建模工程檔保留 4 個月，逾期須重新支付全額費用方可取件。',
            rules_s4_li1: '署名義務 — 公開使用時須標註：「Live2D 建模：阿卡貓 HakkaNeko」。',
            rules_s4_li2: '作品展示 — 本人保留將成品收錄至個人作品集及宣傳素材之權利（除非選購買斷方案）。',
            rules_s4_li3: '買斷條款 — 工程原始檔買斷以總金額 1.5 倍計算，禁止再轉讓或聲稱為自製。',
            rules_s5_intro: '以下行為一經發現，即終止所有授權並依法追訴：',
            rules_s5_li1: '將成品進行轉售、轉交、轉讓或提供第三方商業使用。',
            rules_s5_li2: '移除或偽造建模師署名資訊。', rules_s5_li3: '對成品進行未授權的二次修改後販售。',
            rules_s5_penalty: '違約者需支付原價 3 倍違約金，並承擔本人因此產生的相關法律費用。',
            rules_s6_intro: '本人（阿卡貓 HakkaNeko）以個人創作者身份提供服務，所有作品均受中華民國著作權法及 DMCA 相關規範保護。',
            rules_s6_li1: '侵權通報 — 發現任何平台有盜用、仿冒或未授權使用情形，本人將依 DMCA 程序向平台申請下架，並保留追訴之權利。',
            rules_s6_li2: '模型保護 — Live2D 工程檔為個人智慧財產，任何反編譯或未授權解包行為均屬侵權。',
            rules_s6_li3: '個人聲明 — 以上規範為個人委託條款，如有疑問歡迎直接聯繫溝通，本人保有最終解釋權。',
            rules_s6_footer: '※ 以上條款由創作者本人（阿卡貓 HakkaNeko）制定，不代表任何機構立場 ※',
            // FAQ
            faq_title: '常見問題 FAQ',
            faq_q1: '完成一件 Live2D 模型大概需要多久時間？', faq_a1: '依方案與當前排單情況而定，一般 Live2D 模型約需 4～8 週。動畫類委託視複雜度另計。建議先查看排單狀態表或直接詢問確切檔期。',
            faq_q2: '可以修改幾次？修改超過次數怎麼辦？', faq_a2: '建模確認階段提供 3 次修改機會，製作失誤免費修正不計次數。超過 3 次或屬於大幅度修改（如重新設計動態邏輯）需額外收費，費用依修改量洽談。',
            faq_q3: '沒有 PSD 拆件可以委託嗎？', faq_a3: '可以，但僅能提供參考估價，實際費用須等收到完整 PSD 拆件後才能確認。若插圖尚未拆件，也可詢問是否有配合的繪師協助拆件。',
            faq_q4: '可以委託廠商合作或實況組企劃嗎？', faq_a4: '歡迎廠商或實況組洽談，商業合作案請填寫委託項目表單，並在備注中說明合作性質與規模，我會優先安排回覆。',
            faq_q5: '付款方式有哪些？可以分期嗎？', faq_a5: '支援台灣銀行轉帳、PayPal（需加收手續費）及綠界金流。費用預設分頭款（50%）與尾款（50%）兩階段；亦可選擇兩期付款（加收 3%）或三期付款（加收 5%），詳見 V皮設計 / 動畫設計 頁面的付款說明。',
            faq_q6: '委託完成後，我擁有哪些使用權？', faq_a6: '委託完成後你擁有該模型的個人使用授權，可用於直播、影片等個人活動，公開使用需標註建模師署名。工程原始檔（.cmo3 等）需另行加購買斷方案，買斷後禁止轉讓或聲稱自製。',
            // Plan cards
            plan_basic: '標準方案', plan_basic_sub: '頭部重點動態 + 身體簡單動態。',
            plan_basic_tip: '📦 標準方案包含',
            plan_basic_i1: '・頭部動態（搖頭、點頭）', plan_basic_i2: '・眼睛眨眼 / 追蹤',
            plan_basic_i3: '・口型（開口動態）', plan_basic_i4: '・身體簡單搖擺',
            plan_basic_i5: '・呼吸物理效果', plan_basic_note: '※ 適合預算有限或簡單風格',
            plan_pro: '專業方案', plan_pro_sub: '頭身完整動態 + 優秀物理效果。',
            plan_pro_tip: '📦 專業方案包含',
            plan_pro_i1: '・標準方案全部內容', plan_pro_i2: '・頭髮 / 飾品物理搖擺',
            plan_pro_i3: '・身體完整動態（含腰部）', plan_pro_i4: '・手部基本動態',
            plan_pro_i5: '・優化物理碰撞效果', plan_pro_note: '※ 最受歡迎的主流選擇',
            plan_adv: '頂級方案', plan_adv_sub: '全身高動態、極致物理，追求完美表現。',
            plan_adv_tip: '📦 頂級方案包含',
            plan_adv_i1: '・專業方案全部內容', plan_adv_i2: '・全身高精度動態',
            plan_adv_i3: '・極致物理 / 多層碰撞', plan_adv_i4: '・細部配件獨立物理',
            plan_adv_i5: '・面捕表情優化調整', plan_adv_note: '※ 追求頂級質感的首選',
            plan_hover_tip: '滑鼠移至方案卡片可查看詳細包含內容',
            // Plan compare table
            plan_compare_title: '方案規格對照表',
            plan_compare_hint: '（點擊展開）', plan_compare_hint_open: '（點擊收合）',
            plan_compare_col_item: '規格項目',
            plan_compare_face: '面部捕捉', plan_compare_face_basic: '基礎九軸', plan_compare_face_pro: 'XYZ 軸大幅度', plan_compare_face_top: '全功能精細捕捉',
            plan_compare_mouth: '口型動態', plan_compare_mouth_basic: '基礎口型', plan_compare_mouth_pro: '進階口型', plan_compare_mouth_pro_sub: '含特殊發音', plan_compare_mouth_top: '頂級全口型', plan_compare_mouth_top_sub: '含舌頭 / 細節',
            plan_compare_physics: '物理晃動', plan_compare_physics_basic: '基礎物理', plan_compare_physics_pro: '複雜物理', plan_compare_physics_pro_sub: '多層衣服 / 長髮', plan_compare_physics_top: '頂級物理', plan_compare_physics_top_sub: '物理碰撞 / 細緻動態',
            plan_compare_fx: '特效動畫', plan_compare_fx_addon: '＋ 額外加購', plan_compare_fx_top: '✦ 內含基礎特效',
            plan_compare_price: '起價', plan_compare_note: '以上為起跳參考金額，實際依插圖複雜度與拆分數量報價',
            // Calculator sections
            core_s1: '方案選擇', core_s2: '表情與配件', core_s3: '動態與特效',
            core_s4: '特殊需求', core_s5: '結帳與細節設定',
            anim_s1: '動畫類型選擇', anim_s2: '細節設定',
            pay_method: '選擇支付方式', pay_installment: '分期付款方式',
            // Disclaimer
            disclaimer_title: '📋 試算結果僅供參考',
            disclaimer_core: '此頁面所顯示的估價為初步參考數字，實際報價須依插圖的拆分數量、圖層複雜度與額外調整需求而定。建議在委託前提供完整 PSD 供確認拆分情況，以取得更準確的正式報價。',
            disclaimer_anim: '此頁面所顯示的估價為初步參考數字，實際報價須依動畫素材的拆分數量、圖層結構與複雜度而定。建議在委託前提供完整素材供確認拆分情況，以取得更準確的正式報價。',
            // Option add-ons
            opt_tongue: '吐舌', opt_tongue_desc: '額外表情切換，需搭配表情開關觸發。',
            opt_ear: '獸耳', opt_ear_desc: '動態獸耳搖擺，含物理彈性演算。',
            opt_tail: '尾巴', opt_tail_desc: '含尾巴擺動與物理連動效果。',
            opt_vowel: '口型 (AIUEO)', opt_vowel_desc: '五種母音口型，需搭配語音軟體使用。',
            opt_expr: '額外表情差分', opt_expr_desc: '基礎表情外的追加切換（哭泣、驚訝等）。',
            opt_acc: '小配件切換', opt_acc_desc: '眼鏡、帽子、道具等可切換的小物件。',
            opt_hair: '額外髮型差分', opt_hair_desc: '不同綁法或長短的髮型切換，含物理演算。',
            opt_clothes: '額外服裝差分', opt_clothes_desc: '完整換裝方案，動態布料與配件一起調整。',
            opt_gesture: '特殊手勢動畫', opt_gesture_desc: '揮手、比愛心等觸發式互動動畫。',
            opt_pose: '身體姿態切換', opt_pose_desc: '坐姿、站姿等不同角度姿態一鍵切換。',
            opt_fx: '特效動畫', opt_fx_desc: '光暈、粒子、閃爍等視覺特效。',
            opt_tracking: '追蹤丟失動畫', opt_tracking_desc: '臉部追蹤失效時自動播放的備用待機動畫，避免模型僵住。',
            opt_chibi: '人物 Q 版化', opt_chibi_desc: '縮小頭身比例，打造可愛 Q 版造型，需重新分層。',
            opt_vbridger: 'VBridger 相容', opt_vbridger_desc: '支援 iPhone 面捕插件，追蹤精度大幅提升。',
            opt_project: '工程資料加購', opt_project_desc: '買斷工程原始檔 (不含分期/加急費用的總金額)',
            opt_project_mult: '+ 總金額 x1.5',
            opt_project_note: '包含 Live2D Cubism 原始工程檔，可自行二次修改，僅限本人使用，禁止轉讓。',
            opt_rush: '加急趕工',
            opt_rush_desc1: '加急費用依截止日期距離與工程複雜度而定，最終金額以溝通確認為準。',
            opt_rush_desc2: '截止日在 14 天以內：視為高度加急，費用起跳 NT$ 3,500 以上。',
            opt_rush_desc3: '截止日在 14–30 天：一般加急，費用依工作量協調。',
            opt_rush_desc4: '加急期間不接受大幅修改需求，請於委託前確認設計稿。',
            opt_supplement: '想要補充的資訊',
            // Anim type
            anim_type_sticker: '動態貼圖', anim_type_sticker_desc: '適合表情符號、小物件展示等輕量化需求。',
            anim_type_process: '動畫處理', anim_type_process_desc: '適合大型演出、表演設計、完整情境動畫。',
            opt_anim_rush_desc1: '動畫加急費用視作品複雜度與交期而定，最終以溝通確認為準。',
            opt_anim_rush_desc2: '動態貼圖加急：起跳 NT$ 1,000，10 天內交件另計。',
            opt_anim_rush_desc3: '動畫處理加急：視片長與場景複雜度，起跳 NT$ 2,000 以上。',
            opt_anim_rush_desc4: '加急確認後腳本或分鏡不得大幅更改，請提前備妥所需素材。',
            // Anim fields
            field_qty: '委託數量', field_physics: '要求的物理精細度',
            field_duration: '要求的動態時間 (秒)', field_chars: '動畫內人物數量',
            field_performance: '是否有表演設計 (+NT$ 1,000)',
            field_bg: '背景動畫要求 (+NT$ 500)', field_bg_note: '※ 實際費用視情況調節，複雜場景可能需另行報價',
            physics_normal: '一般精細度', physics_high_200: '高精細度 (+NT$ 200)',
            physics_high_1000: '高精細度 (+NT$ 1,000)', physics_ultra: '極致精細 (+NT$ 2,000)',
            rush_ph: '請說明截止日期與加急原因，例如：活動日期、直播首播日等⋯',
            supp_ph_core: '例如：希望加上特定動作、參考圖片連結...',
            rush_ph_anim: '請說明截止日期、活動名稱或使用場合，以便評估加急可行性⋯',
            supp_ph_anim: '希望加上特定舞蹈、影片連結...',
            unit_each: '個', unit_set: '組', unit_outfit: '套',
            // Payment
            pay_bank: '銀行匯款', pay_fee: '手續費', pay_foreign: '✦ 接受外幣委託',
            pay_ecpay: '綠界 / 超商',
            pay_one: '一次付清', pay_two: '兩期分款', pay_two_note: '總價 +3%',
            pay_three: '三期分款', pay_three_note: '總價 +5%',
            // Sidebar
            sidebar_total: '預估總金額', sidebar_breakdown: '報價明細', sidebar_reset: '重置',
            sidebar_rush_label: '加急趕工說明', sidebar_supp_label: '補充資訊',
            sidebar_agree: '我已閱讀並同意「流程與規範」內的所有條款。',
            sidebar_screenshot: '一鍵截圖預估金額',
            sidebar_copy_summary: '一鍵複製委託需求清單',
            sidebar_rules_link: '查看授權與委託須知',
            sidebar_port_btn: '前往作品展示查看參考範例',
            sidebar_send_btn: '填寫委託項目表單',
            sidebar_delivery_toggle: '查看交付格式說明',
            // Order badge & copy summary i18n strings
            order_badge_label: '委託編號',
            summary_vp_title: 'Live2D V皮設計 委託需求清單',
            summary_anim_title: 'Live2D 動畫設計 委託需求清單',
            summary_order_id: '委託編號',
            summary_order_id_pending: '（請先勾選同意條款以生成）',
            summary_plan: '方案選擇',
            summary_addons: '加購項目',
            summary_items: '委託項目',
            summary_total: '預算總計',
            label_rush_yes: '是 / 已加急',
            label_no: '否',
            label_none: '無',
            // Delivery
            del_moc3: '— 主要執行檔，可在 VTubeStudio 等軟體使用',
            del_textures: '— 模型所需全部材質貼圖（PNG）',
            del_physics: '— 物理設定檔（頭髮、飾品物理效果）',
            del_model3: '— 模型描述檔，整合所有元件路徑',
            del_expr: '— 表情切換設定（如有追加表情）',
            del_motions: '— 動作資料（閒置動畫等）',
            del_cmo3: '— 需另行加購「工程資料加購」才包含，保留 4 個月',
            del_cloud: '所有檔案以壓縮包形式透過 Google Drive 或其他雲端連結交付。',
            del_sticker_cat: '🎞 動態貼圖', del_mp4_sticker: '— 主流影片格式，相容性最高',
            del_gif: '— 動圖格式，適合貼圖平台上傳',
            del_webm_sticker: '— 網頁透明背景格式，適合疊圖使用',
            del_anim_cat: '🎬 動畫 / PV', del_mp4_anim: '— 標準交付格式',
            del_webm_anim: '— 透明背景需求時使用',
            del_mov: '— Apple 環境或高品質輸出需求時使用',
            // JS calculate labels
            deposit_label: '頭款', balance_label: '尾款', per_inst_label: '各期',
            // Portfolio
            port_page_title: '作品展示',
            port_page_desc: '阿卡貓的 Live2D 模型、動畫、貼圖等相關作品集，持續更新中。',
            port_vtube_section: 'VTuber 模型展示',
            port_card_title: '阿卡貓 自製 Live2D V皮',
            port_yt_btn: '前往 YouTube 觀看', port_x_btn: '前往 X 觀看',
            port_pv_tag: 'PV 製作', port_anim_tag: '動畫演出', port_perf_tag: 'Live2D 演出',
            port_stickers: '動態貼圖', port_logos: '動態 Logo',
            port_anim_info: '動畫資訊與演出設計',
            port_vtag: 'V皮展示', port_rigger: '建模', port_coming_soon: '即將公開',
            port_demo_label: '阿卡貓 展示模型（固定）',
            port_demo_note: '本模型為阿卡貓作品集展示用途，僅供參考，不作任何商業販售。',
            // Intro extras
            edu_soda1: 'SodaArt 建模班五、六期生', edu_soda2: 'SodaArt 動畫班二、三期生',
            edu_soda3: 'SodaArt 創作技巧延伸班一期生', edu_link: '連結',
            ach_juku_title: 'Live2D JUKU 公式 創作展示', ach_juku_date: '日期：2025 / 03 / 26',
            ach_view_btn: '查看展示作品', ach_portfolio_btn: '前往創作空間查看更多作品',
            intro_click_tip: '👆 點我試試看！',
            // Channels
            channels_title: '推薦頻道', channels_desc: '阿卡貓精選推薦的頻道們，有興趣歡迎去看看！',
            ch_live: '直播中', ch_offline: '離線',
            ch_followers: '位追蹤', ch_subscribers: '訂閱',
            channels_submit_label: '頻道推薦申請',
            channels_submit_notice: '若您希望將自己的頻道加入推薦清單，歡迎填寫申請表單，阿卡貓將於審核後聯繫您。',
            channels_submit_btn: '申請推薦頻道',
            // Fanart
            fanart_title: '二創展示', fanart_desc: '感謝大家的二創！每一份都是最棒的禮物 💜',
            fanart_chara1: '【阿卡貓】角色設定', fanart_chara2: '【阿卡咪】角色設定（虛擬）',
            char_height: '身高', char_birthday: '生日', char_gender: '性別',
            char_male: '男性', char_female: '女性', char_height_unit: '公分',
            char1_desc: '誤入奇幻世界的普通男孩，能夠召喚〈駭客面板〉這個工具對現實進行一定的修改，有〈貓球〉這個小夥伴會一起陪伴冒險。',
            char2_desc: '沒有過多資訊，只知道是莫名突然出現的特殊角色....？',
            fanart_rules_title: '二創資訊',
            fanart_ban1: '【禁止】過度血腥、NSFW（除非有經過我允許）',
            fanart_ban2: '【禁止】歪曲角色設定（不限服裝）',
            fanart_ok: '歡迎各位有趣二創，我這邊有看到也會轉發。',
            fanart_tag_label: '推特 Tag 資訊', fanart_submit_label: '二創投稿',
            fanart_submit_btn: '投稿二創作品',
            fanart_submit_notice: '投稿即代表您同意阿卡貓在其網站及社群媒體轉載此作品並標明創作者。表單內可選擇是否匿名。',
            fanart_treasures: '我的寶物', fanart_treasures_label: '✦ 我的寶物 ✦',
            fanart_loading: '正在從 GitHub 載入二創作品⋯',
            // Toast / alerts
            toast_agree: '請先勾選同意條款',
            toast_copied: '已複製到剪貼簿！',
            toast_screenshot_saved: '截圖已儲存！',
            toast_summary_copied: '委託清單已複製至剪貼簿！',
            // Bubbles
            intro_bubbles: ['你好呀！歡迎來到我的委託頁面！ ✨','有任何問題都可以寄信給我喔！','建模就是把角色的靈魂喚醒！ 🐱','委託開放中，快來找我委託！','做 Live2D 是我最快樂的事 💜','謝謝你點我！你是最棒的！ (≧▽≦)','每個角色都是獨一無二的作品 ✦','歡迎查看我的 X 作品集！'],
            collab_bubbles: ['別敲我！我是乖寶寶！','我沒有藏任何秘密！','你知道這個網站有藏著科樂美彩蛋嗎？','我需要更多的合作繪師！'],
            // Misc JS labels
            badge_loading: '載入中…', badge_loaded: '✓ 已載入', badge_fail: '載入失敗',
            github_rate: 'GitHub API 速率限制，請稍後再試',
            github_rate_short: 'GitHub 請求次數已達上限',
            github_rate_tip: '每小時最多 60 次請求，請稍後再重試。',
            error_prefix: '錯誤：',
            name_brand: '阿卡貓', name_display: '阿卡貓 (HakkaNeko)', name_short: '阿卡貓 HakkaNeko',
            intro_role_short: 'Live2D 建模師',
            quote_filename: '阿卡貓報價單',
            footer_role: 'Live2D 建模師 · 個人接案建模師',
            footer_credit: '本網站由 阿卡貓 HakkaNeko 企劃，介面設計與互動效果均由 AI 輔助生成、迭代優化，並經本人審定後發布。',
            kofi_btn: '請我喝杯咖啡', kofi_supporters_empty: '成為第一位贊助者！',
            // ── 聯名模板 ──
            tmpl_title: '聯名模板委託', tmpl_desc: '在現有 Live2D 模板骨架上進行個人化衣裝設計，用最具效益的方式，打造專屬你的 VTuber 外觀。',
            tmpl_disclaimer_title: '📋 試算結果僅供參考', tmpl_disclaimer_body: '此頁面所顯示的估價為初步參考數字，聯名模板的實際報價須依衣裝套數、自訂需求複雜度與建模師當前排單情況而定。建議先完成試算後再透過表單確認正式報價。',
            tmpl_s1_title: '選擇合作模板', tmpl_s2_title: '服裝選擇與加購', tmpl_s3_title: '髮型微調加購', tmpl_s4_title: '配件與表情加購', tmpl_s5_title: '其他補充資訊',
            tmpl_s2_hint: '第一套 NT$ 1,000，後續每套追加 +NT$ 400。點擊圖片即可選取，可複選。',
            tmpl_card_kanso_name: '換裝娃娃（殘光）', tmpl_card_kanso_desc: '共用骨架換裝模板，已完成 Live2D 動態工程，直接套用衣裝貼圖即可使用。', tmpl_card_kanso_price: 'NT$ 1,000 起',
            tmpl_card_more_name: '更多模板類型', tmpl_card_more_soon: '即將公開',
            tmpl_card_chanye_name: '長夜月搖（紅妻）', tmpl_card_chanye_desc: '夜晚氛圍聯名模板，搭配紅妻特色畫風，適合偏暗色系角色設計。', tmpl_card_chanye_price: 'NT$ 2,000 / 隻',
            tmpl_chanye_qty_label: '長夜月搖擺數量', tmpl_chanye_qty_desc: '每隻長夜月搖擺為獨立委託，請確認所需數量。',
            tmpl_chanye_s2_title: '合作模板展示', tmpl_chanye_s2_hint: '以下為長夜月搖合作模板的參考展示圖，點擊可放大檢視。',
            tmpl_chanye_s3_title: '需要委託的數量', tmpl_chanye_qty_unit: '隻', tmpl_chanye_qty_detail: '長夜月搖擺',
            tmpl_collab_artist: '合作繪師',
            tmpl_selected_pre: '已選', tmpl_selected_suf: '套衣裝',
            tmpl_hair_bang: '修改瀏海或後髮', tmpl_hair_bang_price: '+ NT$ 150 / 個', tmpl_hair_bang_desc: '修改現有髮型的局部細節，如瀏海形狀或後髮長度。',
            tmpl_hair_full: '整頂不同新髮型', tmpl_hair_full_price: '+ NT$ 300 / 個', tmpl_hair_full_desc: '全新髮型設計，與原髮型結構完全不同。',
            tmpl_acc_label: '可開關之配件小道具', tmpl_acc_price: '+ NT$ 100 / 個', tmpl_acc_desc: '眼鏡、花束、法仗等可切換顯示的配件。',
            tmpl_expr_label: '簡單表情微調', tmpl_expr_price: '+ NT$ 100 / 個', tmpl_expr_desc: '微調現有表情的細節，如眉形、眼神變化等。',
            tmpl_acc_input_label: '配件需求說明', tmpl_acc_input_hint: '（請具體描述需要的配件內容）',
            tmpl_acc_ph: '例如：一副黑框眼鏡、一束玫瑰花束、一把法師魔杖...（請描述每個配件的造型特徵）',
            tmpl_supp_ph: '可填寫角色設定、衣裝參考連結、特殊需求說明、截止日期等補充內容...',
            tmpl_acc_summary_label: '配件需求',
            tmpl_deposit_label: '訂金（50%）',
            tmpl_detail_outfit: '模板衣裝', tmpl_detail_suit: '套', tmpl_detail_empty: '尚未選擇任何項目',
            tmpl_copy_header: '委託需求清單', tmpl_copy_type: '模板類型', tmpl_copy_outfits: '選擇衣裝', tmpl_copy_none: '（未選擇）',
            tmpl_copy_acc: '配件需求', tmpl_copy_supp: '補充說明', tmpl_copy_note: '以上為初步估算，實際報價以確認後為準',
            tmpl_gallery_title: '服裝展示櫥窗', tmpl_gallery_switch: '點擊切換服裝',
            tmpl_gallery_note: '上方圖片僅為示意佔位圖。實際聯名模板衣裝請洽詢建模師確認當前可用模板清單。',
            tmpl_what_title: '什麼是聯名模板？',
            tmpl_what_li1: '在已建好的 Live2D 模板骨架上，直接繪製並替換衣裝貼圖，省略從零建模的時程與成本。',
            tmpl_what_li2: '第一套衣裝底價 NT$ 1,000，後續每追加一套僅需 NT$ 400，是入門 Live2D 的最划算選擇。',
            tmpl_what_li3: '可加購自訂衣裝（NT$ 1,500 起），以及髮型微調、配件與表情差分等個人化選項。',
            tmpl_what_li4: '聯名模板使用的是共用骨架，動態邏輯與物理效果與原模板一致，不支援自訂動態追加。如需完全自訂動態，請參考「V皮設計」頁面。',
            tmpl_calc_title: '聯名模板估價計算機',
            tmpl_s1_title: '選擇模板衣裝', tmpl_s1_hint: '（第一套底價，後續每套 +$400）',
            tmpl_outfit_label: '模板衣裝套數', tmpl_outfit_price_1: '第 1 套 NT$ 1,000', tmpl_outfit_price_add: '第 2 套起每套 +NT$ 400',
            tmpl_custom_label: '自訂衣裝加購', tmpl_custom_price: 'NT$ 1,500 起', tmpl_custom_note: '需與繪師、建模師詳細溝通',
            tmpl_s2_title: '髮型微調加購',
            tmpl_hair_bang: '修改瀏海或後髮', tmpl_hair_bang_price: '單個 +NT$ 150',
            tmpl_hair_full: '整頂不同新髮型', tmpl_hair_full_price: '單個 +NT$ 300',
            tmpl_s3_title: '配件與表情加購',
            tmpl_acc_label: '可開關之配件小道具', tmpl_acc_note: '眼鏡 / 花束 / 法仗等', tmpl_acc_price: '單個 +NT$ 100',
            tmpl_expr_label: '簡單表情微調', tmpl_expr_price: '單個 +NT$ 100',
            tmpl_total_label: '模板估價總計', tmpl_total_hint: '不含運費與手續費',
            tmpl_copy_btn: '📋 一鍵複製模板需求清單', tmpl_copy_header: '委託需求清單',
            tmpl_copy_note: '以上為初步估算，實際報價以確認後為準',
            tmpl_outfit_detail_1: '模板衣裝（第 1 套）', tmpl_outfit_detail_add: '追加衣裝',
            tmpl_form_note: '確認報價後，歡迎透過表單提交聯名模板委託需求。',
            badge_loading: '載入中…', badge_loaded: '✓ 已載入', badge_fail: '載入失敗',
        },
        'zh-CN': {
            langFlag: 'cn', langCode: 'CN', htmlLang: 'zh-CN',
            header_title: ' 的 Live2D 建模委托',
            header_sub: '流程透明 · 专业可靠 ✦ 让你的角色动起来',
            nav_intro: '关于我', nav_artists: '合作画师',
            nav_commission: '委托信息', nav_rules: '流程与条款',
            nav_core: 'V皮设计', nav_anim: '动画设计',
            nav_template: '联名模板',
            nav_creative: '创作空间', nav_portfolio: '作品集',
            nav_channels: '推荐频道', nav_fanart: '二创墙',
            intro_role: '自由建模师 · Live2D 讲师',
            intro_bio: '2021年开始专注于 Live2D 建模，同时在线下担任讲师。累计完成超过 1000 件委托，平时喜欢在 X 上和大家分享建模心得。对细节有执念，期待和各种风格的画师合作，让平面角色真正"活"起来。',
            intro_education: '学习经历', intro_achievements: '荣誉成就',
            intro_services_title: '提供的服务',
            svc_live2d: 'V皮设计', svc_live2d_desc: '为 VTuber 制作模型，支持面部追踪和鼠标跟随。',
            svc_anim: '动画设计', svc_anim_desc: '动态 Logo、表情包、PV 及游戏 CG 动画。',
            svc_consult: 'Live2D 咨询', svc_consult_desc: '答疑解惑，协助配置 VTubeStudio 和 OBS 直播环境。',
            svc_project: '工程文件购买', svc_project_desc: '完成委托后可选择买断源工程文件（不单独出售）。',
            collab_title: '一站式角色设计与建模服务',
            collab_desc: '我虽然不直接画图，但长期与多位优秀画师合作，能为你提供从角色设计到建模完成的全流程服务，简约或精细风格都能搞定。',
            collab_point1: '多种画风可选，量身定制', collab_point2: '沟通顺畅，配合度高',
            collab_btn: '查看合作画师',
            comm_open: '接单中', comm_closed: '暂停接单',
            live_on: '正在 Twitch 直播！', live_off: '当前未直播',
            artists_title: '合作画师阵容',
            artists_subtitle: '携手优秀画师，为你打造最合适的角色形象与美术支持。',
            artists_apply_label: '申请合作', artists_apply_btn: '申请成为合作画师',
            artists_apply_notice: '此申请用于建立合作画师名单，并非受雇或工作邀请。HakkaNeko 将根据风格与时程需求主动联系合适的画师。',
            form_email: '你的 Google 邮箱', form_note: '角色备注 / 补充说明',
            rules_contact_title: '联系方式与排期查询',
            rules_contact_desc: '委托名额有限，建议先查看 Google 排期表或直接联系询问空档！',
            rules_schedule_btn: '查看排期',
            rules_process_title: 'Live2D 委托流程',
            rules_terms_title: '委托条款与版权声明',
            rules_terms_notice: '注意：提交委托即视为已阅读并同意以下全部条款。',
            rules_s1: '一、委托资格', rules_s2: '二、取消与退款',
            rules_s3: '三、制作周期与授权', rules_s4: '四、使用授权',
            rules_s5: '五、禁止行为与违约责任', rules_s6: '六、版权保护声明',
            rules_step1_title: '1. 填写委托表单', rules_step1_desc: '填写委托项目表单，说明您的委托需求与偏好，信息越详细报价越准确。',
            rules_step2_title: '2. 确认分层情况', rules_step2_desc: '如能提供完整 PSD 分层，报价更准确；否则仅提供参考价格。',
            rules_step3_title: '3. 沟通细节', rules_step3_desc: '一起确认需求和预期效果，确保理解一致。',
            rules_step4_title: '4. 支付定金', rules_step4_desc: '确认委托后，支付定金即可启动项目。',
            rules_step5_title: '5. 建模确认', rules_step5_desc: '提供 3 次修改机会（因失误导致的问题免费修复）。超出次数或大幅改动需额外付费。',
            rules_step6_title: '6. 尾款与交付', rules_step6_desc: '完成后支付尾款，交付最终文件（moc3 等）。工程源文件需单独购买。',
            rules_s1_body: '委托者须年满 18 周岁。因虚报年龄引发的法律纠纷，责任由委托方自行承担，本人不负连带责任（以个人身份承接）。',
            rules_s2_li1: '委托方主动取消：定金不予退还，并需支付已完成部分的制作费用。',
            rules_s2_li2: '修改确认期间，3个工作日内未回复将主动跟进；连续5个工作日无回应，视为自动放弃委托。',
            rules_s2_li3: '因本人不可抗力原因取消，将全额退款。',
            rules_s2_pause_label: '暂停 / 延期申请：',
            rules_s2_pause_body: '如因个人原因暂时无法回复，请提前通过邮件或 X 私信告知。可协商暂停制作进度，恢复后继续，已付费用不受影响。',
            rules_s3_li1: '商用授权 — 报价均含商用授权费，无需额外支付。',
            rules_s3_li2: '交付周期 — 一般项目约 4–8 周完成，实际依复杂度和排期灵活调整。',
            rules_s3_li3: '排期查询 — 可通过页面顶部「查看排期」链接查看，或直接联系咨询空档。',
            rules_s3_li4: '文件保留 — 工程源文件保留 4 个月，超期需重新支付全款后取件。',
            rules_s4_li1: '署名要求 — 公开使用时需注明：「Live2D 建模：HakkaNeko」。',
            rules_s4_li2: '作品展示 — 本人保留将成品收录至个人作品集及宣传素材的权利（买断方案除外）。',
            rules_s4_li3: '买断条款 — 工程源文件买断价为总金额 × 1.5，禁止转让或声称为自制。',
            rules_s5_intro: '以下行为一经发现，立即终止全部授权并追究法律责任：',
            rules_s5_li1: '将成品转售、转让或用于第三方商业用途。',
            rules_s5_li2: '删除或伪造建模师的署名信息。', rules_s5_li3: '未经授权对成品进行修改后出售。',
            rules_s5_penalty: '违约方需支付原价 3 倍的违约金，并承担由此产生的全部法律费用。',
            rules_s6_intro: '本人（HakkaNeko）以个人创作者身份提供服务，所有作品受《著作权法》及 DMCA 相关规定保护。',
            rules_s6_li1: '侵权处理 — 发现任何平台存在盗用或未授权使用行为，将依 DMCA 程序申请下架，并保留追诉权利。',
            rules_s6_li2: '模型保护 — Live2D 工程文件为个人知识产权，任何反编译或未授权解包均属侵权。',
            rules_s6_li3: '个人声明 — 以上为个人委托条款，有疑问欢迎直接沟通，最终解释权归本人所有。',
            rules_s6_footer: '※ 本条款由创作者本人（HakkaNeko）制定，不代表任何机构或平台立场 ※',
            faq_title: '常见问题 FAQ',
            faq_q1: '完成一件 Live2D 模型大概需要多长时间？', faq_a1: '依方案与当前排单情况而定，一般 Live2D 模型约需 4～8 周。动画类委托视复杂度另计。建议先查看排单状态或直接询问确切档期。',
            faq_q2: '可以修改几次？超过次数怎么办？', faq_a2: '建模确认阶段提供 3 次修改机会，制作失误免费修正不计次数。超过 3 次或大幅度修改需额外收费，费用依修改量协商。',
            faq_q3: '没有 PSD 拆件可以委托吗？', faq_a3: '可以，但只能提供参考估价，实际费用须等收到完整 PSD 后确认。也可询问是否有合作绘师协助拆件。',
            faq_q4: '可以委托厂商合作或直播团队企划吗？', faq_a4: '欢迎厂商或直播团队洽谈，商业合作请填写委托项目表单，并在备注中说明合作性质与规模，我会优先安排回复。',
            faq_q5: '付款方式有哪些？可以分期吗？', faq_a5: '支持台湾银行转账、PayPal（需加收手续费）及绿界金流。费用默认分头款（50%）与尾款（50%）两阶段；也可选择两期付款（加收 3%）或三期付款（加收 5%）。',
            faq_q6: '委托完成后我拥有哪些使用权？', faq_a6: '委托完成后拥有该模型的个人使用授权，可用于直播、视频等个人活动，公开使用需标注建模师署名。工程源文件需另行加购买断方案，买断后禁止转让或声称自制。',
            plan_basic: '标准方案', plan_basic_sub: '头部主要动态 + 简单身体动态。',
            plan_basic_tip: '📦 标准方案包含',
            plan_basic_i1: '・头部动态（摇头、点头）', plan_basic_i2: '・眨眼 / 眼球追踪',
            plan_basic_i3: '・口型（开合）', plan_basic_i4: '・简单身体摆动',
            plan_basic_i5: '・呼吸物理效果', plan_basic_note: '※ 适合预算有限或简约风格',
            plan_pro: '专业方案', plan_pro_sub: '完整头身动态 + 优质物理效果。',
            plan_pro_tip: '📦 专业方案包含',
            plan_pro_i1: '・标准方案全部内容', plan_pro_i2: '・头发 / 饰品物理摆动',
            plan_pro_i3: '・完整身体动态（含腰部）', plan_pro_i4: '・基础手部动态',
            plan_pro_i5: '・优化物理碰撞效果', plan_pro_note: '※ 最受欢迎的选择',
            plan_adv: '顶级方案', plan_adv_sub: '全身高精度动态、极致物理，追求极致表现。',
            plan_adv_tip: '📦 顶级方案包含',
            plan_adv_i1: '・专业方案全部内容', plan_adv_i2: '・全身高精度动态',
            plan_adv_i3: '・极致物理 / 多层碰撞', plan_adv_i4: '・细节配件独立物理',
            plan_adv_i5: '・面捕表情精细调整', plan_adv_note: '※ 追求顶级品质的首选',
            plan_hover_tip: '鼠标悬停查看方案详情',
            plan_compare_title: '方案规格对照表',
            plan_compare_hint: '（点击展开）', plan_compare_hint_open: '（点击收起）',
            plan_compare_col_item: '规格项目',
            plan_compare_face: '面部捕捉', plan_compare_face_basic: '基础九轴', plan_compare_face_pro: 'XYZ 轴大幅度', plan_compare_face_top: '全功能精细捕捉',
            plan_compare_mouth: '口型动态', plan_compare_mouth_basic: '基础口型', plan_compare_mouth_pro: '进阶口型', plan_compare_mouth_pro_sub: '含特殊发音', plan_compare_mouth_top: '顶级全口型', plan_compare_mouth_top_sub: '含舌头 / 细节',
            plan_compare_physics: '物理晃动', plan_compare_physics_basic: '基础物理', plan_compare_physics_pro: '复杂物理', plan_compare_physics_pro_sub: '多层衣服 / 长发', plan_compare_physics_top: '顶级物理', plan_compare_physics_top_sub: '物理碰撞 / 细腻动态',
            plan_compare_fx: '特效动画', plan_compare_fx_addon: '＋ 额外加购', plan_compare_fx_top: '✦ 内含基础特效',
            plan_compare_price: '起价', plan_compare_note: '以上为起跳参考价格，实际依插图复杂度与分层数量报价',
            core_s1: '选择方案', core_s2: '表情与配件', core_s3: '动态与特效',
            core_s4: '特殊需求', core_s5: '结算与详细设置',
            anim_s1: '选择动画类型', anim_s2: '详细设置',
            pay_method: '选择支付方式', pay_installment: '分期方式',
            disclaimer_title: '📋 报价仅供参考',
            disclaimer_core: '页面显示的价格为初步参考，实际报价以分层数量、复杂度及额外需求为准。建议委托前提供完整 PSD 以获得准确报价。',
            disclaimer_anim: '页面显示的价格为初步参考，实际报价以素材分层数量、结构及复杂度为准。建议委托前提供完整素材以获得准确报价。',
            opt_tongue: '吐舌表情', opt_tongue_desc: '附加表情，通过表情开关触发。',
            opt_ear: '兽耳', opt_ear_desc: '带物理弹性的动态兽耳摆动。',
            opt_tail: '尾巴', opt_tail_desc: '带物理联动的尾巴摆动效果。',
            opt_vowel: '口型同步 (AIUEO)', opt_vowel_desc: '五个元音口型，配合语音软件使用。',
            opt_expr: '追加表情差分', opt_expr_desc: '基础表情之外的追加切换（哭泣、惊讶等）。',
            opt_acc: '配件切换', opt_acc_desc: '眼镜、帽子、道具等可切换小物件。',
            opt_hair: '发型差分', opt_hair_desc: '不同发型或长短的切换，含物理演算。',
            opt_clothes: '服装差分', opt_clothes_desc: '完整换装方案，含动态布料和配件调整。',
            opt_gesture: '手势动画', opt_gesture_desc: '挥手、比心等触发式互动动画。',
            opt_pose: '姿势切换', opt_pose_desc: '坐姿、站姿等一键切换。',
            opt_fx: '视觉特效', opt_fx_desc: '光晕、粒子、闪烁等特效动画。',
            opt_tracking: '追踪丢失动画', opt_tracking_desc: '面捕断开时自动播放备用待机动画，防止模型卡住。',
            opt_chibi: 'Q版化', opt_chibi_desc: '缩小头身比，打造可爱Q版形象，需重新分层。',
            opt_vbridger: '兼容 VBridger', opt_vbridger_desc: '支持 iPhone 面捕插件，追踪精度显著提升。',
            opt_project: '购买工程源文件', opt_project_desc: '买断工程源文件（不含分期/加急费用的总金额）',
            opt_project_mult: '+ 总价 × 1.5',
            opt_project_note: '包含 Live2D Cubism 工程源文件，可自行二次修改，仅限本人使用，禁止转让。',
            opt_rush: '加急处理',
            opt_rush_desc1: '加急费用根据截止日期和项目复杂度而定，最终金额以沟通为准。',
            opt_rush_desc2: '截止日在 14 天以内：属高度加急，起步价 NT$ 3,500 以上。',
            opt_rush_desc3: '截止日在 14–30 天：普通加急，费用按工作量协商。',
            opt_rush_desc4: '加急期间不接受大幅修改，请在委托前确认好设计稿。',
            opt_supplement: '补充说明',
            anim_type_sticker: '动态贴图', anim_type_sticker_desc: '适合表情符号、小物件展示等轻量需求。',
            anim_type_process: '动画处理', anim_type_process_desc: '适合大型演出、表演设计和完整场景动画。',
            opt_anim_rush_desc1: '动画加急费用视复杂度和交期而定，最终以沟通为准。',
            opt_anim_rush_desc2: '动态贴图加急：起步 NT$ 1,000，10 天内交付另计。',
            opt_anim_rush_desc3: '动画制作加急：视时长与场景复杂度，起步 NT$ 2,000 以上。',
            opt_anim_rush_desc4: '加急确认后不可大幅修改脚本或分镜，请提前备好素材。',
            field_qty: '数量', field_physics: '物理精细度',
            field_duration: '动态时长（秒）', field_chars: '角色数量',
            field_performance: '包含演出设计 (+NT$ 1,000)',
            field_bg: '包含背景动画 (+NT$ 500)', field_bg_note: '※ 实际费用视情况调整，复杂场景可能需另行报价',
            physics_normal: '标准', physics_high_200: '高精细 (+NT$ 200)',
            physics_high_1000: '高精细 (+NT$ 1,000)', physics_ultra: '极致精细 (+NT$ 2,000)',
            rush_ph: '请说明截止日期和加急原因，例如：活动日期、开播日…',
            supp_ph_core: '例如：希望加入特定动作、参考图片链接…',
            rush_ph_anim: '请说明截止日期、活动名称或使用场合…',
            supp_ph_anim: '例如：想要特定舞蹈风格、参考视频链接…',
            unit_each: '个', unit_set: '套', unit_outfit: '套装',
            pay_bank: '银行转账', pay_fee: '手续费', pay_foreign: '✦ 支持外币委托',
            pay_ecpay: '绿界科技 / 超商付款',
            pay_one: '一次付清', pay_two: '分两期', pay_two_note: '总价 +3%',
            pay_three: '分三期', pay_three_note: '总价 +5%',
            sidebar_total: '预估总价', sidebar_breakdown: '报价明细', sidebar_reset: '重置',
            sidebar_rush_label: '加急说明', sidebar_supp_label: '补充说明',
            sidebar_agree: '我已阅读并同意「流程与条款」中的所有内容。',
            sidebar_screenshot: '一键截图预估金额',
            sidebar_copy_summary: '一键复制委托需求清单',
            sidebar_rules_link: '查看授权与委托须知',
            sidebar_port_btn: '查看作品集参考', sidebar_send_btn: '填写委托项目表单',
            sidebar_delivery_toggle: '查看交付格式说明',
            order_badge_label: '委托编号',
            summary_vp_title: 'Live2D V皮设计 委托需求清单',
            summary_anim_title: 'Live2D 动画设计 委托需求清单',
            summary_order_id: '委托编号',
            summary_order_id_pending: '（请先勾选同意条款以生成）',
            summary_plan: '方案选择', summary_addons: '加购项目',
            summary_items: '委托项目', summary_total: '预算总计',
            label_rush_yes: '是 / 已加急', label_no: '否', label_none: '无',
            del_moc3: '— 主运行文件，可在 VTubeStudio 等软件中使用',
            del_textures: '— 模型所需的全部贴图（PNG）',
            del_physics: '— 物理设置文件（头发、饰品摆动）',
            del_model3: '— 模型描述文件，整合所有组件路径',
            del_expr: '— 表情切换设置（如有追加表情）',
            del_motions: '— 动作数据（待机动画等）',
            del_cmo3: '— 需单独购买「工程文件」选项，保留 4 个月',
            del_cloud: '所有文件打包为压缩包，通过 Google Drive 或其他网盘链接交付。',
            del_sticker_cat: '🎞 动态贴图', del_mp4_sticker: '— 主流视频格式，兼容性最佳',
            del_gif: '— GIF 格式，适合上传到各大贴图平台',
            del_webm_sticker: '— 透明背景网页格式，适合叠加使用',
            del_anim_cat: '🎬 动画 / PV', del_mp4_anim: '— 标准交付格式',
            del_webm_anim: '— 需要透明背景时使用',
            del_mov: '— 适用于 Apple 设备或高质量输出需求',
            deposit_label: '定金', balance_label: '尾款', per_inst_label: '每期',
            port_page_title: '作品集', port_page_desc: 'HakkaNeko 的 Live2D 模型、动画、动图等作品，持续更新中。',
            port_vtube_section: 'VTuber 模型展示', port_card_title: 'HakkaNeko 自制 Live2D V皮',
            port_yt_btn: '前往 YouTube 观看', port_x_btn: '前往 X 观看',
            port_pv_tag: 'PV 制作', port_anim_tag: '动画演出', port_perf_tag: 'Live2D 演出',
            port_stickers: '动态表情包', port_logos: '动态 Logo',
            port_anim_info: '动画信息与演出设计',
            port_vtag: 'V皮展示', port_rigger: '建模', port_coming_soon: '即将上线',
            port_demo_label: 'HakkaNeko 展示模型（固定展示）',
            port_demo_note: '本模型仅用于HakkaNeko作品集展示，不作商业出售。',
            edu_soda1: 'SodaArt 建模班 第5、6期', edu_soda2: 'SodaArt 动画班 第2、3期',
            edu_soda3: 'SodaArt 进阶技巧班 第1期', edu_link: '链接',
            ach_juku_title: 'Live2D JUKU 官方作品展示', ach_juku_date: '时间：2025 / 03 / 26',
            ach_view_btn: '查看展示作品', ach_portfolio_btn: '前往作品集查看更多',
            intro_click_tip: '👆 点我试试！',
            channels_title: '推荐频道', channels_desc: 'HakkaNeko 精心挑选的推荐频道，感兴趣的话去看看吧！',
            ch_live: '直播中', ch_offline: '未开播',
            ch_followers: '位关注', ch_subscribers: '订阅',
            channels_submit_label: '频道推荐申请',
            channels_submit_notice: '若您希望将自己的频道加入推荐列表，欢迎填写申请表单，阿卡猫将于审核后联系您。',
            channels_submit_btn: '申请推荐频道',
            fanart_title: '二创墙', fanart_desc: '谢谢大家的二创！每一份都是最珍贵的礼物 💜',
            fanart_chara1: '【HakkaNeko】角色设定', fanart_chara2: '【阿卡咪】角色设定（虚拟）',
            char_height: '身高', char_birthday: '生日', char_gender: '性别',
            char_male: '男', char_female: '女', char_height_unit: '厘米',
            char1_desc: '误入奇幻世界的普通男孩，能召唤〈黑客面板〉对现实进行有限修改，身边有〈猫球〉陪伴冒险。',
            char2_desc: '资料极少，只知道是莫名其妙出现的神秘角色……？',
            fanart_rules_title: '二创须知',
            fanart_ban1: '【禁止】过度血腥或 NSFW 内容（未经本人许可）',
            fanart_ban2: '【禁止】歪曲角色设定（服装不限）',
            fanart_ok: '欢迎各种有趣二创，看到了会转发！',
            fanart_tag_label: 'X / 微博 Tag', fanart_submit_label: '投稿二创',
            fanart_submit_btn: '投稿二创作品',
            fanart_submit_notice: '投稿即代表你同意 HakkaNeko 在其网站及社群媒体转载此作品并标明创作者。表单内可选择是否匿名。',
            fanart_treasures: '我的宝贝', fanart_treasures_label: '✦ 我的宝贝 ✦',
            fanart_loading: '正在从 GitHub 加载二创作品…',
            toast_agree: '请先勾选同意条款',
            toast_copied: '已复制到剪贴板！',
            toast_screenshot_saved: '截图已保存！',
            toast_summary_copied: '委托清单已复制到剪贴板！',
            intro_bubbles: ['嗨！欢迎来到我的委托页面！ ✨','有问题随时发邮件给我哦！','建模就是让角色真正"活"过来！ 🐱','正在接单，欢迎来找我！','做 Live2D 是我最快乐的事 💜','谢谢你点我！你最棒了！ (≧▽≦)','每个角色都是独一无二的 ✦','欢迎去 X 看我的作品集！'],
            collab_bubbles: ['别戳我！我是乖宝宝！','我没有藏任何秘密！','你知道这个网站藏了个魂斗罗彩蛋吗？','我还需要更多合作画师！'],
            badge_loading: '加载中…', badge_loaded: '✓ 已加载', badge_fail: '加载失败',
            github_rate: 'GitHub API 请求次数已达上限，请稍后再试',
            github_rate_short: 'GitHub 请求限额已达上限',
            github_rate_tip: '每小时最多 60 次请求，请稍后再试。',
            error_prefix: '错误：',
            name_brand: '阿卡貓', name_display: '阿卡貓 (HakkaNeko)', name_short: 'HakkaNeko',
            intro_role_short: 'Live2D 建模师',
            quote_filename: 'HakkaNeko报价单',
            footer_role: 'Live2D 建模师 · 个人接案建模师',
            footer_credit: '本站由 HakkaNeko 策划，界面设计与交互效果借助 AI 生成并经本人审核后发布。',
            kofi_btn: '请我喝杯咖啡', kofi_supporters_empty: '成为第一位赞助者！',
            // ── 联名模板 ──
            tmpl_title: '联名模板委托', tmpl_desc: '在现有 Live2D 模板骨架上进行个人化服装设计，用最具性价比的方式，打造属于你的 VTuber 外观。',
            tmpl_disclaimer_title: '📋 试算结果仅供参考', tmpl_disclaimer_body: '此页面所显示的估价为初步参考数字，实际报价须依服装套数、自定义需求复杂度与建模师当前排单情况而定。',
            tmpl_s1_title: '选择合作模板', tmpl_s2_title: '服装选择与加购', tmpl_s3_title: '发型微调加购', tmpl_s4_title: '配件与表情加购', tmpl_s5_title: '其他补充信息',
            tmpl_s2_hint: '第一套 NT$ 1,000，后续每套追加 +NT$ 400。点击图片即可选取，可多选。',
            tmpl_card_kanso_name: '换装娃娃（残光）', tmpl_card_kanso_desc: '共用骨架换装模板，已完成 Live2D 动态工程，直接套用服装贴图即可使用。', tmpl_card_kanso_price: 'NT$ 1,000 起',
            tmpl_card_more_name: '更多模板类型', tmpl_card_more_soon: '即将公开',
            tmpl_card_chanye_name: '长夜月摇（红妻）', tmpl_card_chanye_desc: '夜晚氛围联名模板，搭配红妻特色画风，适合偏暗色系角色设计。', tmpl_card_chanye_price: 'NT$ 2,000 / 隻',
            tmpl_chanye_qty_label: '长夜月摇摆数量', tmpl_chanye_qty_desc: '每只长夜月摇摆为独立委托，请确认所需数量。',
            tmpl_chanye_s2_title: '合作模板展示', tmpl_chanye_s2_hint: '以下为长夜月摇合作模板的参考展示图。',
            tmpl_chanye_s3_title: '需要委托的数量', tmpl_chanye_qty_unit: '只', tmpl_chanye_qty_detail: '长夜月摇摆',
            tmpl_collab_artist: '合作画师',
            tmpl_selected_pre: '已选', tmpl_selected_suf: '套服装',
            tmpl_hair_bang: '修改刘海或后发', tmpl_hair_bang_price: '+ NT$ 150 / 个', tmpl_hair_bang_desc: '修改现有发型的局部细节，如刘海形状或后发长度。',
            tmpl_hair_full: '整顶不同新发型', tmpl_hair_full_price: '+ NT$ 300 / 个', tmpl_hair_full_desc: '全新发型设计，与原发型结构完全不同。',
            tmpl_acc_label: '可开关之配件小道具', tmpl_acc_price: '+ NT$ 100 / 个', tmpl_acc_desc: '眼镜、花束、法杖等可切换显示的配件。',
            tmpl_expr_label: '简单表情微调', tmpl_expr_price: '+ NT$ 100 / 个', tmpl_expr_desc: '微调现有表情的细节，如眉形、眼神变化等。',
            tmpl_acc_input_label: '配件需求说明', tmpl_acc_input_hint: '（请具体描述需要的配件内容）',
            tmpl_acc_ph: '例如：一副黑框眼镜、一束玫瑰花束、一把法师魔杖...（请描述每个配件的造型特征）',
            tmpl_supp_ph: '可填写角色设定、服装参考链接、特殊需求说明、截止日期等补充内容...',
            tmpl_acc_summary_label: '配件需求',
            tmpl_deposit_label: '订金（50%）',
            tmpl_detail_outfit: '模板服装', tmpl_detail_suit: '套', tmpl_detail_empty: '尚未选择任何项目',
            tmpl_copy_header: '委托需求清单', tmpl_copy_type: '模板类型', tmpl_copy_outfits: '选择服装', tmpl_copy_none: '（未选择）',
            tmpl_copy_acc: '配件需求', tmpl_copy_supp: '补充说明', tmpl_copy_note: '以上为初步估算，实际报价以确认后为准',
            tmpl_gallery_title: '服装展示橱窗', tmpl_gallery_switch: '点击切换服装',
            tmpl_gallery_note: '上方图片仅为示意占位图。实际联名模板服装请咨询建模师确认当前可用模板清单。',
            tmpl_what_title: '什么是联名模板？',
            tmpl_what_li1: '在已建好的 Live2D 模板骨架上，直接绘制并替换服装贴图，省略从零建模的时间与成本。',
            tmpl_what_li2: '第一套服装底价 NT$ 1,000，后续每追加一套仅需 NT$ 400，是入门 Live2D 的最划算选择。',
            tmpl_what_li3: '可加购自定义服装（NT$ 1,500 起），以及发型微调、配件与表情差分等个人化选项。',
            tmpl_what_li4: '联名模板使用共用骨架，动态逻辑与物理效果与原模板一致，不支持自定义动态追加。',
            tmpl_calc_title: '联名模板估价计算机',
            tmpl_s1_title: '选择模板服装', tmpl_s1_hint: '（第一套底价，后续每套 +$400）',
            tmpl_outfit_label: '模板服装套数', tmpl_outfit_price_1: '第 1 套 NT$ 1,000', tmpl_outfit_price_add: '第 2 套起每套 +NT$ 400',
            tmpl_custom_label: '自定义服装加购', tmpl_custom_price: 'NT$ 1,500 起', tmpl_custom_note: '需与画师、建模师详细沟通',
            tmpl_s2_title: '发型微调加购',
            tmpl_hair_bang: '修改刘海或后发', tmpl_hair_bang_price: '单个 +NT$ 150',
            tmpl_hair_full: '整顶不同新发型', tmpl_hair_full_price: '单个 +NT$ 300',
            tmpl_s3_title: '配件与表情加购',
            tmpl_acc_label: '可开关之配件小道具', tmpl_acc_note: '眼镜 / 花束 / 法仗等', tmpl_acc_price: '单个 +NT$ 100',
            tmpl_expr_label: '简单表情微调', tmpl_expr_price: '单个 +NT$ 100',
            tmpl_total_label: '模板估价总计', tmpl_total_hint: '不含运费与手续费',
            tmpl_copy_btn: '📋 一键复制模板需求清单', tmpl_copy_header: '委托需求清单',
            tmpl_copy_note: '以上为初步估算，实际报价以确认后为准',
            tmpl_outfit_detail_1: '模板服装（第 1 套）', tmpl_outfit_detail_add: '追加服装',
            tmpl_form_note: '确认报价后，欢迎通过表单提交联名模板委托需求。',
        },
        'en': {
            langFlag: 'us', langCode: 'EN', htmlLang: 'en',
            header_title: "'s Live2D Commission",
            header_sub: 'Transparent process · Professional results ✦ Bring your character to life',
            nav_intro: 'About', nav_artists: 'Artists',
            nav_commission: 'Commission', nav_rules: 'Terms & Process',
            nav_core: 'V-Skin Design', nav_anim: 'Animation Design',
            nav_template: 'Template Collab',
            nav_creative: 'Creative', nav_portfolio: 'Portfolio',
            nav_channels: 'Channels', nav_fanart: 'Fan Art',
            intro_role: 'Freelance Live2D Rigger · Instructor',
            intro_bio: "Rigging Live2D models since 2021 — commercially and as a real-world instructor. With over 1,000 commissions completed, I love connecting with fellow creators on X and sharing what I learn. Detail-obsessed and always excited to collaborate with illustrators to give flat art a life of its own.",
            intro_education: 'Education', intro_achievements: 'Achievements',
            intro_services_title: 'What I Offer',
            svc_live2d: 'V-Skin Design', svc_live2d_desc: 'VTuber model rigging with face tracking and mouse-follow support.',
            svc_anim: 'Animation Design', svc_anim_desc: 'Animated logos, stickers, PVs, and game CG animations.',
            svc_consult: 'Live2D Consulting', svc_consult_desc: 'Advice and help setting up VTubeStudio & OBS for streaming.',
            svc_project: 'Source File Add-on', svc_project_desc: 'Option to purchase the original project files after your commission.',
            collab_title: 'End-to-End Character Service',
            collab_desc: "I don't illustrate myself, but I work closely with a roster of talented artists. From character design all the way to finished rigging — simple or highly detailed — we've got you covered.",
            collab_point1: 'Multiple art styles available — tailored to you',
            collab_point2: 'Smooth communication, flexible workflow',
            collab_btn: 'Meet the Artists',
            comm_open: 'Open for Commissions', comm_closed: 'Commissions Closed',
            live_on: 'Live on Twitch!', live_off: 'Not streaming',
            artists_title: 'Collaborating Artists',
            artists_subtitle: 'A lineup of talented illustrators ready to help bring your vision to life.',
            artists_apply_label: 'Artist Applications', artists_apply_btn: 'Apply to Collaborate',
            artists_apply_notice: 'This application is for building a collaborator roster, not a job offer or employment. HakkaNeko will reach out to suitable artists based on style and scheduling needs.',
            form_email: 'Your Google email', form_note: 'Character notes / comments',
            rules_contact_title: 'Contact & Availability',
            rules_contact_desc: 'Slots are limited — check the Google schedule sheet or DM me to ask about availability!',
            rules_schedule_btn: 'Check Schedule',
            rules_process_title: 'Commission Process',
            rules_terms_title: 'Terms & Copyright',
            rules_terms_notice: 'By submitting a commission, you confirm you have read and agreed to all terms below.',
            rules_s1: '1. Who Can Commission', rules_s2: '2. Cancellations & Refunds',
            rules_s3: '3. Timeline & Delivery', rules_s4: '4. Usage Rights',
            rules_s5: '5. Prohibited Actions & Penalties', rules_s6: '6. Copyright Notice',
            rules_step1_title: '1. Fill Out the Form', rules_step1_desc: 'Fill out the commission form with your requirements and preferences — the more details you include, the more accurate the quote.',
            rules_step2_title: '2. Layer Review', rules_step2_desc: 'Sharing the full PSD allows for a more accurate quote. Without it, only a rough estimate is possible.',
            rules_step3_title: '3. Discuss the Details', rules_step3_desc: "We'll go over your requirements and expectations together to make sure we're on the same page.",
            rules_step4_title: '4. Pay the Deposit', rules_step4_desc: 'Once confirmed, a deposit is required to kick things off.',
            rules_step5_title: '5. Review & Revisions', rules_step5_desc: '3 revision rounds included (mistakes corrected for free). Additional or major changes beyond that incur extra fees.',
            rules_step6_title: '6. Final Payment & Delivery', rules_step6_desc: 'Pay the remaining balance and receive your final files (moc3, etc.). Source files are available as an add-on.',
            rules_s1_body: "Clients must be 18 or older. Any legal disputes resulting from false age information are the sole responsibility of the client. This is an individual freelance operation — no agency liability applies.",
            rules_s2_li1: "Client-initiated cancellation: the deposit is non-refundable and any work completed to that point must be compensated.",
            rules_s2_li2: "No response within 3 business days during the revision stage will prompt a follow-up. If 5 consecutive business days pass with no reply, the commission is considered abandoned.",
            rules_s2_li3: "If I cancel due to circumstances beyond my control, a full refund will be issued.",
            rules_s2_pause_label: 'Pause / Delay Request:',
            rules_s2_pause_body: "If you temporarily can't respond, please let me know in advance via email or X DM. We can agree to pause and resume when you're ready — no impact on fees already paid.",
            rules_s3_li1: 'Commercial Use — All quotes include a commercial use license. No extra fee required.',
            rules_s3_li2: 'Delivery Time — Standard projects take about 4–8 weeks, adjusted for complexity and queue.',
            rules_s3_li3: "Queue Status — Check the Schedule link at the top of the page, or message me directly to ask about openings.",
            rules_s3_li4: 'File Retention — Project files are kept for 4 months. Retrieval after that requires full repayment.',
            rules_s4_li1: 'Credit Required — All public use must credit: "Live2D Rigging: HakkaNeko".',
            rules_s4_li2: "Portfolio Display — I reserve the right to include the finished model in my portfolio and promotional materials (unless the buyout plan is selected).",
            rules_s4_li3: 'Buyout Terms — Source file buyout is priced at 1.5× the total. Resale or false authorship claims are prohibited.',
            rules_s5_intro: 'The following actions will result in immediate revocation of all licenses and potential legal action:',
            rules_s5_li1: 'Reselling, transferring, or providing the finished model for third-party commercial use.',
            rules_s5_li2: "Removing or falsifying the rigger's credit.",
            rules_s5_li3: 'Selling the model after unauthorized modifications.',
            rules_s5_penalty: 'Violators are liable for 3× the original price as damages, plus any legal costs incurred.',
            rules_s6_intro: 'I (HakkaNeko) operate as an independent creator. All works are protected under the ROC Copyright Act and DMCA.',
            rules_s6_li1: 'Infringement — Any unauthorized use found on any platform will be met with a DMCA takedown request and potential legal action.',
            rules_s6_li2: 'Model Protection — Live2D project files are my intellectual property. Decompiling or unauthorized unpacking constitutes infringement.',
            rules_s6_li3: 'Disclaimer — These are personal commission terms. Questions are welcome. Final interpretation is reserved by me.',
            rules_s6_footer: '※ These terms are set by HakkaNeko as an individual creator and do not represent any organization ※',
            faq_title: 'FAQ',
            faq_q1: 'How long does a Live2D model typically take to complete?', faq_a1: "It depends on the plan and current queue, but most Live2D models take around 4–8 weeks. Animation commissions vary by complexity. Check the schedule sheet or ask directly for an accurate estimate.",
            faq_q2: 'How many revisions are included? What happens if I go over?', faq_a2: "3 revisions are included in the confirmation stage. Mistakes on my end are fixed for free and don't count. Beyond 3 revisions, or for major structural changes, additional fees apply based on the scope of work.",
            faq_q3: 'Can I commission without a pre-split PSD?', faq_a3: "Yes, but only a rough estimate can be given until the full PSD is received. You can also ask about partnered illustrators who can help with layer separation.",
            faq_q4: 'Can companies or VTuber groups commission projects?', faq_a4: "Absolutely. For business or group collaborations, please fill out the commission form and describe the nature and scale in the notes — I'll prioritize replying.",
            faq_q5: 'What payment methods are available? Can I pay in installments?', faq_a5: "Taiwan bank transfer, PayPal (with processing fee), and ECPay are supported. Payment defaults to a 50% deposit and 50% final payment. Installments are also available: 2-part (+3% total) or 3-part (+5% total).",
            faq_q6: 'What rights do I have after the commission is complete?', faq_a6: "You receive a personal use license — for streaming, videos, and personal activities. Public use requires crediting the rigger. The project source files require a separate buyout purchase; once bought, you may not resell or claim self-made.",
            plan_basic: 'Standard Plan', plan_basic_sub: 'Key head motions + basic body movement.',
            plan_basic_tip: '📦 Standard Plan Includes',
            plan_basic_i1: '・Head motion (shake, nod)', plan_basic_i2: '・Eye blink / tracking',
            plan_basic_i3: '・Mouth shape (open/close)', plan_basic_i4: '・Simple body sway',
            plan_basic_i5: '・Breathing physics', plan_basic_note: '※ Perfect for tighter budgets or simpler styles',
            plan_pro: 'Professional Plan', plan_pro_sub: 'Full head & body motion + solid physics.',
            plan_pro_tip: '📦 Professional Plan Includes',
            plan_pro_i1: '・Everything in Standard', plan_pro_i2: '・Hair / accessory physics',
            plan_pro_i3: '・Full body motion (incl. waist)', plan_pro_i4: '・Basic hand movement',
            plan_pro_i5: '・Physics collision tuning', plan_pro_note: '※ The most popular choice',
            plan_adv: 'Top-tier Plan', plan_adv_sub: 'Full-body high-fidelity motion, premium physics, no compromises.',
            plan_adv_tip: '📦 Top-tier Plan Includes',
            plan_adv_i1: '・Everything in Professional', plan_adv_i2: '・High-fidelity full-body motion',
            plan_adv_i3: '・Advanced physics / multi-layer collision', plan_adv_i4: '・Per-accessory independent physics',
            plan_adv_i5: '・Face tracking expression tuning', plan_adv_note: '※ For those who want the very best',
            plan_hover_tip: 'Hover over a plan to see what is included',
            plan_compare_title: 'Plan Spec Comparison',
            plan_compare_hint: '(click to expand)', plan_compare_hint_open: '(click to collapse)',
            plan_compare_col_item: 'Spec',
            plan_compare_face: 'Face Tracking', plan_compare_face_basic: 'Basic 9-axis', plan_compare_face_pro: 'XYZ Wide Range', plan_compare_face_top: 'Full Precision Tracking',
            plan_compare_mouth: 'Mouth Motion', plan_compare_mouth_basic: 'Basic mouth', plan_compare_mouth_pro: 'Advanced mouth', plan_compare_mouth_pro_sub: 'incl. special phonemes', plan_compare_mouth_top: 'Premium full mouth', plan_compare_mouth_top_sub: 'incl. tongue / detail',
            plan_compare_physics: 'Physics', plan_compare_physics_basic: 'Basic physics', plan_compare_physics_pro: 'Complex physics', plan_compare_physics_pro_sub: 'multi-layer / long hair', plan_compare_physics_top: 'Premium physics', plan_compare_physics_top_sub: 'collisions / fine dynamics',
            plan_compare_fx: 'Special Effects', plan_compare_fx_addon: '＋ Add-on only', plan_compare_fx_top: '✦ Included',
            plan_compare_price: 'Starting at', plan_compare_note: 'Prices are starting points; final quote depends on complexity and layer count',
            core_s1: 'Choose a Plan', core_s2: 'Expressions & Accessories',
            core_s3: 'Motion & Effects', core_s4: 'Special Requests', core_s5: 'Checkout & Settings',
            anim_s1: 'Animation Type', anim_s2: 'Details',
            pay_method: 'Payment Method', pay_installment: 'Installment Plan',
            disclaimer_title: '📋 Estimates Are for Reference Only',
            disclaimer_core: 'Prices shown are preliminary estimates. The final quote depends on layer count, complexity, and additional requirements. Share the full PSD before commissioning for the most accurate price.',
            disclaimer_anim: 'Prices shown are preliminary estimates. The final quote depends on asset layer count, structure, and complexity. Share your complete assets before commissioning for accuracy.',
            opt_tongue: 'Tongue Expression', opt_tongue_desc: 'Extra expression activated via expression toggle.',
            opt_ear: 'Animal Ears', opt_ear_desc: 'Dynamic ear sway with spring physics.',
            opt_tail: 'Tail', opt_tail_desc: 'Swinging tail with physics linkage.',
            opt_vowel: 'Lip Sync (AIUEO)', opt_vowel_desc: '5 vowel mouth shapes for use with voice software.',
            opt_expr: 'Extra Expressions', opt_expr_desc: 'Additional expressions beyond the base set (crying, surprised, etc.).',
            opt_acc: 'Accessory Toggle', opt_acc_desc: 'Switchable accessories: glasses, hat, props, etc.',
            opt_hair: 'Hairstyle Variants', opt_hair_desc: 'Alternate hairstyles or lengths, with physics.',
            opt_clothes: 'Outfit Variants', opt_clothes_desc: 'Full costume swap with dynamic cloth and accessory adjustments.',
            opt_gesture: 'Gesture Animations', opt_gesture_desc: 'Triggered interactions: waving, heart pose, etc.',
            opt_pose: 'Body Pose Switch', opt_pose_desc: 'One-click switching between poses: sitting, standing, etc.',
            opt_fx: 'Visual Effects', opt_fx_desc: 'Glow, particles, sparkle and other effects.',
            opt_tracking: 'Tracking Loss Animation', opt_tracking_desc: "Auto-plays a fallback idle when face tracking is lost — no more frozen models.",
            opt_chibi: 'Chibi Mode', opt_chibi_desc: 'Reduced proportions for a cute chibi look. Requires re-layering.',
            opt_vbridger: 'VBridger Support', opt_vbridger_desc: 'Compatible with iPhone face tracking plugin for significantly better accuracy.',
            opt_project: 'Source File Add-on', opt_project_desc: 'Purchase the original project files (excludes installment/rush fees)',
            opt_project_mult: '+ Total × 1.5',
            opt_project_note: 'Includes the original Live2D Cubism project file. Personal modification allowed. Transfer or resale is prohibited.',
            opt_rush: 'Rush Order',
            opt_rush_desc1: 'Rush fee is determined by how close the deadline is and how complex the project is. Final amount confirmed by discussion.',
            opt_rush_desc2: 'Deadline within 14 days: high-priority rush. Starts at NT$ 3,500+.',
            opt_rush_desc3: 'Deadline 14–30 days away: standard rush. Fee adjusted by workload.',
            opt_rush_desc4: 'No major revision requests during rush. Please finalize your design before commissioning.',
            opt_supplement: 'Additional Notes',
            anim_type_sticker: 'Animated Sticker', anim_type_sticker_desc: 'Great for emoji, small props, and lightweight animation needs.',
            anim_type_process: 'Animation Production', anim_type_process_desc: 'For large-scale performances, music videos, and full scene animations.',
            opt_anim_rush_desc1: 'Rush fee depends on complexity and deadline. Final amount confirmed by discussion.',
            opt_anim_rush_desc2: 'Animated sticker rush: starts at NT$ 1,000. Extra charge for delivery within 10 days.',
            opt_anim_rush_desc3: 'Animation production rush: starts at NT$ 2,000+ depending on length and scene count.',
            opt_anim_rush_desc4: 'Script and storyboard are locked once rush is confirmed. Have your assets ready beforehand.',
            field_qty: 'Quantity', field_physics: 'Physics Detail Level',
            field_duration: 'Duration (seconds)', field_chars: 'Number of Characters',
            field_performance: 'Includes Performance Design (+NT$ 1,000)',
            field_bg: 'Includes Background Animation (+NT$ 500)',
            field_bg_note: '※ Final cost may vary — complex scenes may require a separate quote',
            physics_normal: 'Standard', physics_high_200: 'High Detail (+NT$ 200)',
            physics_high_1000: 'High Detail (+NT$ 1,000)', physics_ultra: 'Ultra Detail (+NT$ 2,000)',
            rush_ph: 'Describe your deadline and reason for the rush — e.g. event date, stream premiere…',
            supp_ph_core: 'e.g. specific motions you want, reference image links…',
            rush_ph_anim: 'Describe the deadline, event name, or intended use for the rush order…',
            supp_ph_anim: 'e.g. a specific dance style, video reference links…',
            unit_each: 'pc', unit_set: 'set', unit_outfit: 'outfit',
            pay_bank: 'Bank Transfer', pay_fee: 'Processing fee', pay_foreign: '✦ Foreign currency accepted',
            pay_ecpay: 'ECPay / Convenience Store',
            pay_one: 'Pay in Full', pay_two: '2 Installments', pay_two_note: '+3% total',
            pay_three: '3 Installments', pay_three_note: '+5% total',
            sidebar_total: 'Estimated Total', sidebar_breakdown: 'Quote Breakdown', sidebar_reset: 'Reset',
            sidebar_rush_label: 'Rush Order Details', sidebar_supp_label: 'Additional Notes',
            sidebar_agree: 'I have read and agree to all the Terms & Process.',
            sidebar_screenshot: 'Save Screenshot',
            sidebar_copy_summary: 'Copy Commission Summary',
            sidebar_rules_link: 'View Terms & Commission Guidelines',
            sidebar_port_btn: 'Browse Portfolio for Reference', sidebar_send_btn: 'Fill Out Request Form',
            sidebar_delivery_toggle: 'View Delivery Format Details',
            order_badge_label: 'Commission ID',
            summary_vp_title: 'Live2D V-Skin Design — Commission Summary',
            summary_anim_title: 'Live2D Animation Design — Commission Summary',
            summary_order_id: 'Commission ID',
            summary_order_id_pending: '(Please agree to terms first to generate)',
            summary_plan: 'Plan', summary_addons: 'Add-ons',
            summary_items: 'Items', summary_total: 'Total Budget',
            label_rush_yes: 'Yes / Rush', label_no: 'No', label_none: 'None',
            del_moc3: '— Main runtime file. Works in VTubeStudio and similar apps',
            del_textures: '— All texture files the model needs (PNG)',
            del_physics: '— Physics settings file (hair, accessory movement)',
            del_model3: '— Model descriptor file that links all components together',
            del_expr: '— Expression settings (if extra expressions were added)',
            del_motions: '— Motion data (idle animations, etc.)',
            del_cmo3: '— Only included with the Source File Add-on; kept for 4 months',
            del_cloud: 'All files are delivered as a ZIP archive via Google Drive or another cloud link.',
            del_sticker_cat: '🎞 Animated Stickers', del_mp4_sticker: '— Standard video format with the widest compatibility',
            del_gif: '— GIF format, suitable for sticker platform uploads',
            del_webm_sticker: '— Web-transparent format, ideal for overlaying content',
            del_anim_cat: '🎬 Animation / PV', del_mp4_anim: '— Standard delivery format',
            del_webm_anim: '— Used when a transparent background is needed',
            del_mov: '— For Apple environments or high-quality export needs',
            deposit_label: 'Deposit', balance_label: 'Balance', per_inst_label: 'Per installment',
            port_page_title: 'Portfolio', port_page_desc: "HakkaNeko's Live2D models, animations, stickers and more — always growing.",
            port_vtube_section: 'VTuber Model Showcase', port_card_title: 'HakkaNeko — Original Live2D Model',
            port_yt_btn: 'Watch on YouTube', port_x_btn: 'View on X',
            port_pv_tag: 'PV Production', port_anim_tag: 'Animation', port_perf_tag: 'Live2D Performance',
            port_stickers: 'Animated Stickers', port_logos: 'Animated Logos',
            port_anim_info: 'Animation & Performance Design',
            port_vtag: 'VTuber Model', port_rigger: 'Rigged by', port_coming_soon: 'Coming Soon',
            port_demo_label: 'HakkaNeko — Demo Model (Static)',
            port_demo_note: 'This model is for portfolio display only and is not available for sale.',
            edu_soda1: 'SodaArt Rigging Class — Cohorts 5 & 6', edu_soda2: 'SodaArt Animation Class — Cohorts 2 & 3',
            edu_soda3: 'SodaArt Advanced Skills Class — Cohort 1', edu_link: 'Link',
            ach_juku_title: 'Live2D JUKU Official Showcase', ach_juku_date: 'Date: 2025 / 03 / 26',
            ach_view_btn: 'View Showcase', ach_portfolio_btn: 'See More in the Portfolio',
            intro_click_tip: '👆 Click me!',
            channels_title: 'Recommended Channels', channels_desc: "Channels personally recommended by HakkaNeko — worth checking out!",
            ch_live: 'Live', ch_offline: 'Offline',
            ch_followers: 'followers', ch_subscribers: 'subscribers',
            channels_submit_label: 'Channel Recommendation',
            channels_submit_notice: 'Want your channel listed here? Fill out the form and HakkaNeko will review and get back to you.',
            channels_submit_btn: 'Apply for Recommendation',
            fanart_title: 'Fan Art Gallery', fanart_desc: 'Thank you all for the fan art — every piece means the world to me 💜',
            fanart_chara1: '[HakkaNeko] Character Sheet', fanart_chara2: '[Akemi] Character Sheet (Virtual)',
            char_height: 'Height', char_birthday: 'Birthday', char_gender: 'Gender',
            char_male: 'Male', char_female: 'Female', char_height_unit: 'cm',
            char1_desc: 'An ordinary boy who stumbled into a fantasy world. He can summon the Hacker Panel to make limited edits to reality, and adventures alongside his companion Cat Ball.',
            char2_desc: 'Not much is known — just that she appeared out of nowhere one day as a mysterious special character...?',
            fanart_rules_title: 'Fan Art Guidelines',
            fanart_ban1: '[Not allowed] Graphic gore or NSFW content (unless I have explicitly approved it)',
            fanart_ban2: "[Not allowed] Misrepresenting the characters' design (outfits are fine)",
            fanart_ok: 'All creative fan art is welcome — I will repost anything I see!',
            fanart_tag_label: 'X Tag', fanart_submit_label: 'Submit Fan Art',
            fanart_submit_btn: 'Submit Fan Art',
            fanart_submit_notice: 'By submitting, you agree to allow HakkaNeko to share your work on the website and social media with credit. You may choose to remain anonymous in the form.',
            fanart_treasures: 'My Treasures', fanart_treasures_label: '✦ My Treasures ✦',
            fanart_loading: 'Loading fan art from GitHub…',
            toast_agree: 'Please agree to the terms first',
            toast_copied: 'Copied to clipboard!',
            toast_screenshot_saved: 'Screenshot saved!',
            toast_summary_copied: 'Commission summary copied to clipboard!',
            intro_bubbles: ['Hey! Welcome to my commission page! ✨','Feel free to email me any time!','Rigging is how I bring characters to life! 🐱','Commissions open — come find me!','Making Live2D is what I love most 💜','Thanks for clicking! You are the best! (≧▽≦)','Every character is one of a kind ✦','Check out my X portfolio!'],
            collab_bubbles: ['Hey, stop poking me! I am well-behaved!','I am definitely not hiding anything!','Did you know there is a Konami Code easter egg on this page?','I am always looking for more artists to collaborate with!'],
            badge_loading: 'Loading…', badge_loaded: '✓ Loaded', badge_fail: 'Failed to load',
            github_rate: 'GitHub API rate limit reached — please try again later',
            github_rate_short: 'GitHub rate limit reached',
            github_rate_tip: 'Up to 60 requests per hour. Please wait a moment and try again.',
            error_prefix: 'Error: ',
            name_brand: 'HakkaNeko', name_display: 'HakkaNeko', name_short: 'HakkaNeko',
            intro_role_short: 'Live2D Rigger',
            quote_filename: 'HakkaNeko-Quote',
            footer_role: 'Live2D Rigger · Freelance Modeler',
            footer_credit: 'Site conceived by HakkaNeko. UI design and interactions were built with AI assistance, iterated, and personally reviewed before publishing.',
            kofi_btn: 'Buy Me a Coffee', kofi_supporters_empty: 'Be the first supporter!',
            // ── Template Collab ──
            tmpl_title: 'Template Collab Commission', tmpl_desc: 'Personalize a pre-built Live2D template with custom outfit designs — the most cost-effective way to debut your VTuber look.',
            tmpl_disclaimer_title: '📋 Estimates are for reference only', tmpl_disclaimer_body: "Prices shown are initial estimates. Final quotes depend on outfit count, customization complexity, and the rigger's current schedule.",
            tmpl_s1_title: 'Choose Template', tmpl_s2_title: 'Outfit Selection', tmpl_s3_title: 'Hair Adjustments', tmpl_s4_title: 'Accessories & Expressions', tmpl_s5_title: 'Additional Notes',
            tmpl_s2_hint: 'First outfit NT$ 1,000, each additional +NT$ 400. Click image to select, multi-select allowed.',
            tmpl_card_kanso_name: 'Dress-Up Doll (Cánguāng)', tmpl_card_kanso_desc: "Pre-rigged Live2D template — just swap in your outfit artwork and you're ready to go.", tmpl_card_kanso_price: 'From NT$ 1,000',
            tmpl_card_more_name: 'More Templates', tmpl_card_more_soon: 'Coming Soon',
            tmpl_card_chanye_name: 'Long Night Moon Sway (Wiffee)', tmpl_card_chanye_desc: 'A night-themed collab template featuring Wiffee\'s signature style, ideal for darker character designs.', tmpl_card_chanye_price: 'NT$ 2,000 / piece',
            tmpl_chanye_qty_label: 'Long Night Moon Sway Qty', tmpl_chanye_qty_desc: 'Each piece is a separate commission. Please confirm the quantity.',
            tmpl_chanye_s2_title: 'Template Preview', tmpl_chanye_s2_hint: 'Reference previews for the Long Night Moon Sway collab template.',
            tmpl_chanye_s3_title: 'Quantity Needed', tmpl_chanye_qty_unit: 'piece(s)', tmpl_chanye_qty_detail: 'Long Night Moon Sway',
            tmpl_collab_artist: 'Collab Artist',
            tmpl_selected_pre: 'Selected', tmpl_selected_suf: 'outfit(s)',
            tmpl_hair_bang: 'Modify bangs / back hair', tmpl_hair_bang_price: '+ NT$ 150 / piece', tmpl_hair_bang_desc: 'Minor edits to the existing hairstyle, such as bang shape or hair length.',
            tmpl_hair_full: 'Completely new hairstyle', tmpl_hair_full_price: '+ NT$ 300 / piece', tmpl_hair_full_desc: 'A brand-new hair design, structurally different from the original.',
            tmpl_acc_label: 'Toggle-able Prop / Accessory', tmpl_acc_price: '+ NT$ 100 / piece', tmpl_acc_desc: 'Glasses, bouquets, staffs, and other on/off accessories.',
            tmpl_expr_label: 'Simple Expression Tweak', tmpl_expr_price: '+ NT$ 100 / piece', tmpl_expr_desc: 'Minor tweaks to existing expressions — eyebrow shape, gaze, etc.',
            tmpl_acc_input_label: 'Accessory Details', tmpl_acc_input_hint: '(Please describe each accessory in detail)',
            tmpl_acc_ph: 'e.g. black-rimmed glasses, a rose bouquet, a wizard staff... (describe shape & style)',
            tmpl_supp_ph: 'Character lore, outfit reference links, special requests, deadline, etc...',
            tmpl_acc_summary_label: 'Accessory Request',
            tmpl_deposit_label: 'Deposit (50%)',
            tmpl_detail_outfit: 'Template Outfits', tmpl_detail_suit: 'set(s)', tmpl_detail_empty: 'No items selected yet',
            tmpl_copy_header: 'Commission Summary', tmpl_copy_type: 'Template Type', tmpl_copy_outfits: 'Outfits', tmpl_copy_none: '(none selected)',
            tmpl_copy_acc: 'Accessory Request', tmpl_copy_supp: 'Additional Notes', tmpl_copy_note: 'Preliminary estimate — final price confirmed after discussion',
            tmpl_form_note: 'Once the estimate looks good, fill out the commission form to get started.',
        },
        'ja': {
            langFlag: 'jp', langCode: 'JP', htmlLang: 'ja',
            header_title: ' の Live2D 制作',
            header_sub: 'わかりやすい流れ · プロの仕事 ✦ あなたのキャラに命を吹き込もう',
            nav_intro: '自己紹介', nav_artists: 'コラボ絵師',
            nav_commission: 'ご依頼について', nav_rules: 'フローと規約',
            nav_core: 'V皮デザイン', nav_anim: 'アニメーション制作',
            nav_template: 'テンプレコラボ',
            nav_creative: 'クリエイティブ', nav_portfolio: 'ポートフォリオ',
            nav_channels: 'おすすめチャンネル', nav_fanart: 'ファンアート',
            intro_role: 'フリーランス Live2D モデラー · 講師',
            intro_bio: '2021年からLive2Dモデリングを本格的に始め、商業依頼をこなしながら現実でも講師を務めています。累計 1,000 件以上の依頼を完了し、X でクリエイター仲間と交流するのが好きです。細部へのこだわりと創造力を活かして、さまざまな絵師さんと一緒にキャラクターを動かしていきたいと思っています。',
            intro_education: '受講歴', intro_achievements: '実績・受賞',
            intro_services_title: '提供サービス',
            svc_live2d: 'V皮デザイン', svc_live2d_desc: 'VTuberモデルのモデリング。顔認識・マウス追従対応。',
            svc_anim: 'アニメーション制作 (動畫設計)', svc_anim_desc: '動くロゴ・スタンプ・PV・ゲームCGアニメーションの制作。',
            svc_consult: 'Live2D サポート・相談', svc_consult_desc: '使い方の相談や、VTubeStudio・OBSの配信環境セットアップをお手伝いします。',
            svc_project: 'プロジェクトファイル購入', svc_project_desc: '依頼完了後、制作ファイルの買い取りオプションあり（単体販売は不可）。',
            collab_title: 'キャラデザからモデリングまでまるごとお任せ',
            collab_desc: '私自身はイラストを描きませんが、複数の絵師さんと長くパートナーシップを組んでいます。キャラクターデザインからモデリング完成まで、ワンストップでお任せください。シンプルも細密も対応します。',
            collab_point1: '多彩な画風から選べるオーダーメイド対応',
            collab_point2: 'スムーズなやりとり、柔軟に対応します',
            collab_btn: 'コラボ絵師を見てみる',
            comm_open: '依頼受付中', comm_closed: '現在受付停止中',
            live_on: 'Twitchで配信中！', live_off: 'オフライン',
            artists_title: 'コラボ絵師一覧',
            artists_subtitle: '素敵な絵師さんたちと一緒に、あなたのキャラクターを最高の形で仕上げます。',
            artists_apply_label: 'コラボ申請', artists_apply_btn: 'コラボ絵師に応募する',
            artists_apply_notice: 'この申請はコラボ絵師のリスト作成を目的とするものであり、雇用や仕事のオファーではありません。HakkaNeko はスタイルとスケジュールに応じて適切な絵師に直接連絡します。',
            form_email: 'Googleメールアドレス', form_note: 'キャラクターのメモ / 補足',
            rules_contact_title: '連絡先と受付状況',
            rules_contact_desc: '枠に限りがあるので、Googleスプレッドシートで空き状況を確認するか、気軽にDMで聞いてね！',
            rules_schedule_btn: '受付状況を確認',
            rules_process_title: '依頼の流れ',
            rules_terms_title: '依頼規約と著作権について',
            rules_terms_notice: '依頼を送った時点で、以下の規約を全て読んで同意したものとみなします。',
            rules_s1: '1. 依頼できる方', rules_s2: '2. キャンセルと返金',
            rules_s3: '3. 制作期間と納期', rules_s4: '4. 使用権について',
            rules_s5: '5. 禁止事項と違約について', rules_s6: '6. 著作権について',
            rules_step1_title: '1. 依頼フォームに記入', rules_step1_desc: 'コラボ申込フォームに依頼内容や希望を記入してください。詳しく書いてもらうほど正確な見積もりができます。',
            rules_step2_title: '2. レイヤー構成の確認', rules_step2_desc: '完成PSDを共有してもらえると、より正確な見積もりができます。ない場合は参考価格になります。',
            rules_step3_title: '3. 詳細のすり合わせ', rules_step3_desc: '要望や仕上がりのイメージを一緒に確認します。',
            rules_step4_title: '4. 頭金のお支払い', rules_step4_desc: '依頼確定後、頭金をお支払いいただくと制作スタートです。',
            rules_step5_title: '5. 確認・修正フェーズ', rules_step5_desc: '修正は3回まで対応します（ミスによる修正は無料）。それ以上や大きな変更は追加料金になります。',
            rules_step6_title: '6. 残金のお支払いと納品', rules_step6_desc: '完成後に残金をお支払いいただき、最終ファイル（moc3など）を納品します。プロジェクトファイルは別途オプションです。',
            rules_s1_body: '依頼者は18歳以上である必要があります。虚偽の年齢情報によるトラブルは依頼者の責任となります（個人として受注しています）。',
            rules_s2_li1: '依頼者からのキャンセル：頭金は返金されず、制作済み分の費用をご負担いただきます。',
            rules_s2_li2: '修正確認フェーズで3営業日以内に返信がない場合は再連絡します。5営業日連続で返信がない場合は放棄とみなします。',
            rules_s2_li3: 'やむを得ない事情で私がキャンセルする場合は、全額返金します。',
            rules_s2_pause_label: '一時停止 / 延期の申し出：',
            rules_s2_pause_body: '個人的な事情で一時的に連絡が取れない場合は、事前にメールか X の DM で教えてください。制作を一時停止して、準備ができてから再開できます。すでにお支払いいただいた費用には影響しません。',
            rules_s3_li1: '商用ライセンス込み — すべての見積もりに商用利用のライセンスが含まれています。追加費用は不要です。',
            rules_s3_li2: '納期の目安 — 一般的な依頼は約4〜8週間です。内容の複雑さや受付状況により変わります。',
            rules_s3_li3: '受付状況の確認 — ページ上部の「受付状況を確認」からチェックするか、直接DM・メールで聞いてください。',
            rules_s3_li4: 'ファイルの保管期間 — 制作ファイルは4ヶ月間保管します。期限を過ぎた場合は全額再支払いが必要です。',
            rules_s4_li1: 'クレジット表記 — 公開利用の際は「Live2D モデリング：HakkaNeko」と明記してください。',
            rules_s4_li2: '作品掲載 — 完成した作品をポートフォリオや宣伝素材に掲載する権利を保有します（買い取りプランを除く）。',
            rules_s4_li3: '買い取り規約 — ファイルの買い取りは合計金額の1.5倍です。転売や自作と偽ることは禁止です。',
            rules_s5_intro: '次の行為が見つかった場合、すべての使用権を即座に取り消し、法的措置を取ります：',
            rules_s5_li1: '完成作品の転売・転渡、または第三者への商用提供。',
            rules_s5_li2: 'モデラーのクレジット情報の削除や偽造。', rules_s5_li3: '無断で修正した作品の販売。',
            rules_s5_penalty: '違反した場合、元の金額の3倍の違約金と発生した法的費用を負担していただきます。',
            rules_s6_intro: '私（HakkaNeko）は個人クリエイターとしてサービスを提供しています。すべての作品はROC著作権法およびDMCAにより保護されています。',
            rules_s6_li1: '侵害への対応 — どのプラットフォームでも無断使用が確認された場合、DMCAに基づき削除を申請し、必要に応じて法的措置を取ります。',
            rules_s6_li2: 'モデルの保護 — Live2Dのプロジェクトファイルは私の知的財産です。逆コンパイルや無断の展開は侵害になります。',
            rules_s6_li3: '個人規約について — これらは個人の依頼規約です。疑問があれば気軽に連絡してください。最終的な判断は私が持ちます。',
            rules_s6_footer: '※ この規約はHakkaNekoが個人として定めたものです。いかなる組織も代表していません ※',
            faq_title: 'よくある質問 FAQ',
            faq_q1: 'Live2Dモデルの完成までどのくらいかかりますか？', faq_a1: 'プランや現在の予約状況によりますが、通常 4～8 週間ほどです。アニメーション系の依頼は内容によって異なります。スケジュール表を確認するか、直接お問い合わせください。',
            faq_q2: '修正は何回できますか？超えた場合はどうなりますか？', faq_a2: '確認段階で 3 回の修正が含まれます。制作ミスによる修正は無料で回数にカウントされません。3 回を超える場合や大幅な変更は別途費用が発生します。',
            faq_q3: 'PSDの分割なしで依頼できますか？', faq_a3: '可能ですが、完全な PSD を受け取るまでは参考見積もりのみとなります。レイヤー分割を担当できる提携イラストレーターについてもご相談いただけます。',
            faq_q4: '企業やVTuberグループからの依頼は可能ですか？', faq_a4: 'もちろんです。企業・グループ案件はコラボ申込フォームにご記入いただき、備考欄に内容と規模をご記載ください。優先的にご返答いたします。',
            faq_q5: '支払い方法は？分割払いはできますか？', faq_a5: '台湾銀行振込・PayPal（手数料あり）・ECPay に対応しています。通常は頭金 50%・残金 50% の2段階払いです。分割払いも選択可能で、2回払い（+3%）または3回払い（+5%）があります。',
            faq_q6: '納品後の使用権はどうなりますか？', faq_a6: '納品後は個人使用ライセンスが付与され、配信・動画などの個人活動に使用できます。公開時はリガーのクレジット表記が必要です。プロジェクトファイルは別途買取オプションが必要で、買取後の転売・自作申告は禁止です。',
            plan_basic: 'スタンダードプラン', plan_basic_sub: '頭部の主要動作＋シンプルな体の動き。',
            plan_basic_tip: '📦 スタンダードプランの内容',
            plan_basic_i1: '・頭の動き（横・縦ふり）', plan_basic_i2: '・まばたき・目追従',
            plan_basic_i3: '・口パク（開閉）', plan_basic_i4: '・シンプルな体の揺れ',
            plan_basic_i5: '・呼吸の物理演算', plan_basic_note: '※ 予算を抑えたい方・シンプルなスタイルの方におすすめ',
            plan_pro: 'プロフェッショナルプラン', plan_pro_sub: '頭と体の本格的な動作＋しっかりした物理演算。',
            plan_pro_tip: '📦 プロフェッショナルプランの内容',
            plan_pro_i1: '・スタンダードの全内容', plan_pro_i2: '・髪・アクセサリーの物理揺れ',
            plan_pro_i3: '・体の本格動作（腰まで）', plan_pro_i4: '・手の基本動作',
            plan_pro_i5: '・物理コリジョンの調整', plan_pro_note: '※ 一番人気のプランです',
            plan_adv: 'プレミアムプラン', plan_adv_sub: '全身の高精度動作・本格物理・妥協なしの仕上がり。',
            plan_adv_tip: '📦 プレミアムプランの内容',
            plan_adv_i1: '・プロフェッショナルの全内容', plan_adv_i2: '・全身の高精度モーション',
            plan_adv_i3: '・本格物理・多層コリジョン', plan_adv_i4: '・細かいパーツの個別物理',
            plan_adv_i5: '・顔認識の表情チューニング', plan_adv_note: '※ とことん品質にこだわりたい方へ',
            plan_hover_tip: 'カードにマウスを乗せると詳細が表示されます',
            plan_compare_title: 'プラン仕様比較表',
            plan_compare_hint: '（クリックで展開）', plan_compare_hint_open: '（クリックで閉じる）',
            plan_compare_col_item: '項目',
            plan_compare_face: 'フェイストラッキング', plan_compare_face_basic: '基本9軸', plan_compare_face_pro: 'XYZ 大幅度', plan_compare_face_top: '全機能精細トラッキング',
            plan_compare_mouth: '口の動き', plan_compare_mouth_basic: '基本口型', plan_compare_mouth_pro: '高度な口型', plan_compare_mouth_pro_sub: '特殊発音含む', plan_compare_mouth_top: 'プレミアム口型', plan_compare_mouth_top_sub: '舌・細部含む',
            plan_compare_physics: '物理揺れ', plan_compare_physics_basic: '基本物理', plan_compare_physics_pro: '複雑な物理', plan_compare_physics_pro_sub: '多層衣装・ロング髪', plan_compare_physics_top: 'プレミアム物理', plan_compare_physics_top_sub: '物理衝突・精細動作',
            plan_compare_fx: 'エフェクトアニメ', plan_compare_fx_addon: '＋ 別途追加', plan_compare_fx_top: '✦ 基本エフェクト込み',
            plan_compare_price: '開始価格', plan_compare_note: '上記は参考価格です。最終価格はイラストの複雑さとレイヤー数によって異なります',
            core_s1: 'プランを選ぶ', core_s2: '表情と小道具', core_s3: 'モーションとエフェクト',
            core_s4: '特別なご要望', core_s5: 'お支払いと詳細',
            anim_s1: 'アニメの種類を選ぶ', anim_s2: '詳細設定',
            pay_method: 'お支払い方法', pay_installment: '分割払いについて',
            disclaimer_title: '📋 この価格はあくまで目安です',
            disclaimer_core: 'ここに表示されている金額は参考価格です。実際の金額はレイヤー数・複雑さ・追加要望によって変わります。依頼前に完成PSDを共有してもらえると、より正確な見積もりができます。',
            disclaimer_anim: 'ここに表示されている金額は参考価格です。実際の金額は素材のレイヤー数・構成・複雑さによって変わります。依頼前に素材を共有してもらえると、より正確な見積もりができます。',
            opt_tongue: '舌出し表情', opt_tongue_desc: '表情スイッチで切り替える追加表情です。',
            opt_ear: 'けもの耳', opt_ear_desc: 'バネ物理つきで動く耳です。',
            opt_tail: 'しっぽ', opt_tail_desc: '物理連動でゆらゆら揺れるしっぽです。',
            opt_vowel: 'リップシンク (AIUEO)', opt_vowel_desc: '5つの母音口形。音声ソフトと組み合わせて使います。',
            opt_expr: '表情バリエーション追加', opt_expr_desc: 'ベース表情以外の追加切り替えです（泣き・驚きなど）。',
            opt_acc: '小道具の切り替え', opt_acc_desc: 'メガネ・帽子・アイテムなどのON/OFF切り替えです。',
            opt_hair: 'ヘアスタイルバリエーション', opt_hair_desc: '別の髪型や長さへの切り替えです。物理演算つき。',
            opt_clothes: '衣装バリエーション', opt_clothes_desc: '衣装まるごと切り替え。布の揺れや配件も一緒に調整します。',
            opt_gesture: 'ジェスチャーアニメ', opt_gesture_desc: '手を振る・ハートポーズなど、トリガー式のインタラクションです。',
            opt_pose: 'ポーズ切り替え', opt_pose_desc: '座り・立ちなどのポーズをワンタップで切り替えられます。',
            opt_fx: 'ビジュアルエフェクト', opt_fx_desc: 'グロー・パーティクル・キラキラなどのエフェクトです。',
            opt_tracking: 'トラッキングロスアニメ', opt_tracking_desc: '顔認識が切れたときに自動で待機アニメを再生します。モデルが固まるのを防ぎます。',
            opt_chibi: 'ちびキャラ化', opt_chibi_desc: '頭身を縮めてかわいいちびスタイルに。レイヤーの再分けが必要です。',
            opt_vbridger: 'VBridger 対応', opt_vbridger_desc: 'iPhoneの顔認識プラグインに対応します。追跡の精度がぐっと上がります。',
            opt_project: 'プロジェクトファイル追加', opt_project_desc: '制作ファイルの買い取りオプション（分割払い・加急費用は含まない合計金額）',
            opt_project_mult: '+ 合計金額 × 1.5',
            opt_project_note: 'Live2D Cubismのプロジェクトファイルが含まれます。個人利用に限り自由に編集できます。転売・転渡は禁止です。',
            opt_rush: '急ぎ対応',
            opt_rush_desc1: '加急費は締め切りまでの日数と作業の複雑さで決まります。最終金額は話し合いで確認します。',
            opt_rush_desc2: '締め切りが14日以内：高緊急扱いで、NT$ 3,500以上からになります。',
            opt_rush_desc3: '締め切りが14〜30日先：通常の急ぎ対応で、作業量に応じて調整します。',
            opt_rush_desc4: '急ぎ対応中は大きな修正はできません。依頼前にデザインを固めておいてください。',
            opt_supplement: '補足・メモ',
            anim_type_sticker: 'アニメーションスタンプ', anim_type_sticker_desc: '絵文字・小物の表示など、軽量なアニメーション向けです。',
            anim_type_process: 'アニメーション制作', anim_type_process_desc: '大きな演出・MVや完全なシーンアニメーションに向いています。',
            opt_anim_rush_desc1: 'アニメの加急費は内容の複雑さと納期によって変わります。最終金額は話し合いで決めます。',
            opt_anim_rush_desc2: 'スタンプ加急：NT$ 1,000〜。10日以内の納品は別途追加料金。',
            opt_anim_rush_desc3: 'アニメーション制作加急：尺と場面の複雑さによってNT$ 2,000以上から。',
            opt_anim_rush_desc4: '急ぎ確認後にスクリプトや絵コンテを大きく変えることはできません。事前に素材を準備しておいてください。',
            field_qty: '数量', field_physics: '物理の細かさ',
            field_duration: 'アニメの長さ（秒）', field_chars: 'キャラクターの人数',
            field_performance: '演出ありにする (+NT$ 1,000)',
            field_bg: '背景アニメーションを追加 (+NT$ 500)',
            field_bg_note: '※ 実際の費用は内容によって変わります。複雑な場面は別途お見積もりになることがあります',
            physics_normal: '標準', physics_high_200: '高精細 (+NT$ 200)',
            physics_high_1000: '高精細 (+NT$ 1,000)', physics_ultra: '超高精細 (+NT$ 2,000)',
            rush_ph: '締め切り日と急ぎの理由を教えてください（例：イベント日・配信初回日など）',
            supp_ph_core: '例：こんな動きを追加したい・参考画像のリンクなど',
            rush_ph_anim: '締め切り日・イベント名・使用目的などを教えてください',
            supp_ph_anim: '例：こんなダンスにしたい・参考動画リンクなど',
            unit_each: '個', unit_set: 'セット', unit_outfit: '衣装',
            pay_bank: '銀行振込', pay_fee: '手数料', pay_foreign: '✦ 外貨でのお支払いも対応',
            pay_ecpay: 'ECPay / コンビニ払い',
            pay_one: '一括払い', pay_two: '2回分割', pay_two_note: '合計 +3%',
            pay_three: '3回分割', pay_three_note: '合計 +5%',
            sidebar_total: '合計見積もり', sidebar_breakdown: '内訳', sidebar_reset: 'リセット',
            sidebar_rush_label: '急ぎ対応の詳細', sidebar_supp_label: '補足メモ',
            sidebar_agree: '「フローと規約」の内容をすべて読んで同意します。',
            sidebar_screenshot: 'スクリーンショット',
            sidebar_copy_summary: '注文内容をコピー',
            sidebar_rules_link: '規約を確認 →',
            sidebar_port_btn: 'ポートフォリオで参考作品を見る',
            sidebar_send_btn: '委託フォームへ進む', sidebar_delivery_toggle: '納品ファイルの詳細を見る',
            order_badge_label: '依頼番号',
            summary_vp_title: 'V皮デザイン 依頼内容',
            summary_anim_title: 'アニメーション制作（動態貼圖/動畫處理） 依頼内容',
            summary_order_id: '依頼番号',
            summary_order_id_pending: '（先に規約に同意してね）',
            summary_plan: 'プラン', summary_addons: '追加オプション',
            summary_items: '依頼内容', summary_total: '合計予算',
            label_rush_yes: 'はい / 急ぎ対応あり', label_no: 'いいえ', label_none: 'なし',
            del_moc3: '— メインの実行ファイル。VTubeStudioなどで使えます',
            del_textures: '— モデルに必要なテクスチャ（PNG）すべて',
            del_physics: '— 物理設定ファイル（髪・アクセサリーの揺れ）',
            del_model3: '— 全パーツのパスをまとめたモデル記述ファイル',
            del_expr: '— 表情切り替えの設定（追加表情がある場合）',
            del_motions: '— モーションデータ（待機アニメーションなど）',
            del_cmo3: '— 「プロジェクトファイル追加」を購入した場合のみ含まれます。4ヶ月間保管します',
            del_cloud: '全ファイルをZIPにまとめて、Google Driveなどのリンクでお届けします。',
            del_sticker_cat: '🎞 動態貼圖 (アニメーションスタンプ)', del_mp4_sticker: '— 一番互換性の高い標準動画フォーマットです',
            del_gif: '— GIF形式。スタンプのアップロードに向いています',
            del_webm_sticker: '— 透過背景のウェブ用フォーマット。重ね合わせに便利です',
            del_anim_cat: '🎬 アニメーション / PV', del_mp4_anim: '— 標準的な納品フォーマットです',
            del_webm_anim: '— 透過背景が必要なときに使います',
            del_mov: '— Appleデバイスや高品質な出力が必要なときに使います',
            deposit_label: '頭金', balance_label: '残金', per_inst_label: '各回',
            port_page_title: 'ポートフォリオ', port_page_desc: 'HakkaNekoのLive2Dモデル・アニメーション・スタンプなど、随時更新中。',
            port_vtube_section: 'VTuberモデル紹介', port_card_title: 'HakkaNeko オリジナル Live2D モデル',
            port_yt_btn: 'YouTubeで見てみる', port_x_btn: 'Xで見る',
            port_pv_tag: 'PV制作', port_anim_tag: 'アニメーション演出', port_perf_tag: 'Live2D演出',
            port_stickers: 'アニメーションスタンプ', port_logos: 'アニメーションロゴ',
            port_anim_info: 'アニメーション・演出デザイン',
            port_vtag: 'VTuberモデル', port_rigger: 'モデリング担当', port_coming_soon: 'もうすぐ公開',
            port_demo_label: 'HakkaNeko デモモデル（固定展示）',
            port_demo_note: 'このモデルはポートフォリオ展示専用です。商業販売はしていません。',
            edu_soda1: 'SodaArt モデリングクラス（5・6期）', edu_soda2: 'SodaArt アニメーションクラス（2・3期）',
            edu_soda3: 'SodaArt 応用スキルクラス（1期）', edu_link: 'リンクはこちら',
            ach_juku_title: 'Live2D JUKU 公式作品展示', ach_juku_date: '掲載日：2025 / 03 / 26',
            ach_view_btn: '展示作品を見る', ach_portfolio_btn: 'ポートフォリオでもっと作品を見る',
            intro_click_tip: '👆 タップしてみて！',
            channels_title: 'おすすめチャンネル', channels_desc: 'HakkaNekoが個人的におすすめするチャンネルです。ぜひ見てみてください！',
            ch_live: '配信中', ch_offline: 'オフライン',
            ch_followers: 'フォロワー', ch_subscribers: '登録者',
            channels_submit_label: 'チャンネル推薦申請',
            channels_submit_notice: 'チャンネルを推薦リストに追加したい方は、申請フォームをご記入ください。審査後にご連絡いたします。',
            channels_submit_btn: '推薦チャンネルを申請',
            fanart_title: 'ファンアートギャラリー', fanart_desc: 'みんなのファンアートありがとう！全部が大切な宝物です 💜',
            fanart_chara1: '【HakkaNeko】キャラクターシート', fanart_chara2: '【阿卡咪】キャラクターシート（バーチャル）',
            char_height: '身長', char_birthday: '誕生日', char_gender: '性別',
            char_male: '男の子', char_female: '女の子', char_height_unit: 'cm',
            char1_desc: 'ファンタジーの世界に迷い込んだ普通の男の子。〈ハッカーパネル〉を召喚して現実を少し変えることができて、相棒の〈ネコボール〉と一緒に冒険しています。',
            char2_desc: '詳しいことはよくわかっていません。ある日突然現れた、謎めいたキャラクターです…？',
            fanart_rules_title: 'ファンアートのルール',
            fanart_ban1: '【禁止】強い流血表現やNSFWコンテンツ（私が許可した場合を除く）',
            fanart_ban2: '【禁止】キャラクターの設定を大きく歪める表現（服装は自由）',
            fanart_ok: 'どんな二次創作も大歓迎です！見つけたらリポストします。',
            fanart_tag_label: 'X タグ', fanart_submit_label: 'ファンアート投稿',
            fanart_submit_btn: 'ファンアートを投稿する',
            fanart_submit_notice: '投稿することで、HakkaNeko がウェブサイトおよびSNSでクレジット付きで作品を掲載することに同意したものとみなします。フォーム内で匿名を選択できます。',
            fanart_treasures: '私の宝物', fanart_treasures_label: '✦ 私の宝物 ✦',
            fanart_loading: 'GitHubからファンアートを読み込んでいます…',
            toast_agree: '先に規約に同意してね',
            toast_copied: 'クリップボードにコピーしました！',
            toast_screenshot_saved: 'スクリーンショットを保存しました！',
            toast_summary_copied: '依頼内容をクリップボードにコピーしました！',
            intro_bubbles: ['こんにちは！依頼ページへようこそ！ ✨','なんでも気軽にメールしてね！','モデリングはキャラに命を吹き込む作業だよ！ 🐱','依頼受付中！気軽に声かけてね！','Live2D を作るのが一番楽しい 💜','タップしてくれてありがとう！最高だよ！ (≧▽≦)','キャラクターはみんな唯一無二だよ ✦','X で作品もチェックしてね！'],
            collab_bubbles: ['つつかないで！いい子にしてるよ！','秘密は何もないよ！','このサイトにコナミコマンドの隠し機能があるって知ってた？','もっとコラボできる絵師さんを探してるよ！'],
            badge_loading: '読み込み中…', badge_loaded: '✓ 読み込み完了', badge_fail: '読み込みに失敗しました',
            github_rate: 'GitHubのリクエスト上限に達しました。しばらくしてから試してください',
            github_rate_short: 'GitHubのリクエスト上限に達しました',
            github_rate_tip: '1時間に最大60回リクエストできます。少し待ってからもう一度試してみてください。',
            error_prefix: 'エラー：',
            name_brand: 'HakkaNeko', name_display: 'HakkaNeko', name_short: 'HakkaNeko',
            intro_role_short: 'Live2D モデラー',
            quote_filename: 'HakkaNeko見積もり',
            footer_role: 'Live2D モデラー · 個人受注モデラー',
            footer_credit: 'このサイトはHakkaNekoが企画しました。デザインと動きはAIのサポートで作り、本人が確認してから公開しています。',
            kofi_btn: 'コーヒーをおごる', kofi_supporters_empty: '最初のサポーターになろう！',
            // ── テンプレコラボ ──
            tmpl_title: 'テンプレートコラボ制作', tmpl_desc: '既存のLive2Dテンプレートに衣装デザインを乗せるだけで、コスパ最高のVTuberデビューが実現します。',
            tmpl_disclaimer_title: '📋 試算はあくまで参考値です', tmpl_disclaimer_body: '表示されている見積もりは参考値です。実際の料金は衣装数・カスタマイズ内容・制作者のスケジュールによって変わります。',
            tmpl_s1_title: 'テンプレートを選ぶ', tmpl_s2_title: '衣装の選択と追加', tmpl_s3_title: '髪型調整オプション', tmpl_s4_title: 'アクセサリー・表情オプション', tmpl_s5_title: '補足情報',
            tmpl_s2_hint: '1着目 NT$ 1,000、2着目以降 +NT$ 400。画像をクリックして選択、複数選択可。',
            tmpl_card_kanso_name: '着替え人形（残光）', tmpl_card_kanso_desc: '完成済みLive2Dテンプレートに衣装画像を乗せるだけで使えます。', tmpl_card_kanso_price: 'NT$ 1,000〜',
            tmpl_card_more_name: 'その他テンプレート', tmpl_card_more_soon: '近日公開',
            tmpl_card_chanye_name: '長夜月揺れ（紅妻）', tmpl_card_chanye_desc: '夜をテーマにしたコラボテンプレート。紅妻の独自画風で、暗めのキャラクターデザインに最適。', tmpl_card_chanye_price: 'NT$ 2,000 / 個',
            tmpl_chanye_qty_label: '長夜月揺れの数量', tmpl_chanye_qty_desc: '各長夜月揺れは個別委託となります。数量をご確認ください。',
            tmpl_chanye_s2_title: 'テンプレートプレビュー', tmpl_chanye_s2_hint: '長夜月揺れコラボテンプレートの参考画像です。',
            tmpl_chanye_s3_title: '委託数量', tmpl_chanye_qty_unit: '個', tmpl_chanye_qty_detail: '長夜月揺れ',
            tmpl_collab_artist: 'コラボ絵師',
            tmpl_selected_pre: '選択中', tmpl_selected_suf: '着',
            tmpl_hair_bang: '前髪・後ろ髪の変更', tmpl_hair_bang_price: '+ NT$ 150 / 箇所', tmpl_hair_bang_desc: '前髪の形や後ろ髪の長さなど、既存の髪型を部分的に変更します。',
            tmpl_hair_full: '全く新しいヘアスタイル', tmpl_hair_full_price: '+ NT$ 300 / 個', tmpl_hair_full_desc: '元の髪型とは構造的に異なる、完全新規のヘアデザインです。',
            tmpl_acc_label: 'ON/OFFできる小道具', tmpl_acc_price: '+ NT$ 100 / 個', tmpl_acc_desc: 'メガネ・花束・杖など、切り替え表示できる配件。',
            tmpl_expr_label: '簡単な表情調整', tmpl_expr_price: '+ NT$ 100 / 個', tmpl_expr_desc: '眉の形や目線など、既存表情の細部を微調整します。',
            tmpl_acc_input_label: '小道具の詳細', tmpl_acc_input_hint: '（各小道具の形状や特徴を具体的に記入してください）',
            tmpl_acc_ph: '例：黒縁眼鏡・薔薇の花束・魔法の杖...（外見の特徴を説明してください）',
            tmpl_supp_ph: 'キャラクター設定・衣装参考URL・特記事項・締切日など...',
            tmpl_acc_summary_label: '小道具リクエスト',
            tmpl_deposit_label: '手付金（50%）',
            tmpl_detail_outfit: 'テンプレート衣装', tmpl_detail_suit: '着', tmpl_detail_empty: 'まだ何も選択されていません',
            tmpl_copy_header: '注文内容', tmpl_copy_type: 'テンプレート種別', tmpl_copy_outfits: '選択衣装', tmpl_copy_none: '（未選択）',
            tmpl_copy_acc: '小道具リクエスト', tmpl_copy_supp: '補足情報', tmpl_copy_note: '参考試算です。最終料金は確認後に決まります',
            tmpl_gallery_title: '衣装ショーウィンドウ', tmpl_gallery_switch: 'クリックして衣装を切り替え',
            tmpl_gallery_note: '上の画像はプレースホルダーです。実際のテンプレート一覧はモデラーにご確認ください。',
            tmpl_what_title: 'テンプレコラボとは？',
            tmpl_what_li1: '既に作られたLive2Dスケルトンに衣装を直接描き込むため、ゼロからのモデリング工程を省略でき、コストと時間を大幅に節約できます。',
            tmpl_what_li2: '最初の衣装はNT$ 1,000から。追加ごとにNT$ 400のみ追加されるため、Live2Dデビューの最もお得な選択肢です。',
            tmpl_what_li3: 'フルカスタム衣装（NT$ 1,500〜）や髪型変更・アクセサリー・表情調整なども追加注文できます。',
            tmpl_what_li4: 'テンプレコラボは共有スケルトンを使用するため、モーションや物理設定はテンプレートと同一です。フルカスタムが必要な場合はV皮デザインをご覧ください。',
            tmpl_calc_title: 'テンプレート料金シミュレーター',
            tmpl_s1_title: '衣装を選択', tmpl_s1_hint: '（1着目が基本料金、2着目以降 +$400）',
            tmpl_outfit_label: '衣装の数', tmpl_outfit_price_1: '1着目 NT$ 1,000', tmpl_outfit_price_add: '2着目以降 各 +NT$ 400',
            tmpl_custom_label: 'フルカスタム衣装の追加', tmpl_custom_price: 'NT$ 1,500〜', tmpl_custom_note: '絵師・モデラーとの詳細な打ち合わせが必要',
            tmpl_s2_title: '髪型調整オプション',
            tmpl_hair_bang: '前髪・後ろ髪の変更', tmpl_hair_bang_price: '1か所 +NT$ 150',
            tmpl_hair_full: '全く新しいヘアスタイル', tmpl_hair_full_price: '1つ +NT$ 300',
            tmpl_s3_title: 'アクセサリー・表情オプション',
            tmpl_acc_label: 'ON/OFFできる小道具', tmpl_acc_note: 'メガネ / 花束 / 杖など', tmpl_acc_price: '1つ +NT$ 100',
            tmpl_expr_label: '簡単な表情調整', tmpl_expr_price: '1つ +NT$ 100',
            tmpl_total_label: '合計見積もり', tmpl_total_hint: '手数料・送料別',
            tmpl_copy_btn: '📋 注文内容をコピー', tmpl_copy_header: '注文内容',
            tmpl_copy_note: '参考試算です。最終料金は確認後に決まります',
            tmpl_outfit_detail_1: 'テンプレート衣装（1着目）', tmpl_outfit_detail_add: '追加衣装',
            tmpl_form_note: '見積もりを確認した後は、フォームからご依頼ください。',
        }
    };

    let currentLang = 'zh-TW';

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
