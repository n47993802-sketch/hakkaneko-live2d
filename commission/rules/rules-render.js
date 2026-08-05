
        function toggleFaq(btn) {
            const body = btn.nextElementSibling;
            const arrow = btn.querySelector('.faq-arrow');
            const isOpen = !body.classList.contains('hidden');
            
            document.querySelectorAll('.faq-body').forEach(b => b.classList.add('hidden'));
            document.querySelectorAll('.faq-arrow').forEach(a => a.style.transform = '');
            
            if (!isOpen) {
                body.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
                setTimeout(() => body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        }
