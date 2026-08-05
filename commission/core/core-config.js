/* ============================================================
   阿卡貓 HakkaNeko 網站 — V皮設計頁 報價設定檔
   ============================================================
   core.html 專用。V皮設計的加購項目單價都在 window.CORE_PRICES，
   之後價格異動，只需要編輯這個物件即可，不用去 core-render.js 裡找。
   window.CORE_QUANTITIES 是「加購項目的初始數量」，開頁時都從 0 開始，
   一般不需要更動。

   注意：基礎方案（15000/20000/25000 那三個)不是在這裡設定，而是
   直接寫在 core.html 的 <input type="radio" value="..."> 上，
   因為那是「選一個」的方案而不是「可加購數量」，兩種價格結構不同，
   維持原本寫在 HTML 上的方式比較直覺（直接在頁面上看到方案跟價格）。
   ============================================================ */
        window.CORE_QUANTITIES = { extraExpr: 0, smallAcc: 0, gesture: 0, pose: 0, hairset: 0, clothes: 0, specialFx: 0 };
        window.CORE_PRICES = { base: {10000: "plan_basic", 15000: "plan_pro", 20000: "plan_adv"}, tongue: 1000, ear: 1000, tail: 500, vowel: 800, extraExpr: 200, smallAcc: 250, gesture: 1200, pose: 1500, hairset: 1500, clothes: 2000, specialFx: 250, trackingLoss: 600, loli: 4000, vbridger: 3500 };
