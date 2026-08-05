/* ============================================================
   阿卡貓 HakkaNeko 網站 — 作品展示（動態貼圖／動態Logo）渲染邏輯
   ============================================================
   從 common.js 拆分出來，只有 portfolio.html 會載入這個檔案。
   需要先載入 portfolio-config.js（提供 window.PORTFOLIO_MEDIA /
   window.PORTFOLIO_PER_PAGE）。

   v55（改用 .webm 影片後的調整）：
     動態貼圖／動態Logo 已經從 GIF 換成 webm 影片檔（見
     portfolio-config.js），<img> 沒辦法播放 .webm，這裡全面改用
     <video autoplay muted loop playsinline poster="...">。
     同時把統一燈箱（common.js 的 ulbGroups.stickers / .logos）
     直接指到 window.PORTFOLIO_MEDIA，不再維護第二份重複資料。

   零閃爍核心原則（沿用自原本設計，沒有更動）：
     1. 所有 <video> 在 gifBuildAll() 時一次建好，src 只設一次，之後絕不修改
     2. 切換分頁只改 card.style.display（'none' / ''）
     3. 無任何 opacity/visibility transition 作用在影片的父層上
     4. 每個 video 用 transform:translateZ(0) 放入獨立 GPU compositing layer

   v33 效能修正（沿用）：
     只有「目前分頁看得到的那幾張」會立刻設定 src 開始下載，其餘的
     先記住網址（data-src），等使用者真的翻到那一頁才臨時補上，
     避免一進頁面就同時對圖床發出全部張數的下載請求。
   ============================================================ */
var gifPage = { stickers: 0, logos: 0 };

        // 把作品資料同步進統一燈箱系統（common.js 的 ulbGroups），
        // 讓點擊卡片開燈箱時，能直接讀到跟卡片一模一樣的來源，
        // 不用再維護第二份重複清單。
        // 注意：ulbGroups 在 common.js 裡是用 const 宣告的頂層變數，
        // 不會掛在 window 物件上（跟 function 宣告不一樣），所以這裡
        // 要直接讀寫裸變數名稱，不能寫成 window.ulbGroups。
        if (typeof ulbGroups !== 'undefined') {
            ulbGroups.stickers = window.PORTFOLIO_MEDIA.stickers;
            ulbGroups.logos    = window.PORTFOLIO_MEDIA.logos;
        }

        // 一次性建立所有卡片 DOM，video.src 只設一次
        function gifBuildAll() {
            ['stickers', 'logos'].forEach(function(key) {
                var grid  = document.getElementById('gif-grid-' + key);
                if (!grid || grid.children.length > 0) return; // 已建立則跳過
                var items = window.PORTFOLIO_MEDIA[key];
                var isS   = key === 'stickers';
                var borderActive = isS ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)';
                var badgeBg = isS ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)';

                items.forEach(function(item, idx) {
                    var card = document.createElement('div');
                    card.className = 'port-gif-card';
                    card.style.setProperty('--port-accent', borderActive);
                    card.style.setProperty('--port-accent-shadow', isS ? 'rgba(52,211,153,.12)' : 'rgba(251,191,36,.12)');
                    // 點擊卡片開啟純覆蓋燈箱（不含導覽點與箭頭）
                    (function(captureKey, captureIdx) {
                        card.onclick = function() { ulbOpen(captureKey, captureIdx); };
                    })(key, idx);

                    // ── 骨架屏容器：載入完成前顯示微光 ──
                    var wrap = document.createElement('div');
                    wrap.className = 'port-gif-wrap gif-skeleton';

                    var video = document.createElement('video');
                    video.muted = true;
                    video.loop = true;
                    video.autoplay = true;
                    video.playsInline = true;
                    video.setAttribute('playsinline', ''); // 部分瀏覽器需要屬性形式
                    video.setAttribute('aria-label', item.label);
                    video.poster = item.poster;
                    // loading="lazy" 對 <video> 支援度不一，改用 preload="none"
                    // 搭配下方「翻頁到才補 src」的邏輯，效果等同延遲載入。
                    video.preload = 'none';
                    video.className = 'gif-img-fade';
                    video.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;transform:translateZ(0);-webkit-transform:translateZ(0);position:relative;z-index:1;';
                    video.onerror = function() {
                        this.style.display = 'none';
                        var p = this.parentElement;
                        if (p) {
                            p.classList.remove('gif-skeleton');
                            p.innerHTML += '<i class="fa-solid fa-image" style="font-size:2rem;color:rgba(168,85,247,.25);position:absolute;"></i>';
                        }
                    };
                    video.oncanplay = function() {
                        this.classList.add('loaded');
                        var p = this.parentElement;
                        if (p) p.classList.remove('gif-skeleton');
                        this.play().catch(function(){}); // 部分瀏覽器 autoplay 需手動再觸發一次
                    };
                    // 只有「目前分頁」內的影片會立刻設定 src 開始下載，
                    // 其餘分頁的先存進 data-src，等使用者真的翻到那一頁
                    // （gifRenderPage 內）才臨時補上 src。
                    if (idx < window.PORTFOLIO_PER_PAGE) {
                        video.src = item.src;
                        video.preload = 'auto';
                        video.dataset.loaded = '1';
                    } else {
                        video.dataset.src = item.src;
                    }

                    wrap.appendChild(video);

                    // 文字標籤
                    var info = document.createElement('div');
                    info.style.cssText = 'padding:.55rem .7rem .65rem;text-align:center;';
                    var labelEl = document.createElement('p');
                    labelEl.textContent = item.label;
                    labelEl.className = 'port-gif-label';
                    labelEl.style.background = badgeBg;
                    info.appendChild(labelEl);
                    if (item.sub) {
                        var subEl = document.createElement('p');
                        subEl.textContent = item.sub;
                        subEl.className = 'port-gif-sub';
                        info.appendChild(subEl);
                    }

                    card.appendChild(wrap);
                    card.appendChild(info);
                    grid.appendChild(card);
                });

                // 初次顯示第 0 頁
                gifRenderPage(key);
            });
        }

        // 只改 display，絕不碰 video.src（已載入的不重載）
        function gifRenderPage(key) {
            var grid    = document.getElementById('gif-grid-' + key);
            var dotsEl  = document.getElementById('gif-dots-' + key);
            if (!grid) return;
            var cards   = grid.children;
            var total   = window.PORTFOLIO_MEDIA[key].length;
            var pages   = Math.ceil(total / window.PORTFOLIO_PER_PAGE);
            var page    = gifPage[key];
            var start   = page * window.PORTFOLIO_PER_PAGE;
            var end     = start + window.PORTFOLIO_PER_PAGE;
            var isS     = key === 'stickers';
            var dotActive = isS ? '#34d399' : '#fbbf24';

            for (var i = 0; i < cards.length; i++) {
                var isVisible = (i >= start && i < end);
                cards[i].style.display = isVisible ? '' : 'none';
                // 翻頁翻到這一頁時才補上還沒載入的影片 src（見上方說明）
                if (isVisible) {
                    var lazyVideo = cards[i].querySelector('video');
                    if (lazyVideo && !lazyVideo.dataset.loaded && lazyVideo.dataset.src) {
                        lazyVideo.preload = 'auto';
                        lazyVideo.src = lazyVideo.dataset.src;
                        lazyVideo.dataset.loaded = '1';
                    } else if (lazyVideo && lazyVideo.paused) {
                        lazyVideo.play().catch(function(){});
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
            var pages = Math.ceil(window.PORTFOLIO_MEDIA[key].length / window.PORTFOLIO_PER_PAGE);
            var next  = gifPage[key] + dir;
            if (next < 0 || next >= pages) return;
            gifPage[key] = next;
            gifRenderPage(key);
        }

        // 立即初始化：page-portfolio 從頁面載入就在 DOM 中渲染
        // 提早建立 video 讓影片開始準備播放，切換到 portfolio 時已在持續播放，不會閃爍
        var _gifBuilt = false;
        function gifEnsureInit() {
            if (_gifBuilt) return;
            _gifBuilt = true;
            gifBuildAll();
        }
        // 頁面 DOMContentLoaded 後立刻 init
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { gifEnsureInit(); });
        } else {
            gifEnsureInit();
        }

// port-reveal 首次顯示邏輯：頁面一解析完（DOMContentLoaded）就立刻觸發，
// 不用等圖片/影片全部載入完成，避免跟其他頁面呈現時機不一致。
function triggerPortReveal() {
    var pageEl = document.getElementById('page-portfolio');
    if (!pageEl) return;
    var firstPortEl = pageEl.querySelector('.port-reveal');
    if (!firstPortEl || firstPortEl.classList.contains('visible')) return; // 已經顯示過
    var portEls = pageEl.querySelectorAll('.port-reveal');
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            var n = portEls.length;
            var step = Math.min(70, 500 / n);
            portEls.forEach(function(el, i) {
                setTimeout(function() { el.classList.add('visible'); }, Math.round(i * step));
            });
        });
    });
    pageEl.classList.remove('gif-hidden', 'hidden');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerPortReveal);
} else {
    triggerPortReveal();
}
