/* ============================================================
   阿卡貓 HakkaNeko 網站 — V皮設計頁 報價計算機邏輯
   ============================================================
   從 common.js 拆分出來，只有 core.html 會載入這個檔案。
   需要先載入 core-config.js（提供 window.CORE_QUANTITIES / window.CORE_PRICES）。
   ============================================================ */
var quantities = window.CORE_QUANTITIES;
var prices = window.CORE_PRICES;

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

        // getQuoteText() 已移除：舊版純文字報價摘要產生器，只有已刪除的
        // copyQuote()/screenshotAndEmail() 會用到，目前的 screenshotQuote()
        // 走的是 html2canvas 截圖路線，不需要文字版摘要了。

        // copyQuote() 已移除：舊版「純文字複製到剪貼簿」按鈕的邏輯，
        // 已被目前 core.html 實際使用的 screenshotQuote()（截圖+自動產生
        // 委託編號）取代，沒有任何按鈕在呼叫它了。

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

        const calculateDebounced     = debounce(function() { if (typeof calculate     === 'function') calculate(); },     150);

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

// v37 修復：右側報價原本要等 window.onload（頁面所有資源都載入完成後，
// 通常比畫面第一次顯示晚不少）才會第一次計算，這段時間畫面顯示的是
// core.html 寫死的預設文字「NT$ 15,000」，等 window.onload 觸發計算後
// 才「跳成」實際金額——這就是右側報價感覺閃一下/跳動的原因。
// 這裡讓 calculate() 在這支腳本一載入就立刻執行一次（此時表單元素都
// 已經在 DOM 中，可以安全讀取），畫面一開始顯示的就已經是正確金額，
// 不會再有「先顯示預設文字、之後又跳成計算結果」的情況。
calculate();
