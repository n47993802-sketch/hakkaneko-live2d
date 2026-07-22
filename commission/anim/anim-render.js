/* ============================================================
   阿卡貓 HakkaNeko 網站 — 動畫設計頁 報價計算機邏輯
   ============================================================
   從 common.js 拆分出來，只有 anim.html 會載入這個檔案。

   跟 core.html 不一樣，動畫設計目前沒有另外拆一份 anim-config.js：
   這裡的價格都是直接讀取 anim.html 上 <input value="..."> 的數值
   （例如加急費 animRushPrice），本來就沒有一個獨立的 JS 價格物件
   可以拆分，之後如果想比照 core-config.js 做法把價格集中管理，
   需要先調整 anim.html 的表單結構，可以之後再一起討論。
   ============================================================ */
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

        function sanitizeNumberInput(el, min, max) {
            var raw = String(el.value).replace(/[^0-9]/g, '');
            var val = parseInt(raw, 10);
            if (isNaN(val) || val < min) val = min;
            if (max !== undefined && val > max) val = max;
            el.value = val;
        }

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

        // getAnimQuoteText() 已移除：舊版純文字報價摘要產生器，只有已刪除的
        // copyAnimQuote()/screenshotAndEmail() 會用到，目前的 screenshotQuote()
        // 走的是 html2canvas 截圖路線，不需要文字版摘要了。

        // copyAnimQuote() 已移除：舊版「純文字複製到剪貼簿」按鈕的邏輯，
        // 已被目前 anim.html 實際使用的 screenshotQuote()（截圖+自動產生
        // 委託編號）取代，沒有任何按鈕在呼叫它了。

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

        const calculateAnimDebounced = debounce(function() { if (typeof calculateAnim === 'function') calculateAnim(); }, 150);

        function selectPaymentAnim(s) { ['bank', 'paypal', 'ecpay'].forEach(p => document.getElementById('anim'+p.charAt(0).toUpperCase()+p.slice(1)).checked = (p === s)); calculateAnim(); syncCheckboxVisuals();
            // 委託編號：第一次報價時生成，之後固定不變
            // v39 修復：這裡原本寫的是 orderIdVP（V皮頁的元素 id），anim.html 根本沒有
            // 這個元素，等於一直是無效程式碼（有做 null 檢查所以不會噴錯，但完全沒作用）。
            // 應該讀寫的是這一頁自己的 orderIdAnim。
            const animOrderElPay = document.getElementById('orderIdAnim');
            if (animOrderElPay && animOrderElPay.textContent.trim() === '\u2014') {
                animOrderElPay.textContent = generateOrderNumber('anim');
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


// v40 修復：金額滾動數字動畫的「包裝」邏輯，原本放在 common.js 裡，
// 但 common.js 比這支檔案先載入，那時候 calculateAnim 根本還沒定義，
// 包裝了個寂寞，等這支檔案稍後才真正定義 calculateAnim() 時，又會把
// 包裝版本整個蓋掉——滾動動畫因此從沒真正生效過。現在把「包裝」的
// 動作移來這裡，確保是在 calculateAnim() 真正定義好之後才進行包裝，
// 順序才正確。（animateCounter() 本身仍是 common.js 提供的共用工具函式。）
//
// v41 修復：上一版這裡用了 debounce 包一層，邏輯有誤——debounce 延後
// 執行的那個函式，會「重新」讀一次 el.textContent 當作 from（這時候
// textContent 其實已經被 _origAnimCalc() 更新成新數字了），導致 from
// 跟 to 永遠相等、動畫條件永遠不成立，滾動動畫完全沒有觸發。
// 這裡不需要 debounce：calculateAnim() 只會在 checkbox/radio 的
// onchange 事件觸發，不是連續輸入，不會有需要節流的高頻率呼叫情境。
// 正確做法是單純同步執行：先記錄舊值 → 呼叫 _origAnimCalc() 讓它把
// 新值寫進畫面 → 立刻用「舊值→新值」呼叫 animateCounter()。
const _origAnimCalc = calculateAnim;
calculateAnim = function() {
    const el = document.getElementById('animTotalPrice');
    const from = el ? parseInt(el.textContent.replace(/[^0-9]/g, '') || '0') : 0;
    _origAnimCalc && _origAnimCalc();
    if (!el) return;
    const to = parseInt(el.textContent.replace(/[^0-9]/g, '') || '0');
    if (from !== to) animateCounter(el, from, to);
};

// v37 修復：右側報價原本要等 window.onload（頁面所有資源都載入完成後，
// 通常比畫面第一次顯示晚不少）才會第一次計算，這段時間畫面顯示的是
// anim.html 寫死的預設文字「NT$ 8,000」，等 window.onload 觸發計算後
// 才「跳成」實際金額——這就是右側報價感覺閃一下/跳動的原因。
// 這裡讓 calculateAnim() 在這支腳本一載入就立刻執行一次（此時表單元素
// 都已經在 DOM 中，可以安全讀取），畫面一開始顯示的就已經是正確金額，
// 不會再有「先顯示預設文字、之後又跳成計算結果」的情況。
// 注意：這裡刻意呼叫 _origAnimCalc()（沒有滾動動畫的原始版本），不是
// 上面包裝過的 calculateAnim()——如果用包裝版本，畫面會先顯示 HTML 寫死
// 的預設金額，被 animateCounter() 從那個假預設值「滾動」到正確金額，
// 等於又重新做出一次一開始就想避免的視覺跳動。之後使用者互動觸發的
// calculateAnim() 才需要滾動動畫，第一次不需要。
_origAnimCalc();
