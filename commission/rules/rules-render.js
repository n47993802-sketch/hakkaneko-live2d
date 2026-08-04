/* ============================================================
   阿卡貓 HakkaNeko 網站 — 流程與規範頁 互動邏輯
   ============================================================
   從 common.js 拆分出來，只有 rules.html 會載入這個檔案。
   目前只有一個常見問題手風琴（FAQ accordion）功能。
   ============================================================ */
        function toggleFaq(btn) {
            const body = btn.nextElementSibling;
            const arrow = btn.querySelector('.faq-arrow');
            const isOpen = !body.classList.contains('hidden');
            // 關閉所有已開啟的項目
            document.querySelectorAll('.faq-body').forEach(b => b.classList.add('hidden'));
            document.querySelectorAll('.faq-arrow').forEach(a => a.style.transform = '');
            // 若點擊的是已關閉的，才展開它
            if (!isOpen) {
                body.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
                setTimeout(() => body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        }
