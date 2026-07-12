/* ============================================================
   阿卡貓 HakkaNeko 網站 — 合作繪師名單設定檔
   ============================================================
   之前的問題：18 位繪師的頭貼／名字／連結，全部直接寫死在
   artists.html 裡面一大串重複的 <a><img><h3> 標籤中，繪師換頭貼時
   要從三百多行 HTML 裡面找到對應那一段才能改，很容易改錯或漏改。

   現在改成：所有繪師資料集中在這一份檔案的一個陣列裡，
   artists.html 只留一個空的容器 + artists-render.js 負責畫出來。

   ⚠️ 之後繪師換頭貼時，只需要：
   1. 找到下面對應繪師那一行（可以直接搜尋他的名字或 @帳號）
   2. 把 avatar 欄位換成新的圖片網址即可，其他都不用動

   如果之後想改成「放本機圖檔」而不是連去 X (Twitter) 的網址，
   把 avatar 換成 'images/artists/檔名.jpg' 這種相對路徑即可，
   兩種寫法 render 出來的結果完全一樣。
   ============================================================ */
window.ARTISTS_CONFIG = [
    { name: '紅妻(Wiffee)', handle: 'r7sundae', profileUrl: 'https://x.com/r7sundae', avatar: 'https://pbs.twimg.com/profile_images/1712634709900181504/xLp2LL1D_400x400.jpg' },
    { name: '莉比Ribi', handle: 'yazawaribii', profileUrl: 'https://x.com/yazawaribii', avatar: 'https://pbs.twimg.com/profile_images/2054602495230713856/1JqUDA6L_400x400.jpg' },
    { name: '玻璃姬', handle: 'usanana520', profileUrl: 'https://x.com/usanana520', avatar: 'https://pbs.twimg.com/profile_images/1907104678279782400/h_Ktp8dN_400x400.jpg' },
    { name: '殘光', handle: 'jXDXcEezDG0PUUl', profileUrl: 'https://x.com/jXDXcEezDG0PUUl', avatar: 'https://pbs.twimg.com/profile_images/1956153505208516611/l9Cx5-e-_400x400.jpg' },
    { name: '雲糰', handle: 'Bai35461097', profileUrl: 'https://x.com/Bai35461097', avatar: 'https://pbs.twimg.com/profile_images/1972000407988944896/woVIm-kz_400x400.jpg' },
    { name: 'FcError', handle: 'FCerror93131', profileUrl: 'https://x.com/FCerror93131', avatar: 'https://pbs.twimg.com/profile_images/2020534040240218112/2ZkGhmS3_400x400.jpg' },
    { name: 'Chiyo ch.千代剎那', handle: 'ChiyoSetsuna', profileUrl: 'https://x.com/ChiyoSetsuna', avatar: 'https://pbs.twimg.com/profile_images/2024122706015510528/OZnlQlds_400x400.jpg' },
    { name: '零夜Reiya', handle: 'Reiya_VT', profileUrl: 'https://x.com/Reiya_VT', avatar: 'https://pbs.twimg.com/profile_images/2039380417758056448/lS0anzRt_400x400.jpg' },
    { name: '13貓', handle: 'Makoto101200', profileUrl: 'https://x.com/Makoto101200', avatar: 'https://pbs.twimg.com/profile_images/2033701527391768576/bwSkYb0K_400x400.jpg' },
    { name: '白', handle: 'BT871213', profileUrl: 'https://x.com/BT871213', avatar: 'https://pbs.twimg.com/profile_images/2007428147990720512/UzJjqrlt_400x400.jpg' },
    { name: 'Xamo傻嗼', handle: 'xamo_vtuber', profileUrl: 'https://x.com/xamo_vtuber', avatar: 'https://pbs.twimg.com/profile_images/2039769671604617216/Jzbie_rA_400x400.jpg' },
    { name: '潔諾', handle: 'Jessroin', profileUrl: 'https://x.com/Jessroin', avatar: 'https://pbs.twimg.com/profile_images/1880182492935892992/F1FMKMd3_400x400.png' },
    { name: '猫島羽依', handle: 'NekosimaYui', profileUrl: 'https://x.com/NekosimaYui', avatar: 'https://pbs.twimg.com/profile_images/1520709406203482114/MtFH2yYA_400x400.jpg' },
    { name: 'ZOE', handle: 'Zoe_work', profileUrl: 'https://x.com/Zoe_work', avatar: 'https://pbs.twimg.com/profile_images/1943494719532859392/kmHrHsTo_400x400.jpg' },
    { name: '摩茨Mochi', handle: 'Mochiillus', profileUrl: 'https://x.com/Mochiillus', avatar: 'https://pbs.twimg.com/profile_images/2017430800376246272/GayyVAGT_400x400.jpg' },
    { name: '迪亞雜藝舖', handle: 'diagostudio', profileUrl: 'https://x.com/diagostudio', avatar: 'https://pbs.twimg.com/profile_images/1846946796578521088/cy_ZSUMu_400x400.jpg' },
    { name: '杉鬼蓮', handle: 'FoxWork_sw5117', profileUrl: 'https://x.com/FoxWork_sw5117', avatar: 'https://pbs.twimg.com/profile_images/1869350992963354624/lXjBeIuC_400x400.jpg' },
    { name: 'Potachi', handle: 'potachi1069', profileUrl: 'https://x.com/potachi1069', avatar: 'https://pbs.twimg.com/profile_images/2048320844578103296/d_tVwk-h_400x400.jpg' },
];
