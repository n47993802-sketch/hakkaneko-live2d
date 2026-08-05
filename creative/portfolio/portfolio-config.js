
(function() {
    var BASE = window.ASSET_BASE;

    
    var STICKERS = [
        { file: '785095_588208', label: '殘光不在',        sub: '繪師：殘光',     tags: ['動態貼圖', '標準方案'] },
        { file: '815418_750290', label: '紅妻戰鬥姿態',    sub: '繪師：紅妻',     tags: ['動態貼圖', '含特效動畫 +NT$250'] },
        { file: '240931_341304', label: '搖晃的莉比',      sub: '繪師：莉比Ribi', tags: ['動態貼圖', '標準方案'] },
        { file: '411719_225934', label: '羊毛團搖晃',      sub: '繪師：紅妻',     tags: ['動態貼圖', '標準方案'] },
        { file: '73214_46903',   label: '生日快樂！楷KAI', sub: '繪師：馬恩斯',   tags: ['動態貼圖', '含特效動畫 +NT$250'] },
        { file: '798671_652807', label: '金穗偷看',        sub: '繪師：曉緋',     tags: ['動態貼圖', '標準方案'] },
        { file: '80740_176251',  label: '潔諾搖晃',        sub: '繪師：潔諾',     tags: ['動態貼圖', '標準方案'] },
        { file: '399928_890637', label: '阿卡貓奔跑',      sub: '繪師：赤兔芽',   tags: ['動態貼圖', '含特效動畫 +NT$250'] },
    ];

    
    var LOGOS = [
        { file: '725598_179142', label: '阿卡貓用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
        { file: '842497_993032', label: '花咲小春用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
        { file: '506386_489301', label: '祤兒用 Logo',     sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
        { file: '499991_926064', label: '緋奈用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
        { file: '332415_991716', label: '嘎冰用 Logo',     sub: '', tags: ['動態 Logo', '標準方案'] },
        { file: '182500_354262', label: '姆莉醬用 Logo',   sub: '', tags: ['動態 Logo', '含特效動畫 +NT$250'] },
        { file: '108371_241418', label: '音羽米奈用 Logo', sub: '', tags: ['動態 Logo', '標準方案'] },
        { file: 'SnowCatLogo',   label: '雪奈喵用 Logo',   sub: '', tags: ['動態 Logo', '標準方案'] },
    ];

    function toItem(folder) {
        return function(o) {
            return {
                src:    BASE + '/portfolio/' + folder + '/' + o.file + '.webm',
                poster: BASE + '/portfolio/' + folder + '/' + o.file + '.webp',
                label:  o.label,
                sub:    o.sub,
                tags:   o.tags
            };
        };
    }

    window.PORTFOLIO_MEDIA = {
        stickers: STICKERS.map(toItem('B')),
        logos:    LOGOS.map(toItem('A'))
    };
    window.PORTFOLIO_PER_PAGE = 4;
})();
