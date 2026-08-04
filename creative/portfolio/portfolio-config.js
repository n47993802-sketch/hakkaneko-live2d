/* ============================================================
   阿卡貓 HakkaNeko 網站 — 作品展示（動態貼圖／動態Logo）資料檔
   ============================================================
   portfolio.html 專用。這裡列出「動態貼圖」跟「動態 Logo」兩組
   作品展示的圖片資料，之後要新增/替換/刪除作品，只需要編輯
   這一個檔案的陣列即可，不用去 common.js 或 portfolio.html 裡找。

   每一項欄位說明：
   - src：圖片網址（GIF 直連網址）
   - label：作品名稱（顯示在卡片下方）
   - sub：備註（通常是繪師名字）
   - tags：標籤（顯示在燈箱/說明用，目前卡片本身沒有顯示 tags，
     保留給之後擴充用）

   GIF_PER_PAGE：每一頁（stickers／logos 各自的分頁）顯示幾張，
   目前是 4 張一頁，配合 portfolio-render.js 的分頁邏輯使用。
   ============================================================ */
window.webm_DATA = {
            stickers: [
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/785095_588208.webm',  label: '殘光不在',        sub: '繪師：殘光',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/815418_750290.webm',  label: '紅妻戰鬥姿態',    sub: '繪師：紅妻',    tags: ['動態貼圖', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/240931_341304.webm',  label: '搖晃的莉比',      sub: '繪師：莉比Ribi', tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/411719_225934.webm',  label: '羊毛團搖晃',      sub: '繪師：紅妻',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/73214_46903.webm',   label: '生日快樂！楷KAI', sub: '繪師：馬恩斯',  tags: ['動態貼圖', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/798671_652807.webm',  label: '金穗偷看',        sub: '繪師：曉緋',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/80740_176251.webm',   label: '潔諾搖晃',        sub: '繪師：潔諾',    tags: ['動態貼圖', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/B/399928_890637.webm',  label: '阿卡貓奔跑',      sub: '繪師：赤兔芽',  tags: ['動態貼圖', '含特效動畫 +NT$250'] },
            ],
            logos: [
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/725598_179142.webm',  label: '阿卡貓用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/842497_993032.webm',  label: '花咲小春用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/506386_489301.webm',  label: '祤兒用 Logo',     sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/499991_926064.webm',  label: '緋奈用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/332415_991716.webm',  label: '嘎冰用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/182500_354262.webm',  label: '姆莉醬用 Logo',   sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/108371_241418.webm',  label: '音羽米奈用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
                { src: 'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/portfolio/A/SnowCatLogo.webm',    label: '雪奈喵用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
            ]
        };
window.webm_PER_PAGE = 4;
