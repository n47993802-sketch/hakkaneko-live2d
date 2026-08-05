/* ============================================================
   阿卡貓 HakkaNeko 網站 — 背景特效：流星 / 星空 / 星雲
   從 common.js 拆分獨立而來（原「創意背景動畫 V2」區塊）。

   用途：
   - 在 <canvas id="meteor-canvas"> 上繪製會持續飄落的流星、
     閃爍星點、星雲光暈與漂浮光球，作為全站的背景裝飾動畫。
   - 對外只暴露一個函式：window.setMeteorMode(isLight)，
     由 common.js 的日夜模式切換（toggleTheme）呼叫，
     用來讓特效在白天模式下變得更柔和、夜晚模式下更明顯。

   相依性：
   - 需要頁面中存在 <canvas id="meteor-canvas"></canvas>
     （每個頁面的 <body> 最上方都已經放好）。
   - 不依賴 common.js 內的任何函式或變數，可獨立運作，
     但實務上仍建議在 common.js 之前載入，
     這樣 toggleTheme() 呼叫 setMeteorMode 時已經存在。

   若之後想調整流星數量、速度、顏色、星星密度等視覺參數，
   只需要編輯這一個檔案，不會影響到其他頁面邏輯。
   ============================================================ */
        (function() {
            const canvas = document.getElementById('meteor-canvas');
            const ctx = canvas.getContext('2d');
            let meteors = [], stars = [], nebulae = [], orbs = [];
            let animId, isLight = false, t = 0;
            let _resizeTimer = null;
            let isRunning = false; // v53：真正的「迴圈是否正在跑」狀態，取代之前「一直排程、只是跳過畫圖」的做法

            // v53 修復（效能問題）：
            // 之前不管是「分頁切到背景」還是「淺色模式」，animation loop
            // 都還是會透過 requestAnimationFrame 永遠重新排程下一幀，只是
            // 跳過實際畫圖動作——等於就算畫面上完全看不到任何東西，還是
            // 每一幀都在做至少一次 ctx.clearRect()，持續耗電/耗效能，
            // 而且完全沒有偵測「減少動態效果」這個系統設定，開啟該設定的
            // 使用者（通常也更在意效能／暈眩問題）反而完全沒被照顧到，
            // 動畫其實還是在一個被 CSS 藏起來的畫布上全力運算。
            // 改成：用 shouldRun() 統一判斷「現在到底該不該跑」，該停的
            // 時候用 cancelAnimationFrame() 真正停止，不留著空轉的迴圈；
            // 該恢復的時候（切回深色模式／分頁重新可見／使用者關掉減少
            // 動態效果）才重新呼叫 requestAnimationFrame() 啟動一次。
            const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
            function shouldRun() {
                return !document.hidden && !isLight && !reducedMotionMQ.matches;
            }
            function startLoop() {
                if (isRunning) return;
                isRunning = true;
                _lastTs = 0; // 避免暫停一段時間後恢復時，第一幀的時間差被誤判成「掉幀」而觸發降級模式
                animId = requestAnimationFrame(draw);
            }
            function stopLoop() {
                isRunning = false;
                if (animId) cancelAnimationFrame(animId);
            }

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
                // v53：不管是分頁不可見、淺色模式、還是使用者開了「減少
                // 動態效果」，只要現在不該跑，就直接真正停止（不再呼叫
                // requestAnimationFrame 排下一幀），迴圈到此為止，等
                // shouldRun() 重新變成 true 時才會由 startLoop() 重新啟動。
                if (!shouldRun()) { isRunning = false; return; }

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

            window.setMeteorMode = function(light) {
                isLight = light;
                if (shouldRun()) {
                    startLoop();
                } else {
                    stopLoop();
                    // 切到淺色模式的當下清空一次畫布，避免最後一幀的星星／
                    // 流星殘影凍結在畫面上（迴圈已經真正停止，不會再自己清）。
                    if (isLight) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };

            // v53：分頁被切到背景／重新回到前景時，對應真正停止／恢復迴圈，
            // 不再讓迴圈自己空轉排程。
            document.addEventListener('visibilitychange', function() {
                if (shouldRun()) startLoop(); else stopLoop();
            });

            // v53：即時監聽「減少動態效果」系統設定的變化（使用者有可能在
            // 分頁開著的狀態下臨時切換這個設定），開啟時真正停止迴圈並清空
            // 畫布，關閉時才重新啟動。
            try {
                reducedMotionMQ.addEventListener('change', function() {
                    if (shouldRun()) {
                        startLoop();
                    } else {
                        stopLoop();
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                });
            } catch (e) {}

            window.addEventListener('resize', resizeDebounced);
            resize();
            if (shouldRun()) startLoop();
        })();
