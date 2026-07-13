/* ============================================================
   阿卡貓 HakkaNeko 網站 — 作品展示（動態貼圖／動態Logo）渲染邏輯
   ============================================================
   從 common.js 拆分出來，只有 portfolio.html 會載入這個檔案。
   需要先載入 portfolio-config.js（提供 window.GIF_DATA / window.GIF_PER_PAGE）。

   零閃爍核心原則（沿用自原本 common.js 裡的設計，沒有更動）：
     1. 所有 <img> 在 gifBuildAll() 時一次建好，src 只設一次，之後絕不修改
     2. 切換分頁只改 card.style.display（'none' / ''）
     3. 無任何 opacity/visibility transition 作用在 GIF 的父層上
     4. 每個 img 用 transform:translateZ(0) 放入獨立 GPU compositing layer

   v33 效能修正（這次調整新增）：
     只有「目前分頁看得到的那幾張」會立刻設定 src 開始下載，其餘的
     先記住網址（data-src），等使用者真的翻到那一頁才臨時補上，
     避免一進頁面就同時對 GitHub 發出全部張數的下載請求（這是之前
     portfolio.html 讀取明顯比其他頁面慢一步的主因）。
   ============================================================ */
var gifPage = { stickers: 0, logos: 0 };

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
                var items = window.GIF_DATA[key];
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
                    // 都設定好（即使當下分頁只顯示 window.GIF_PER_PAGE 張），導致一進頁面就
                    // 同時對 GitHub 發出 stickers+logos 全部張數的圖片請求，
                    // 這也是這個頁面明顯比其他頁面慢一步「還在補圖」的主因。
                    // 現在改成：只有「目前分頁」內的圖片會立刻設定 src 開始下載，
                    // 其餘分頁的圖片先存進 data-src，等使用者真的翻到那一頁
                    // （gifRenderPage 內）才臨時補上 src，網路請求量從一次全部
                    // 變成跟其他頁面一樣「每次只載入看得到的量」。
                    if (idx < window.GIF_PER_PAGE) {
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
            var total   = window.GIF_DATA[key].length;
            var pages   = Math.ceil(total / window.GIF_PER_PAGE);
            var page    = gifPage[key];
            var start   = page * window.GIF_PER_PAGE;
            var end     = start + window.GIF_PER_PAGE;
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
            var pages = Math.ceil(window.GIF_DATA[key].length / window.GIF_PER_PAGE);
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
