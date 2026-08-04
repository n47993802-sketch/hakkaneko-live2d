/* ============================================================
   阿卡貓 HakkaNeko 網站 — 角色互動展示頁 (live2d-demo.html) 專屬邏輯
   ============================================================
   從 common.js 拆分出來，只有 live2d-demo.html 會載入這個檔案。

   這一頁目前在 nav-config.js 裡是 enabled:false（隱藏中，Live2D 模型
   還沒串接完成），但過去這整段程式碼卻是放在 common.js 裡，等於
   「其他 9 個完全用不到 Live2D 互動功能的頁面」每次載入都要跟著下載
   這一整塊程式碼——這正是「共用檔案塞了太多不一定用得到的功能」
   的典型例子，現在只有真正會用到的這一頁才會載入。

   LIVE2D_MODEL_URL 現在指向同一個 repo 裡的 model/ 資料夾（相對路徑），
   把整個模型資料夾（.model3.json + .moc3 + 材質貼圖 + 動作檔案等）放進
   creative/live2d-demo/model/ 底下即可，不需要另外找外部空間放、也不會
   有跨網域（CORS）問題——CORS_PROXY 純粹是保留給「未來哪天真的需要載入
   外部網域的模型」這種情境用的備援，用同一個 repo 裡的相對路徑完全用
   不到它。
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

        // 模型網址 — 📌 把你的模型資料夾整個放進 creative/live2d-demo/model/
        // 底下，主要設定檔請命名為 model.model3.json（跟資料夾裡其他被它
        // 參照的檔案，例如 .moc3、材質貼圖、.physics3.json、動作檔案，
        // 都維持原本匯出時的相對路徑關係，整包搬過來就好，不用手動改
        // 內部路徑）。這裡用的是相對路徑，跟著 live2d-demo.html 一起部署
        // 到 GitHub 後就能直接讀到，不需要外部網址。
        const LIVE2D_MODEL_URL = 'model/model.model3.json';
        // 保留給「未來如果要改成載入外部網域的模型」使用的備援，目前用
        // 同一個 repo 裡的相對路徑完全用不到。
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
            // v59 修復：Cubism Core 運行時（.moc3 格式，也就是 Cubism 3/4
            // 模型必須要有這個才能被解析）之前完全沒有被載入——這是
            // pixi-live2d-display 能不能讀懂模型檔案的關鍵前置依賴，
            // 缺了它，不管模型檔案本身多正確，載入都會失敗。跟 PIXI 一樣
            // 要在 pixi-live2d-display 之前載入好。
            if (!window.Live2DCubismCore) {
                await loadScript('https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js');
            }
            // v61 修復：pixi-live2d-display 在瀏覽器（非模組系統）環境下，
            // 是掛在 window.PIXI.live2d.Live2DModel 這個命名空間下，
            // 不是直接掛在 window.Live2DModel——之前程式碼一直假設是後者，
            // 結果 window.Live2DModel 永遠是 undefined，載入模型時
            // 呼叫 .from() 自然會報「Cannot read properties of undefined
            // (reading 'from')」，跟模型檔案本身完全無關，是全域變數路徑
            // 寫錯了。
            if (!(window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel)) {
                await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js');
                if (window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel) {
                    window.PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
                }
            }
            const Live2DModelCtor = window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel;
            if (!Live2DModelCtor) {
                throw new Error('pixi-live2d-display 載入失敗：找不到 PIXI.live2d.Live2DModel，函式庫可能沒有正確下載。');
            }

            // Try direct URL first, then CORS proxy
            const urlsToTry = [
                LIVE2D_MODEL_URL,
                CORS_PROXY + encodeURIComponent(LIVE2D_MODEL_URL)
            ];

            try {
                const wrapper = document.getElementById('live2dWrapper');
                // v60 修復：如果容器在這個當下量到的寬高剛好是 0（例如
                // 容器還沒被瀏覽器排版完成、或是頁面切換的時機不巧），
                // 用 0 去初始化 PIXI 的 WebGL context 會導致 shader 編譯
                // 失敗，丟出「Invalid value of `0` passed to
                // checkMaxIfStatementsInShader」這種不容易一眼看懂根本
                // 原因的錯誤。加個保底值，避免用 0 去初始化。
                const w = wrapper.clientWidth || 400, h = wrapper.clientHeight || 420;

                if (live2dApp) { live2dApp.destroy(true); live2dApp = null; }

                live2dApp = new PIXI.Application({ width: w, height: h, backgroundAlpha: 0, view: canvasEl, antialias: true });
                canvasEl.style.display = 'block';
                placeholder.style.display = 'none';

                let loadedModel = null;
                for (const url of urlsToTry) {
                    try {
                        loadedModel = await Live2DModelCtor.from(url, { autoHitTest: true, autoFocus: true });
                        break;
                    } catch(e) {
                        // v59 修復：之前這裡直接 continue，把每次嘗試失敗的
                        // 真正原因（404、CORS、Cubism Core 未載入、moc3
                        // 格式錯誤等）都吃掉了，最後只會看到籠統的
                        // 「All URLs failed」，很難排查卡在哪一步。先印出
                        // 這次嘗試實際失敗的原因，再繼續試下一個網址。
                        console.warn('Live2D model load attempt failed for', url, e);
                        continue;
                    }
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
                        playIntroSound(); // v57 修復：點頭部/頭貼時的音效呼叫遺失了，補回來
                    } else {
                        live2dModel.motion('TapBody');
                        playBonk(); // v57 修復：點身體時的音效呼叫遺失了，補回來
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
        // v58：playIntroSound()／playBonk()／getSfxCtx() 已經搬回
        // common.js（該邏輯其實是全站共用的「點頭貼」互動的一部分，
        // 首頁的自我介紹頭貼按鈕也在用），這支頁面專屬的檔案不用再
        // 重複定義一份——common.js 在這支檔案之前就已經載入完成，
        // 這裡呼叫 playIntroSound()／playBonk() 時函式已經存在。
