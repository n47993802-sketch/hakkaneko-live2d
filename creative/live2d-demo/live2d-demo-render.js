/* ============================================================
   阿卡貓 HakkaNeko 網站 — 角色互動展示頁 (live2d-demo.html) 專屬邏輯
   ============================================================
   從 common.js 拆分出來，只有 live2d-demo.html 會載入這個檔案。

   這一頁目前在 nav-config.js 裡是 enabled:false（隱藏中，Live2D 模型
   還沒串接完成），但過去這整段程式碼卻是放在 common.js 裡，等於
   「其他 9 個完全用不到 Live2D 互動功能的頁面」每次載入都要跟著下載
   這一整塊程式碼——這正是「共用檔案塞了太多不一定用得到的功能」
   的典型例子，現在只有真正會用到的這一頁才會載入。

   LIVE2D_MODEL_URL 目前還是預留的範例網址，等實際要串接 Live2D 模型
   時，把這裡換成真正的 model3.json 網址即可。
   ============================================================ */
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
