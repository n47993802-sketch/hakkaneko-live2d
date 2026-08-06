/* ============================================================
   阿卡貓 HakkaNeko 網站 — 模型展示頁 (creative/model/index.html) 專屬邏輯
   ============================================================
   從 common.js 拆分出來，只有 creative/model/index.html 會載入這個檔案。

   這一頁目前在 nav-config.js 裡是 enabled:false（隱藏中，Live2D 模型
   還沒串接完成），但過去這整段程式碼卻是放在 common.js 裡，等於
   「其他 9 個完全用不到 Live2D 互動功能的頁面」每次載入都要跟著下載
   這一整塊程式碼——這正是「共用檔案塞了太多不一定用得到的功能」
   的典型例子，現在只有真正會用到的這一頁才會載入。

   v63 更新：模型資料夾現在改放在另一個獨立的 GitHub repo
   （n47993802-sketch/Live2D-，路徑 live2d/），不再跟著網站本身的 repo
   一起部署，所以不能再用相對路徑讀取。改成讀取
   raw.githubusercontent.com 上的原始檔網址——GitHub 對公開 repo 的
   raw 內容預設就會回傳 Access-Control-Allow-Origin: *，所以瀏覽器端
   直接 fetch 是沒有 CORS 問題的，CORS_PROXY 依然只是保留給「萬一哪天
   raw.githubusercontent.com 本身打不開」這種情境用的備援。
   注意：pixi-live2d-display 載入 model3.json 之後，裡面參照的 .moc3、
   材質貼圖、.physics3.json、動作檔案都是用「相對於 model3.json 網址」
   的方式去抓，所以只要 live2d/ 資料夾內部的相對路徑結構跟原本匯出時
   一樣（沒有手動搬動裡面的檔案），全部都會一起從同一個 repo 正確讀到，
   不需要每個檔案都額外設定。

   v65 更新（本次改版重點，詳細說明請見兩份說明書文件）：
   1) 滑鼠控制方式全面改版：
        - 左鍵拖曳：頭部/身體「X 軸（左右轉頭/轉身）＋ Y 軸（抬頭/低頭）」，
          同時驅動視線（眼球）跟著看向拖曳方向，放開後緩動回正中央。
        - 右鍵拖曳：頭部/身體「Z 軸（歪頭/歪身）」，放開後緩動回正中央。
        - 中鍵拖曳：角色在畫布內的「位置」（X／Y 平移），放開後位置
          會保留，需要用「重置視角」按鈕清空。
        - 滑鼠滾輪：角色縮放大小（不變）。
        - 新增「放大檢視」按鈕：把展示區切換成全螢幕檢視，方便近距離
          觀察細節，不影響上述互動邏輯。
      舊版是直接呼叫 pixi-live2d-display 內建的 live2dModel.focus()，
      但 focus() 內部會把 X 軸跟 Z 軸耦合在一起算（水平拖曳同時牽動
      兩者），沒辦法讓左右鍵分別各自獨立控制 X/Y 與 Z。這一版改成不使用
      focus()，而是自己算出目標角度、在每一個影格（ticker）用內插
      （lerp）平滑地寫入 Cubism 核心參數（ParamAngleX/Y/Z、
      ParamBodyAngleX/Y/Z、ParamEyeBallX/Y），這樣才能讓左右鍵各自
      只影響自己負責的軸向，且仍保留原本「放開後自動緩動回正中央」的
      手感。詳細參數名稱請見「網站設計者使用說明書」。
   2) 新增「頭部控制」「身體控制」開關：兩個開關各自獨立，關閉某一項
      之後，上述所有滑鼠拖曳（左鍵/右鍵）就不會再去改動該部位對應的
      Cubism 參數（但畫面上的拖曳互動本身還是照常運作，只是不套用到
      被關閉的那個部位）。
   3) 移除功能：
        - 「滑鼠移動就會視線跟隨」（舊版 hover 就會轉頭）：改成一定要
          按住左鍵拖曳才會轉動，平時滑鼠移動不會有任何反應。
        - 「點擊頭部觸發表情」「點擊身體觸發動作」（hit-test 點擊觸發）：
          已完全移除，包含底層的 live2dModel.on('hit', …) 監聽器，
          同時把載入模型時的 autoHitTest 選項關掉（不需要的功能連底層
          偵測都一併省下來，減少不必要的效能負擔）。動畫觸發現在只能
          透過右側「觸發動畫」面板上的按鈕手動播放。
   4) 修正重大 Bug：「模型成功載入一次之後，再次點擊『載入模型』會失敗」。
      根本原因：舊版重新載入時呼叫的是 live2dApp.destroy(true)，
      PIXI.Application.destroy() 的第一個參數叫 removeView，傳 true
      代表「連同 <canvas> 這個 DOM 元素本身都一起從畫面上移除」。
      第一次載入時 live2dApp 還是 null，不會走到這行，所以看起來一切
      正常；但只要成功載入過一次、再按第二次「載入模型」，就會先執行
      這一行，把 <canvas> 從 #live2dWrapper 容器裡整個拔掉。之後新建立
      的 PIXI.Application 雖然技術上还是用同一個 canvasEl 物件、也沒有
      噴出例外，但因為這個 canvas 已經不在畫面的 DOM 樹裡了，所以使用者
      只會看到空白，觀感上就是「載入失敗」。修法是把 removeView 改成
      false（保留 canvas 掛在畫面上），只清掉舊模型/舊 WebGL 資源：
      live2dApp.destroy(false, { children:true, texture:true, baseTexture:true })。
   5) 事件監聽器只綁定一次：舊版每次呼叫 loadLive2DModel() 都會對
      #live2dWrapper 重新 addEventListener 一次 mousedown/mousemove/
      wheel…等，重複載入模型會讓同一批事件監聽器疊加好幾份（雖然不會
      直接報錯，但屬於潛在問題，且拖曳判斷邏輯改複雜之後更容易出錯）。
      這一版把互動事件的綁定抽成獨立的 bindInteractionEvents()，用
      interactionBound 旗標確保整個頁面存活期間只會執行一次。
   v66 更新（本次改版重點）：
   1) 修復「平時沒按左鍵卻沒歸零」的問題：mouseup 監聽器改綁在 document
      上，避免使用者把滑鼠拖出 #live2dWrapper 範圍外才放開左鍵時，
      漏接放開事件、導致頭部/身體角度卡在最後拖曳位置。
   2) 操作提示文字調整：左鍵拖曳＝【X、Y軸跟隨】、右鍵拖曳＝【Z軸跟隨】。
   3) 手機模式新增雙指按住＝控制 Z 軸（比照右鍵拖曳），單指維持原本的
      X/Y 軸＋視線跟隨。
   4) 移除「物理強度」「呼吸速度」兩個滑桿；「物理演算」「呼吸自動」
      整組開關仍保留。
   5) 「觸發動畫」面板只保留「待機」「揮手」兩顆按鈕（點下觸發一次性
      動作）；原本的「開心」「驚訝」改成「表情參數」面板裡兩個 0~1
      的連續滑桿，每影格持續套用到模型的對應 Cubism 參數上。
   6) 「放大檢視」改成把左側角色視窗＋右側控制面板一起放進全螢幕，
      而不是只有角色視窗自己。
   7) 角色視窗滑鼠移入時不再有卡片「飄起來」的 hover 位移效果。
   ============================================================ */
        // ==================== Live2D 互動分頁邏輯 ====================
        let live2dApp = null;
        let live2dModel = null;
        let live2dInited = false;
        let interactionBound = false; // v65：事件監聽只綁定一次，避免重複載入模型時疊加監聽器
        let tickerBound = false; // v69：updatePose 只掛到 ticker 一次，避免重複載入模型時疊加
        let demoParams = {
            blink: true,             // 眨眼自動
            physics: true,           // 物理演算開關
            breathAuto: true,        // 呼吸自動開關
            // v66 新增：表情參數（開心／驚訝），數值 0~1，取代原本「點擊
            // 觸發一次性動作」的做法，改成可持續調整強度的連續參數，
            // 每個影格都會套用到模型上（見 updatePose() / applyExpression()）。
            expressionHappy: 0,
            expressionSurprised: 0
        };

        // ---- v64 新增、v65 調整：中鍵拖曳位移 / 滾輪縮放 的狀態 ----
        // baseScale：模型「符合畫布大小」時的基準縮放值（載入時算好）。
        // viewOffsetX / viewOffsetY：中鍵拖曳造成的位移量（像素，相對於畫布中心）。
        // viewZoom：滾輪縮放的倍率，最終縮放 = baseScale * viewZoom。
        let baseScale = 1;
        let viewOffsetX = 0, viewOffsetY = 0, viewZoom = 1;
        let isLeftDragging = false, isRightDragging = false, isMiddleDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let dragStartOffsetX = 0, dragStartOffsetY = 0;
        // v66 新增：手機模式雙指狀態（單指＝X/Y 軸視線跟隨，雙指＝ Z 軸歪頭，
        // 比照桌面版左鍵／右鍵的分工）。
        let isTwoFingerTouch = false;

        // v65 新增：頭部/身體/視線姿勢的「目前值」與「目標值」。
        // 每個 ticker 影格用簡單線性內插（lerp）讓數值平滑地往目標值靠近，
        // 用來取代舊版 live2dModel.focus() 內建的緩動效果——因為 focus()
        // 沒辦法把 X/Y 跟 Z 軸分開控制，所以改成自己直接寫入 Cubism 參數。
        const pose = { headX: 0, headY: 0, headZ: 0, bodyX: 0, bodyY: 0, bodyZ: 0, eyeX: 0, eyeY: 0 };
        const poseTarget = { headX: 0, headY: 0, headZ: 0, bodyX: 0, bodyY: 0, bodyZ: 0, eyeX: 0, eyeY: 0 };
        const POSE_LERP = 0.15; // 內插係數，數字越大回正/跟隨速度越快

        // 各參數對應的角度／數值範圍，沿用 pixi-live2d-display 內建
        // focus() 原本的慣例（頭部 ±30、身體 ±10、眼球 ±1），跟大多數
        // Cubism 標準模型的參數可動範圍相符。若個別模型自己定義的
        // min/max 更小，Cubism Core 會自動夾在該參數本身的範圍內，
        // 不會超出模型設計者原本設定的可動範圍。
        const RANGE = { headX: 30, headY: 30, headZ: 30, bodyX: 10, bodyY: 10, bodyZ: 10, eye: 1 };

        // 縮放的邊界，避免使用者滾輪滾過頭導致模型變得太大或太小。
        const ZOOM_MIN = 0.3, ZOOM_MAX = 3;

        // v70 修復（真正根本原因）：這個模型（HakkaNekoQQ）的完整參數
        // 清單其實只有 HakkaNekoQQ.cdi3.json 裡列出的這幾個：
        // ParamAngleX/Y/Z、ParamEyeLOpen、ParamEyeROpen、ParamEyeROpen2
        // （名稱是「開口」，也就是嘴巴開合，不是第二個眼睛參數）、
        // ParamBreath/Breath2、Param/Param2（頭髮物理）、
        // Param3/4/5（面部 X/Z/Y）。先前 happy／surprised 兩組都同時
        // 塞了 ParamEyeLOpen／ParamEyeROpen 進去——這兩個參數其實是
        // 「左眼/右眼開關」，也是眨眼動畫真正在用的參數；表情系統
        // 每個影格都會覆寫一次，等於一直在跟眨眼搶同一個參數，這才是
        // 「調整驚訝滑桿卻變成在控制眨眼、而且眨眼自動看起來沒有正常
        // 觸發」的真正原因。這個模型沒有專門的笑容/挑眉參數，所以
        // happy 目前沒有合適、不衝突的參數可用，先留空；surprised 只
        // 保留 ParamEyeROpen2（嘴巴開合，驚訝＝嘴巴微張），不再去動
        // 眼睛開關，把「眨眼」完全交還給 toggleSwitch('blink', …) 那條
        // 路徑處理。之後模型如果新增專用的表情參數，把對應 ID 填進來
        // 即可，setParamSafe() 會自動略過不存在的參數，不會讓整頁互動壞掉。
        const EXPRESSION_PARAMS = {
            happy: [],
            surprised: ['ParamEyeROpen2']
        };

        function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

        function initLive2DDemo() {
            if (live2dInited) return;
            live2dInited = true;
        }

        // 模型網址
        // 預設會優先讀取本地資料夾 creative/model/model/ 下的 model.model3.json，
        // 若要改為遠端 raw.githubusercontent.com，請把下面路徑改回對應的 URL。
        // v71 修復：這個網址原本沒有加版本查詢字串（?v=...），跟網站其他
        // 資源（common.js、locales 等）不一樣——瀏覽器在沒有 Cache-Control
        // 標頭時會套用 HTTP 的「試探性快取」規則，即使之後修改了
        // model3.json 內容（例如修正 EyeBlink 群組），使用者瀏覽器仍可能
        // 一直吃到舊的快取版本，導致修好的設定實際上沒有生效。這裡加上
        // 版本字串，之後每次調整模型設定檔就同步更新這個版本號即可。
        // 注意：pixi-live2d-display 用這個網址去解析 .moc3、材質、
        // physics3.json 等相對路徑時，只會用網址的路徑部分，query
        // string 不影響那些子資源的解析結果，不會因此重複加上版本號。
        const LIVE2D_MODEL_URL = 'model/model.model3.json?v=20260806d';
        // 保留給「萬一 raw.githubusercontent.com 本身連不上」這種情境
        // 用的備援，目前 raw.githubusercontent.com 對公開 repo 預設就有
        // 正確的 CORS 標頭，正常情況下用不到這個代理。
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
                // v62 修復（真正的根本原因）：pixi-live2d-display 的
                // dist/index.min.js 是「同時支援 Cubism 2 + Cubism 4」的
                // 合併版本，這個版本的初始化程式碼裡有一段寫死、無條件
                // 執行的檢查——一定要偵測到 Cubism 2 的舊版運行時
                // （window.Live2D，來自另一支叫 live2d.min.js 的檔案）存在，
                // 不然會直接 throw 一個「Could not find Cubism 2 runtime」
                // 例外，把整個函式庫初始化中斷在半路，後面原本要拿來定義
                // Live2DModel 的程式碼完全沒有機會執行到——這才是「找不到
                // PIXI.live2d.Live2DModel」的真正原因，跟 CDN 有沒有正確
                // 下載無關（腳本確實有下載成功，只是執行到一半就被這個
                // 檢查中斷了）。
                // 我們的模型是 .moc3（Cubism 3/4 格式），用不到 Cubism 2，
                // 改成載入只支援 Cubism 4 的專用版本（cubism4.min.js），
                // 這個版本沒有上述那段檢查。同時把版本號鎖定在 0.4.0，
                // 避免以後函式庫更新內容跟這裡的假設不一致。
                await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js');
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

                // v69 修復（真正根本原因）：先前每次「載入模型」都會呼叫
                // `new PIXI.Application({ view: canvasEl, ... })`，把同一個
                // <canvas> DOM 元素再傳一次當作 view。第一次執行時瀏覽器
                // 會在這個 canvas 上建立一個 WebGL context 並回傳成功；
                // 但同一個 <canvas> 同一時間只能有一個 WebGL context——
                // 就算前一個 PIXI.Application 已經呼叫過 destroy()，只要
                // 那個 destroy 沒有真正呼叫 WEBGL_lose_context 擴充功能
                // 徹底釋放掉舊的 context（v65 那次修復刻意把 removeView
                // 改成 false，保留 canvas 掛在畫面上，但這也代表舊 context
                // 沒有被明確釋放），第二次再對「同一個 canvas」要一次
                // WebGL context，瀏覽器不會給一個乾淨、全新的 context，
                // 於是 PIXI 量到的著色器能力數值變成無效值，丟出
                // 「Invalid value of `0` passed to
                // checkMaxIfStatementsInShader」這種錯誤——這才是「按第二
                // 次『載入模型』就會失敗」的真正原因，跟模型檔案、CORS、
                // Cubism Core 都無關。正確做法：PIXI.Application（連同它
                // 綁定的 WebGL context）整個網頁存活期間只建立一次；
                // 重新載入模型只需要把「舊模型」從 stage 移除並 destroy，
                // 再把新模型加進同一個既有的 app，完全不重新碰 canvas
                // 本身的 WebGL context。
                if (!live2dApp) {
                    live2dApp = new PIXI.Application({ width: w, height: h, backgroundAlpha: 0, view: canvasEl, antialias: true });
                } else {
                    live2dApp.renderer.resize(w, h);
                }
                canvasEl.style.display = 'block';
                placeholder.style.display = 'none';

                if (live2dModel) {
                    try {
                        live2dApp.stage.removeChild(live2dModel);
                        live2dModel.destroy({ children: true, texture: true, baseTexture: true });
                    } catch (e) { console.warn('清除舊的 Live2D 模型時發生非致命錯誤：', e); }
                    live2dModel = null;
                }
                // 重新載入時，姿勢跟拖曳狀態都歸零，避免延續上一次殘留的角度/位置判斷
                isLeftDragging = false; isRightDragging = false; isMiddleDragging = false; isTwoFingerTouch = false;
                pose.headX = pose.headY = pose.headZ = pose.bodyX = pose.bodyY = pose.bodyZ = pose.eyeX = pose.eyeY = 0;
                poseTarget.headX = poseTarget.headY = poseTarget.headZ = poseTarget.bodyX = poseTarget.bodyY = poseTarget.bodyZ = poseTarget.eyeX = poseTarget.eyeY = 0;

                let loadedModel = null;
                for (const url of urlsToTry) {
                    try {
                        // v67 修復（真正根本原因）：pixi-live2d-display 0.4.0
                        // 實際支援的選項叫 autoInteract（預設 true），不是先前
                        // 誤用的 autoHitTest/autoFocus——這兩個名字在這個版本
                        // 根本不存在，等於完全沒設定到，所以底層 InteractionMixin
                        // 依然會對 PIXI 的 InteractionManager 註冊 pointermove
                        // 監聽器、一偵測到滑鼠移動就呼叫 model.focus()，這才是
                        // 「明明程式碼已經改成只在按住左鍵時才更新 pose，畫面卻
                        // 還是照樣跟著滑鼠移動」的真正原因：跟拖曳判斷邏輯無關，
                        // 是函式庫自己底層另外掛了一份監聽器在背景默默運作。
                        // 這裡改成明確關閉 autoInteract，順便也讓內建的點擊
                        // hit-test（pointertap → tap()）一併停用。
                        loadedModel = await Live2DModelCtor.from(url, { autoInteract: false });
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

                // v64：anchor 置中，主要是讓「拖曳位移」以模型中心點
                // 為基準比較直覺。
                live2dModel.anchor.set(0.5, 0.5);

                // Scale to fit：算出「剛好塞滿畫布」的基準縮放值，之後
                // 滾輪縮放都是在這個基準上乘以 viewZoom，這樣「重置視角」
                // 才能準確地回到剛載入時的大小。
                baseScale = Math.min(w / live2dModel.internalModel.originalWidth, h / live2dModel.internalModel.originalHeight) * 0.85;

                // 每次重新載入模型，位移/縮放都還原成預設狀態，避免
                // 重新載入後畫面停留在上次拖曳過的位置。
                viewOffsetX = 0; viewOffsetY = 0; viewZoom = 1;
                applyModelTransform(w, h);

                // v65：把「每影格把 pose 內插並寫入 Cubism 參數」的函式
                // 掛到這個 live2dApp 專屬的 ticker 上。掛在 live2dModel
                // 被加入 stage 之後、也就是它自己已經透過
                // Live2DModel.registerTicker 掛好內部更新之後，確保我們
                // 這裡的寫入動作是在模型本身的動作/物理/呼吸更新「之後」
                // 才執行，這樣才能讓拖曳出來的頭部/身體角度是最終畫面
                // 真正採用的數值，不會被模型自己的待機動作覆蓋掉。
                // v69：live2dApp 現在整個網頁存活期間只建立一次，重新
                // 載入模型不會再重新跑到這裡，用 tickerBound 擋掉
                // 以免 updatePose 被疊加掛上好幾份。
                if (!tickerBound) {
                    live2dApp.ticker.add(updatePose);
                    tickerBound = true;
                }

                // v65：互動事件（拖曳/滾輪/觸控）只需要綁定一次，
                // 不會因為重新載入模型而重複疊加監聽器。
                bindInteractionEvents();

                // v63：模型剛載入時，內部的眨眼/物理/呼吸模組都是用檔案
                // 內建的預設值啟動，跟畫面上開關目前顯示的狀態不一定一致
                // （例如使用者在模型載入完成前，已經先把某個開關切成跟
                // 預設不同的狀態）。這裡把目前 demoParams 裡記錄的狀態，
                // 全部重新套用一次到剛載入好的模型上。
                toggleSwitch('blink', demoParams.blink);
                toggleSwitch('physics', demoParams.physics);
                toggleSwitch('breathAuto', demoParams.breathAuto);
                applyExpression('happy', demoParams.expressionHappy);
                applyExpression('surprised', demoParams.expressionSurprised);

                { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; badge.textContent = _d.badge_loaded||'✓ 已載入'; badge.className = 'text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full'; }
            } catch(e) {
                { const _d=(typeof currentLang!=='undefined'&&I18N[currentLang])?I18N[currentLang]:I18N['zh-TW']; badge.textContent = _d.badge_fail||'載入失敗'; badge.className = 'text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full'; }
                placeholder.style.display = 'flex';
                canvasEl.style.display = 'none';
                console.error('Live2D load error:', e);
            }
        }

        // v65 新增：把 pose 的目前值往目標值內插（lerp），再寫入 Cubism
        // 核心參數。這是取代舊版 live2dModel.focus() 的核心函式，掛在
        // live2dApp.ticker 上、每一影格都會呼叫一次。
        function updatePose() {
            if (!live2dModel) return;
            pose.headX += (poseTarget.headX - pose.headX) * POSE_LERP;
            pose.headY += (poseTarget.headY - pose.headY) * POSE_LERP;
            pose.headZ += (poseTarget.headZ - pose.headZ) * POSE_LERP;
            pose.bodyX += (poseTarget.bodyX - pose.bodyX) * POSE_LERP;
            pose.bodyY += (poseTarget.bodyY - pose.bodyY) * POSE_LERP;
            pose.bodyZ += (poseTarget.bodyZ - pose.bodyZ) * POSE_LERP;
            pose.eyeX += (poseTarget.eyeX - pose.eyeX) * POSE_LERP;
            pose.eyeY += (poseTarget.eyeY - pose.eyeY) * POSE_LERP;

            const im = live2dModel.internalModel;
            const coreModel = im && im.coreModel;
            if (!coreModel) return;

            // 直接寫入頭部與身體相關參數（頁面已移除對應的 on/off 開關，
            // 所以總是套用拖曳所計算出的 pose 值）。
            setParamSafe(coreModel, 'ParamAngleX', pose.headX);
            setParamSafe(coreModel, 'ParamAngleY', pose.headY);
            setParamSafe(coreModel, 'ParamAngleZ', pose.headZ);
            setParamSafe(coreModel, 'ParamEyeBallX', pose.eyeX);
            setParamSafe(coreModel, 'ParamEyeBallY', pose.eyeY);
            setParamSafe(coreModel, 'ParamBodyAngleX', pose.bodyX);
            setParamSafe(coreModel, 'ParamBodyAngleY', pose.bodyY);
            setParamSafe(coreModel, 'ParamBodyAngleZ', pose.bodyZ);

            // v66 新增：表情參數（開心／驚訝）每影格都重新寫入一次，確保
            // 不會被模型自己的待機動作／眨眼等其他更新覆蓋掉。滑桿數值
            // 為 0~1，直接當作對應 Cubism 參數的權重使用。
            applyExpression('happy', demoParams.expressionHappy);
            applyExpression('surprised', demoParams.expressionSurprised);
        }

        // v66 新增：把表情滑桿的數值（0~1）套用到 EXPRESSION_PARAMS 裡列出的
        // 對應 Cubism 參數上。type 是 'happy' 或 'surprised'。
        function applyExpression(type, value) {
            if (!live2dModel) return;
            const im = live2dModel.internalModel;
            const coreModel = im && im.coreModel;
            if (!coreModel) return;
            const ids = EXPRESSION_PARAMS[type];
            if (!ids) return;

            const normalized = clamp(Number(value) || 0, 0, 1);
            const eyeOpen = 1 - normalized * 0.7;
            const mouthOpen = normalized * 0.8;

            ids.forEach((id) => {
                if (id === 'ParamEyeLOpen' || id === 'ParamEyeROpen') {
                    setParamSafe(coreModel, id, eyeOpen);
                } else if (id === 'ParamEyeROpen2') {
                    setParamSafe(coreModel, id, mouthOpen);
                } else {
                    setParamSafe(coreModel, id, normalized);
                }
            });
        }

        // v65 新增：安全地寫入單一 Cubism 參數。不同模型不一定每個參數
        // 都有（例如有些模型沒有做 ParamBodyAngleZ），找不到就靜靜跳過，
        // 不會讓整個互動功能因為某一個參數不存在而壞掉。
        function setParamSafe(coreModel, id, value) {
            try {
                if (typeof coreModel.setParameterValueById === 'function') {
                    coreModel.setParameterValueById(id, value);
                } else if (typeof coreModel.setParameterValue === 'function') {
                    coreModel.setParameterValue(id, value);
                }
            } catch (e) { /* 這個模型沒有這個參數，忽略即可 */ }
        }

        // v65 新增：把拖曳／滾輪／觸控等互動事件綁定到 #live2dWrapper 上，
        // 整個頁面存活期間只會真正執行一次（用 interactionBound 擋掉
        // 之後每次重新載入模型時的重複呼叫），避免舊版「每次重新載入
        // 模型都重新 addEventListener 一次、監聽器疊加」的問題。
        // 這裡面用到的 live2dModel / live2dApp 都是外層的可變變數，
        // 每次重新載入模型後會指向新的實例，所以事件處理常式本身
        // 不需要重新綁定，一樣可以拿到最新的模型。
        function bindInteractionEvents() {
            if (interactionBound) return;
            interactionBound = true;

            const wrapper = document.getElementById('live2dWrapper');
            wrapper.style.cursor = 'grab';
            wrapper.addEventListener('contextmenu', e => e.preventDefault()); // 允許右鍵拖曳，不彈出瀏覽器選單

            wrapper.addEventListener('mousedown', e => {
                if (!live2dModel) return;
                if (e.button === 0) {
                    isLeftDragging = true;
                } else if (e.button === 2) {
                    isRightDragging = true;
                    dragStartX = e.clientX;
                } else if (e.button === 1) {
                    isMiddleDragging = true;
                    wrapper.style.cursor = 'grabbing';
                    dragStartX = e.clientX; dragStartY = e.clientY;
                    dragStartOffsetX = viewOffsetX; dragStartOffsetY = viewOffsetY;
                } else {
                    return;
                }
                e.preventDefault();
            });

            // v68 修復：拖曳中滑鼠離開 #live2dWrapper 範圍後仍要能繼續控制
            // 模型，所以 mousemove 改綁在 document 上（不再只綁 wrapper），
            // 這樣游標移到畫布外面也收得到事件。nx/ny 換算用的 clamp()
            // 本來就會把超出畫布邊界的座標夾在 -1~1，所以滑鼠拖到畫布外
            // 時角度會自然停在該方向的最大值，不會因為超出範圍而出錯。
            document.addEventListener('mousemove', e => {
                if (!live2dModel) return;
                const rect = wrapper.getBoundingClientRect();
                // Ensure the physical mouse buttons still report pressed; if not,
                // treat as drag ended (handles cases where mouseup is missed).
                if (isLeftDragging && !(e.buttons & 1)) {
                    // emulate left-button release
                    isLeftDragging = false;
                    poseTarget.headX = 0; poseTarget.headY = 0;
                    poseTarget.bodyX = 0; poseTarget.bodyY = 0;
                    poseTarget.eyeX = 0; poseTarget.eyeY = 0;
                }
                if (isRightDragging && !(e.buttons & 2)) {
                    isRightDragging = false; poseTarget.headZ = 0; poseTarget.bodyZ = 0;
                }
                if (isMiddleDragging && !(e.buttons & 4)) {
                    isMiddleDragging = false; wrapper.style.cursor = 'grab';
                }

                // v70 修復：這三個 if 原本每一個結尾都有 return，代表只要
                // 左鍵在按，右鍵／中鍵當次的移動量就完全不會被處理——
                // 也就是同時按住左鍵＋右鍵時，Z 軸永遠不會跟著更新，跟
                // 「左右鍵一起按住要能同時正確控制 X/Y/Z」的需求不符。
                // 改成三個獨立的 if（都不 return），哪個按鍵在按，就處理
                // 哪個按鍵對應的軸向，彼此互不影響、可以同時生效。
                if (isLeftDragging) {
                    // 左鍵拖曳中：以滑鼠在畫布內的相對位置（-1~1，中心為 0）
                    // 換算成頭部/身體的 X／Y 軸目標角度，以及視線
                    // （ParamEyeBallX/Y）目標值，讓「視線跟隨」的效果
                    // 只在按住左鍵拖曳時才會發生。
                    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                    const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
                    poseTarget.headX = nx * RANGE.headX;
                    poseTarget.headY = -ny * RANGE.headY;
                    poseTarget.bodyX = nx * RANGE.bodyX;
                    poseTarget.bodyY = -ny * RANGE.bodyY;
                    poseTarget.eyeX = nx * RANGE.eye;
                    poseTarget.eyeY = -ny * RANGE.eye;
                }
                if (isRightDragging) {
                    // 右鍵拖曳中：只取水平方向（相對畫布中心，-1~1）
                    // 換算成頭部/身體的 Z 軸（歪頭/歪身）目標角度，
                    // 跟左鍵的 X/Y 軸完全分開、互不影響。
                    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                    poseTarget.headZ = nx * RANGE.headZ;
                    poseTarget.bodyZ = nx * RANGE.bodyZ;
                }
                if (isMiddleDragging) {
                    // 中鍵拖曳中：平移角色在畫布上的位置，放開後位置
                    // 會保留（不會像左右鍵那樣自動歸零），可用
                    // 「重置視角」按鈕清空。
                    viewOffsetX = dragStartOffsetX + (e.clientX - dragStartX);
                    viewOffsetY = dragStartOffsetY + (e.clientY - dragStartY);
                    applyModelTransform(rect.width, rect.height);
                    return;
                }
                // 平時（沒有按住任何鍵）：不做任何事，角色維持在目前的
                // 姿勢/位置，不會自動跟著滑鼠移動而轉動或位移。
            });

            const endLeftDrag = () => {
                if (isLeftDragging) {
                    // 放開左鍵：頭部/身體 X／Y 軸與視線都回到正中央
                    poseTarget.headX = 0; poseTarget.headY = 0;
                    poseTarget.bodyX = 0; poseTarget.bodyY = 0;
                    poseTarget.eyeX = 0; poseTarget.eyeY = 0;
                }
                isLeftDragging = false;
            };
            const endRightDrag = () => {
                if (isRightDragging) {
                    // 放開右鍵：頭部/身體 Z 軸（歪頭/歪身）回到正中央
                    poseTarget.headZ = 0; poseTarget.bodyZ = 0;
                }
                isRightDragging = false;
            };
            const endMiddleDrag = () => {
                isMiddleDragging = false;
                wrapper.style.cursor = 'grab';
            };
            // v66 修復：原本 mouseup 只綁在 #live2dWrapper 上，如果使用者
            // 在畫布內按下左鍵、把滑鼠拖到畫布範圍外面才放開按鍵，
            // wrapper 本身收不到這次 mouseup（事件會發生在游標當下所在的
            // 其他元素上），導致 isLeftDragging 卡在 true、頭部/身體角度
            // 停在最後拖曳的位置，不會如預期「放開左鍵後自動歸零」。
            // 改成把 mouseup 綁在 document 上，不管放開按鍵當下游標在
            // 頁面任何位置，都能正確結束拖曳並讓 X/Y（以及 Z、位移）
            // 回到平時（未按鍵）的狀態。
            // v69 修復：這裡原本不管哪個按鍵放開，都無條件呼叫
            // endLeftDrag()／endRightDrag()／endMiddleDrag() 三個全部執行
            // 一次——如果左右鍵同時按著、只放開右鍵，這樣寫會連還沒放開
            // 的左鍵也一起被 endLeftDrag() 誤判為「放開」，導致 X/Y 軸跟
            // 視線也被錯誤歸零。改成用 e.button 判斷「這次到底是哪一個
            // 按鍵放開」，只結束對應那一個按鍵的拖曳狀態，另一個仍按著
            // 的按鍵完全不受影響。
            document.addEventListener('mouseup', e => {
                if (e.button === 0) endLeftDrag();
                else if (e.button === 2) endRightDrag();
                else if (e.button === 1) endMiddleDrag();
            });
            // v68：拖曳中滑鼠離開畫布範圍不再視為放開按鍵（見上面 mousemove
            // 改綁 document 的說明），所以移除原本 wrapper 的 mouseleave
            // 監聽器，改完全交給 document 的 mouseup／mousemove 內的
            // e.buttons 檢查來判斷拖曳是否結束。

            // 滾輪縮放：往上滾放大、往下滾縮小，限制在 ZOOM_MIN~MAX 之間
            wrapper.addEventListener('wheel', e => {
                if (!live2dModel) return;
                e.preventDefault();
                const rect = wrapper.getBoundingClientRect();
                const zoomStep = 0.1;
                const dir = e.deltaY < 0 ? 1 : -1;
                viewZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, viewZoom + dir * zoomStep));
                applyModelTransform(rect.width, rect.height);
            }, { passive: false });

            // Touch support for mobile：
            // - 單指拖曳＝跟左鍵一樣控制頭部/身體 X／Y 軸＋視線。
            // - v66 新增：雙指按住＝跟右鍵一樣控制頭部/身體 Z 軸（歪頭），
            //   取兩指觸點中點的水平位置換算角度，跟桌面版右鍵拖曳邏輯
            //   一致。放開手指後（不論單指或雙指）都會歸零，維持跟滑鼠
            //   一致的「平時不按著就回正」手感。
            wrapper.addEventListener('touchmove', e => {
                if (!live2dModel) return;
                const rect = wrapper.getBoundingClientRect();
                if (e.touches.length >= 2) {
                    // 雙指：Z 軸（歪頭），此時不再更新 X/Y，維持雙指按下當下
                    // 的 X/Y 角度（比照右鍵拖曳時左鍵狀態不受影響的邏輯）。
                    e.preventDefault(); // 避免瀏覽器把雙指手勢誤判成頁面縮放/捲動
                    isTwoFingerTouch = true;
                    const t0 = e.touches[0], t1 = e.touches[1];
                    const midX = (t0.clientX + t1.clientX) / 2;
                    const nx = clamp(((midX - rect.left) / rect.width) * 2 - 1, -1, 1);
                    poseTarget.headZ = nx * RANGE.headZ;
                    poseTarget.bodyZ = nx * RANGE.bodyZ;
                    return;
                }
                // 單指：X/Y 軸＋視線跟隨
                const touch = e.touches[0];
                const nx = clamp(((touch.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                const ny = clamp(((touch.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
                poseTarget.headX = nx * RANGE.headX;
                poseTarget.headY = -ny * RANGE.headY;
                poseTarget.bodyX = nx * RANGE.bodyX;
                poseTarget.bodyY = -ny * RANGE.bodyY;
                poseTarget.eyeX = nx * RANGE.eye;
                poseTarget.eyeY = -ny * RANGE.eye;
            }, { passive: false });
            wrapper.addEventListener('touchend', e => {
                // 所有手指都放開了：X/Y、Z、視線全部歸零
                if (e.touches.length === 0) {
                    poseTarget.headX = 0; poseTarget.headY = 0;
                    poseTarget.bodyX = 0; poseTarget.bodyY = 0;
                    poseTarget.eyeX = 0; poseTarget.eyeY = 0;
                    if (isTwoFingerTouch) { poseTarget.headZ = 0; poseTarget.bodyZ = 0; }
                    isTwoFingerTouch = false;
                } else if (e.touches.length === 1 && isTwoFingerTouch) {
                    // 從雙指變成單指：先把 Z 軸歸零，剩下的單指觸點會在下一次
                    // touchmove 繼續驅動 X/Y 軸。
                    poseTarget.headZ = 0; poseTarget.bodyZ = 0;
                    isTwoFingerTouch = false;
                }
            });
            wrapper.addEventListener('touchcancel', () => {
                poseTarget.headX = 0; poseTarget.headY = 0;
                poseTarget.bodyX = 0; poseTarget.bodyY = 0;
                poseTarget.eyeX = 0; poseTarget.eyeY = 0;
                poseTarget.headZ = 0; poseTarget.bodyZ = 0;
                isTwoFingerTouch = false;
            });

            // 由於改用 CSS class 控制「放大檢視」行為（讓模型視窗變大並
            // 顯示右側控制面板），不再直接使用 Fullscreen API，因此不綁定
            // fullscreenchange 事件。handleEnlargeViewChange 仍可被手動
            // 呼叫來重新計算大小。
        }

        // v64：統一套用「位移 + 縮放」到模型上的地方，中鍵拖曳、滾輪縮放、
        // 重置視角都呼叫這個函式，確保疊加方式一致。頭部/身體轉向
        // （左鍵/右鍵拖曳）不透過這裡，是由 updatePose() 每影格寫入
        // Cubism 參數。w, h 是畫布目前的寬高（用來算出中心點）。
        function applyModelTransform(w, h) {
            if (!live2dModel) return;
            try {
                live2dModel.scale.set(baseScale * viewZoom);
                live2dModel.x = w / 2 + viewOffsetX;
                live2dModel.y = h / 2 + viewOffsetY;
            } catch (e) {}
        }

        // 「重置視角」按鈕：把中鍵拖曳位移/滾輪縮放的效果都清空，還原成
        // 模型剛載入時「置中並剛好塞滿畫布」的狀態。（左鍵/右鍵造成的
        // 頭部/身體角度不受這顆按鈕影響，放開左右鍵時本來就會自動回正。）
        function resetView() {
            viewOffsetX = 0; viewOffsetY = 0; viewZoom = 1;
            if (!live2dModel) return;
            const wrapper = document.getElementById('live2dWrapper');
            const rect = wrapper.getBoundingClientRect();
            applyModelTransform(rect.width, rect.height);
        }

        // v65 新增、v66 調整：「放大檢視」按鈕——把展示區放大顯示，方便
        // 使用者近距離觀察模型細節。
        // v67 修復（真正根本原因）：改用 CSS 類別（model-enlarged）搭配
        // `position: fixed` 本來應該能把 #modelShowcaseGrid 疊在整個
        // 瀏覽器視窗上方，但實測畫面卻卡在頁面中段、只填滿一小塊區域、
        // 右側面板還被截斷——原因是 #modelShowcaseGrid 的祖先元素
        // #page-model 套用了 common.css 的 `.page-content { animation:
        // fadeIn ... forwards }`，這段動畫的 `to` 狀態是
        // `transform: translateY(0)`，且用了 forwards，代表動畫播完後
        // 這個 translateY(0)（雖然數值上等於沒有位移）仍然會保留在
        // computed style 上。根據 CSS 規範，只要祖先元素有「任何」
        // transform（即使是恆等變換），就會變成該祖先自己的座標系統，
        // 讓底下 position:fixed 的子元素以「這個祖先的框」而不是「整個
        // 瀏覽器視窗」作為定位基準——這正是放大檢視「沒有真的填滿整個
        // 視窗」的根本原因，純粹是 CSS containing block 的規則，跟先前
        // 猜測的 grid-column 版面問題是兩個不同層次的 bug（那個已經修過
        // 了，這個才是造成「放大效果依然錯誤」的主因）。
        // 修法：放大時把 #modelShowcaseGrid 這個 DOM 節點直接搬到
        // <body> 最底下（body 本身沒有 transform，不會有 containing
        // block 問題），關閉放大檢視時再搬回原本的位置——用一個空白
        // 註解節點 enlargePlaceholder 記住原本插入點。canvas 元素本身
        // 只是被移動位置，並不會被移除/重建，所以搬動前後 PIXI 的
        // WebGL context 與已載入的模型都不會受影響。
        let enlargePlaceholder = null;
        function toggleEnlargeView() {
            const showcase = document.getElementById('modelShowcaseGrid');
            const isEnlarged = document.body.classList.contains('model-enlarged');
            if (!isEnlarged) {
                enlargePlaceholder = document.createComment('model-enlarge-placeholder');
                showcase.parentNode.insertBefore(enlargePlaceholder, showcase);
                document.body.appendChild(showcase);
                document.body.classList.add('model-enlarged');
            } else {
                if (enlargePlaceholder && enlargePlaceholder.parentNode) {
                    enlargePlaceholder.parentNode.insertBefore(showcase, enlargePlaceholder);
                    enlargePlaceholder.remove();
                }
                enlargePlaceholder = null;
                document.body.classList.remove('model-enlarged');
            }
            // 按鈕文字/圖示/提示要跟著目前狀態切換——放大後應該顯示
            // 「縮小檢視」，不然使用者放大後找不到怎麼縮回去。
            const nowEnlarged = !isEnlarged;
            const icon = document.getElementById('enlargeViewIcon');
            const label = document.getElementById('enlargeViewLabel');
            const btn = document.getElementById('enlargeViewBtn');
            if (icon) icon.className = nowEnlarged ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
            if (label) label.textContent = nowEnlarged ? '縮小檢視' : '放大檢視';
            if (btn) btn.title = nowEnlarged ? '縮小檢視（還原成一般畫面）' : '放大檢視（全螢幕）';
            // 等 layout 穩定後重新計算 renderer/scale
            setTimeout(handleEnlargeViewChange, 80);
        }

        // 全螢幕切換完成後，容器的實際像素尺寸會改變，這裡重新量測、
        // 重新計算 baseScale，並用 renderer.resize() 讓 PIXI 的繪圖緩衝
        // 跟上新的容器大小，避免畫面模糊或比例跑掉。
        function handleEnlargeViewChange() {
            if (!live2dApp || !live2dModel) return;
            const wrapper = document.getElementById('live2dWrapper');
            const w = wrapper.clientWidth || 400, h = wrapper.clientHeight || 420;
            try {
                live2dApp.renderer.resize(w, h);
                baseScale = Math.min(w / live2dModel.internalModel.originalWidth, h / live2dModel.internalModel.originalHeight) * 0.85;
                applyModelTransform(w, h);
            } catch (e) {}
        }

        // v66：「物理強度」「呼吸速度」兩個滑桿已依需求移除，物理演算／
        // 自動呼吸仍可用面板上的「物理演算」「呼吸自動」開關整組開/關
        // （見 toggleSwitch()），只是不再提供強度/速度的細部調整。

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

        // v66：type 現在是 'expressionHappy'（開心）或 'expressionSurprised'
        // （驚訝），滑桿數值 0~100 換算成 0~1 存進 demoParams，並即時套用
        // 到模型上（之後每個影格 updatePose() 也會持續套用，避免被模型
        // 自己的更新覆蓋掉，這裡先套用一次是為了讓滑桿手感更即時）。
        function updateParam(type, val) {
            const pct = Math.round(val);
            demoParams[type] = pct / 100;
            if (type === 'expressionHappy') {
                const el = document.getElementById('expressionHappyVal');
                if (el) el.textContent = pct + '%';
            }
            if (type === 'expressionSurprised') {
                const el = document.getElementById('expressionSurprisedVal');
                if (el) el.textContent = pct + '%';
            }

            if (live2dModel) {
                try {
                    if (type === 'expressionHappy') applyExpression('happy', demoParams.expressionHappy);
                    if (type === 'expressionSurprised') applyExpression('surprised', demoParams.expressionSurprised);
                } catch(e) {}
            }
        }

        function toggleSwitch(type, val) {
            demoParams[type] = val;
            if (!live2dModel) return;
            try {
                // v72 修復（真正根本原因）：pixi-live2d-display 0.4.0 的
                // Cubism4InternalModel.update() 內部呼叫眨眼更新時，只檢查
                // 「這一影格有沒有動作正在播放」（!motionUpdated），完全沒有
                // 去讀取 eyeBlink.enabled 這個旗標——也就是說設定
                // eyeBlink.enabled = false 對函式庫本身的更新迴圈毫無作用，
                // 眨眼還是會照樣持續觸發，這才是「眨眼自動」開關按了卻沒有
                // 反應的真正原因。改成跟下面 physics／breathAuto 開關一樣的
                // 做法：關閉時把 internalModel.eyeBlink 整個備份後拿掉
                // （設成 null），因為 update() 裡是用
                // `this.eyeBlink?.updateParameters(...)` 這種 optional
                // chaining 呼叫，暫時設成 null 是安全的；同時把眼睛參數
                // 重設回 1（張開），避免關閉當下卡在半閉眼的畫面。
                if (type === 'blink') {
                    const im = live2dModel.internalModel;
                    if (im._eyeBlinkBackup === undefined) im._eyeBlinkBackup = im.eyeBlink;
                    im.eyeBlink = val ? im._eyeBlinkBackup : null;
                    if (im.coreModel && !val) {
                        setParamSafe(im.coreModel, 'ParamEyeLOpen', 1);
                        setParamSafe(im.coreModel, 'ParamEyeROpen', 1);
                    }
                }

                if (type === 'physics') {
                    const im = live2dModel.internalModel;
                    if (im._physicsBackup === undefined) im._physicsBackup = im.physics;
                    im.physics = val ? im._physicsBackup : null;
                }

                if (type === 'breathAuto') {
                    const im = live2dModel.internalModel;
                    const coreModel = im && im.coreModel;
                    if (im._breathBackup === undefined) im._breathBackup = im.breath;
                    im.breath = val ? im._breathBackup : null;
                    if (coreModel && !val) {
                        setParamSafe(coreModel, 'ParamBreath', 0);
                        setParamSafe(coreModel, 'ParamBreath2', 0);
                    }
                }
            } catch(e) {}
        }

        // ---- Intro avatar sound ----
        // v58：playIntroSound()／playBonk()／getSfxCtx() 已經搬回
        // common.js（該邏輯其實是全站共用的「點頭貼」互動的一部分，
        // 首頁的自我介紹頭貼按鈕也在用），這支頁面專屬的檔案不用再
        // 重複定義一份。
        // v65：原本這裡有 live2dModel.on('hit', …) 監聽器，點擊模型的
        // 頭部/身體會觸發 playIntroSound()／playBonk() 並播放對應動畫
        // （FlickHead／TapBody）。「點擊頭部觸發表情」「點擊身體觸發
        // 動作」這兩個功能已經整個移除（改成只能用右側面板的按鈕觸發
        // 動畫），所以這裡也不再呼叫這兩個音效函式；common.js 裡的
        // 定義本身不受影響，首頁頭貼按鈕仍可正常使用。
