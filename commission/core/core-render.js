var quantities = window.CORE_QUANTITIES;
var prices = window.CORE_PRICES;

function toggleQtyItem(type) {
  const cb = document.getElementById(type);
  if (!cb) return;
  if (cb.checked && quantities[type] === 0) {
    quantities[type] = 1;
    document.getElementById(type + "Qty").textContent = 1;
  } else if (!cb.checked) {
    quantities[type] = 0;
    document.getElementById(type + "Qty").textContent = 0;
  }
  calculate();
}

function changeQty(type, delta) {
  quantities[type] = Math.max(0, quantities[type] + delta);
  document.getElementById(type + "Qty").textContent = quantities[type];

  if (document.getElementById(type))
    document.getElementById(type).checked = quantities[type] > 0;
  calculate();
}

function selectPayment(selected) {
  ["bank", "paypal", "ecpay"].forEach((p) => {
    if (p !== selected) document.getElementById(p).checked = false;
  });
  document.getElementById(selected).checked = true;
  calculate();
  syncCheckboxVisuals();
}

function updatePaymentFields() {
  calculate();
}

function toggleSubmitButton() {
  const checked = document.getElementById("agreeTerms").checked;

  document.getElementById("copyBtn").disabled = !checked;

  const badge = document.getElementById("orderBadgeVP");
  if (badge) badge.style.display = checked ? "" : "none";
  if (checked) {
    const orderEl = document.getElementById("orderIdVP");
    if (
      orderEl &&
      (!orderEl.textContent.trim() || orderEl.textContent.trim() === "—")
    ) {
      orderEl.textContent = generateOrderNumber("vp");
    }
  }

  const copyBtn = document.getElementById("btn-copy-summary-vp");
  if (copyBtn) {
    copyBtn.disabled = !checked;
    copyBtn.style.opacity = checked ? "1" : "0.45";
    copyBtn.style.cursor = checked ? "pointer" : "not-allowed";
  }
}

function toggleRushField() {
  document
    .getElementById("rushContainer")
    .classList.toggle("hidden", !document.getElementById("rush").checked);
  calculate();
}

function calculate() {
  let baseElement = document.querySelector('input[name="baseModel"]:checked');
  let basePrice = baseElement ? parseInt(baseElement.value) : 15000;

  const isTopPlan = basePrice === 20000;
  const fxCb = document.getElementById("specialFx");
  const fxLabel = fxCb ? fxCb.closest("label") : null;
  if (fxCb) {
    if (isTopPlan) {
      fxCb.checked = false;
      fxCb.disabled = true;
      quantities["specialFx"] = 0;
      const fxQtyEl = document.getElementById("specialFxQty");
      if (fxQtyEl) fxQtyEl.textContent = "0";

      if (fxLabel) {
        fxLabel.style.opacity = "0.42";
        fxLabel.style.cursor = "not-allowed";
        fxLabel.style.pointerEvents = "none";

        let incTag = fxLabel.querySelector(".fx-included-tag");
        if (!incTag) {
          const _d2 =
            typeof currentLang !== "undefined" && I18N[currentLang]
              ? I18N[currentLang]
              : I18N["zh-TW"];
          incTag = document.createElement("span");
          incTag.className = "fx-included-tag";
          incTag.style.cssText =
            "font-size:.65rem;font-weight:700;color:#fbbf24;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);border-radius:4px;padding:1px 6px;margin-left:6px;letter-spacing:.03em;";
          incTag.textContent = _d2.plan_compare_fx_top || "✦ 內含基礎特效";
          const fxTitle = fxLabel.querySelector('[data-i18n="opt_fx"]');
          if (fxTitle)
            fxTitle.parentElement.insertBefore(incTag, fxTitle.nextSibling);
        }
      }
    } else {
      fxCb.disabled = false;
      if (fxLabel) {
        fxLabel.style.opacity = "";
        fxLabel.style.cursor = "";
        fxLabel.style.pointerEvents = "";

        const incTag = fxLabel.querySelector(".fx-included-tag");
        if (incTag) incTag.remove();
      }
    }
  }
  syncCheckboxVisuals();

  let extra = 0;
  const _d =
    typeof currentLang !== "undefined" && I18N[currentLang]
      ? I18N[currentLang]
      : I18N["zh-TW"];
  const _planKey = prices.base[basePrice];
  const _planName = _d[_planKey] || _planKey;
  let details = [
    { name: `[${_d.core_s1 || "方案"}] ${_planName}`, price: basePrice },
  ];

  ["tongue", "ear", "tail", "vowel"].forEach((id) => {
    if (document.getElementById(id) && document.getElementById(id).checked) {
      extra += prices[id];
      const _nm = {
        tongue: _d.opt_tongue || "吐舌",
        ear: _d.opt_ear || "獸耳",
        tail: _d.opt_tail || "尾巴",
        vowel: _d.opt_vowel || "母音口型",
      }[id];
      details.push({ name: _nm, price: prices[id] });
    }
  });
  [
    "extraExpr",
    "smallAcc",
    "hairset",
    "clothes",
    "gesture",
    "pose",
    "specialFx",
  ].forEach((type) => {
    if (
      document.getElementById(type) &&
      document.getElementById(type).checked &&
      quantities[type] > 0
    ) {
      let cost = quantities[type] * prices[type];
      extra += cost;
      const _nmap = {
        extraExpr: _d.opt_expr || "表情",
        smallAcc: _d.opt_acc || "小配件",
        hairset: _d.opt_hair || "髮型",
        clothes: _d.opt_clothes || "服裝",
        gesture: _d.opt_gesture || "手勢",
        pose: _d.opt_pose || "姿態",
        specialFx: _d.opt_fx || "特效動畫",
      };
      let n = _nmap[type];
      details.push({ name: `${n} x${quantities[type]}`, price: cost });
    }
  });
  ["trackingLoss", "loli", "vbridger"].forEach((id) => {
    if (document.getElementById(id) && document.getElementById(id).checked) {
      extra += prices[id];
      const _sn = {
        trackingLoss: _d.opt_tracking || "追蹤丟失動畫",
        loli: _d.opt_chibi || "人物Q版化",
        vbridger: _d.opt_vbridger || "VBridger",
      }[id];
      details.push({ name: _sn, price: prices[id] });
    }
  });

  let subtotalForProject = basePrice + extra;

  if (
    document.getElementById("projectFile") &&
    document.getElementById("projectFile").checked
  ) {
    let projectCost = Math.round(subtotalForProject * 1.5);
    extra += projectCost;
    details.push({
      name: `${_d.opt_project || "工程資料加購"} (x1.5)`,
      price: projectCost,
    });
  }

  if (
    document.getElementById("rush") &&
    document.getElementById("rush").checked
  ) {
    let rushPrice =
      parseInt(document.getElementById("rushPrice").value) || 3500;
    extra += rushPrice;
    details.push({ name: _d.opt_rush || "加急趕工", price: rushPrice });
  }

  let subtotal = basePrice + extra;
  let fee = 0;
  let paymentMethod = _d.pay_bank || "銀行匯款";
  if (document.getElementById("paypal").checked) {
    let rate = parseFloat(document.getElementById("paypalRate").value) || 0;
    fee += Math.round(subtotal * (rate / 100));
    paymentMethod = "PayPal";
    if (fee > 0)
      details.push({
        name: `PayPal ${_d.pay_fee || "手續費"} (${rate}%)`,
        price: fee,
      });
  } else if (document.getElementById("ecpay").checked) {
    let rate = parseFloat(document.getElementById("ecpayRate").value) || 0;
    fee += Math.round(subtotal * (rate / 100));
    paymentMethod = _d.pay_ecpay || "綠界/超商";
    if (fee > 0)
      details.push({
        name: `${_d.pay_ecpay || "綠界"} ${_d.pay_fee || "手續費"} (${rate}%)`,
        price: fee,
      });
  }

  let finalTotal = subtotal + fee;
  const plan = document.querySelector(
    'input[name="paymentPlan"]:checked',
  ).value;
  let paymentHtml = "";

  if (plan === "one") {
    paymentHtml = `${_d.pay_one || "一次付清"}：<strong class="text-emerald-400">${getCurrencyPrefix()}${formatMoney(finalTotal)}</strong>`;
  } else if (plan === "two") {
    let instFee = Math.round(finalTotal * 0.03);
    finalTotal += instFee;
    details.push({
      name: `${_d.pay_two || "兩期分款"} ${_d.pay_fee || "手續費"} (3%)`,
      price: instFee,
    });
    paymentHtml = `<div class="flex justify-between"><span>第一期 (50%):</span> <strong class="text-white">${getCurrencyPrefix()}${formatMoney(Math.round(finalTotal * 0.5))}</strong></div>`;
  } else if (plan === "three") {
    let instFee = Math.round(finalTotal * 0.05);
    finalTotal += instFee;
    details.push({
      name: `${_d.pay_three || "三期分款"} ${_d.pay_fee || "手續費"} (5%)`,
      price: instFee,
    });
    paymentHtml = `<div class="flex justify-between"><span>第一期 (40%):</span> <strong class="text-white">${getCurrencyPrefix()}${formatMoney(Math.round(finalTotal * 0.4))}</strong></div>`;
  }

  document.getElementById("depositInfo").innerHTML = paymentHtml;
  document.getElementById("totalPrice").textContent =
    `${getCurrencyPrefix()}${formatMoney(finalTotal)}`;
  document.getElementById("detailList").innerHTML = details
    .map(
      (i) =>
        `<div class="flex justify-between py-1 border-b border-white/5"><span>${i.name}</span><span>${getCurrencyPrefix()}${formatMoney(i.price)}</span></div>`,
    )
    .join("");

  window.currentQuoteDetails = details;
  window.currentFinalTotal = finalTotal;
  window.currentPayment = paymentMethod;
  window.currentPaymentPlan = plan;

  window.currentVpDetails = details;
  window.currentVpTotal = finalTotal;

  const rushText = document.getElementById("rushInfo")?.value || "";
  const suppText = document.getElementById("supplementInfo")?.value || "";
  const rushBlock = document.getElementById("quoteRushSummary");
  const suppBlock = document.getElementById("quoteSuppSummary");
  if (rushBlock) {
    rushBlock.classList.toggle("hidden", !rushText.trim());
    document.getElementById("quoteRushSummaryText").textContent = rushText;
  }
  if (suppBlock) {
    suppBlock.classList.toggle("hidden", !suppText.trim());
    document.getElementById("quoteSuppSummaryText").textContent = suppText;
  }
  syncCheckboxVisuals();
}

function resetForm() {
  document
    .querySelectorAll('#page-core input[type="checkbox"]')
    .forEach((i) => (i.checked = false));

  const defaultRadio = document.querySelector(
    '#page-core input[name="baseModel"][value="15000"]',
  );
  if (defaultRadio) defaultRadio.checked = true;
  const defaultPlan = document.querySelector(
    '#page-core input[name="paymentPlan"][value="one"]',
  );
  if (defaultPlan) defaultPlan.checked = true;

  Object.keys(quantities).forEach((k) => {
    quantities[k] = 0;
    const qEl = document.getElementById(k + "Qty");
    if (qEl) qEl.textContent = 0;
  });

  const rushContainer = document.getElementById("rushContainer");
  if (rushContainer) rushContainer.classList.add("hidden");
  const rushInfo = document.getElementById("rushInfo");
  if (rushInfo) rushInfo.value = "";
  const suppInfo = document.getElementById("supplementInfo");
  if (suppInfo) suppInfo.value = "";

  const vpOrd = document.getElementById("orderIdVP");
  if (vpOrd) vpOrd.textContent = "—";
  calculate();
  syncCheckboxVisuals();
}

const calculateDebounced = debounce(function () {
  if (typeof calculate === "function") calculate();
}, 150);

function togglePlanCompare(btn) {
  const body = document.getElementById("planCompareBody");
  const arrow = document.getElementById("planCompareArrow");
  const open = !body.classList.contains("hidden");
  body.classList.toggle("hidden", open);
  arrow.style.transform = open ? "" : "rotate(180deg)";
  btn.setAttribute("aria-expanded", String(!open));

  const hintEl = btn.querySelector('[data-i18n="plan_compare_hint"]');
  if (hintEl) {
    const _d =
      typeof currentLang !== "undefined" && I18N[currentLang]
        ? I18N[currentLang]
        : I18N["zh-TW"];
    hintEl.textContent = open
      ? _d.plan_compare_hint || "（點擊展開）"
      : _d.plan_compare_hint_open || "（點擊收合）";
  }
}

const _origCalc = calculate;
calculate = function () {
  const el = document.getElementById("totalPrice");
  const from = el ? parseInt(el.textContent.replace(/[^0-9]/g, "") || "0") : 0;
  _origCalc && _origCalc();
  if (!el) return;
  const to = parseInt(el.textContent.replace(/[^0-9]/g, "") || "0");
  if (from !== to) animateCounter(el, from, to);
};

_origCalc();

revealAmountOnLoad(document.getElementById("totalPrice"));

initFloatingQuoteBar("quoteSummaryPanel", "totalPrice");

initScrollFollowPanel(".sticky-summary", "page-core");
