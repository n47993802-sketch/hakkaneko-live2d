/* ============================================================
   阿卡貓 HakkaNeko 網站 — 聯名模板頁 資料設定檔
   ============================================================
   template.html 專用。30 款衣裝的名稱／單價／預覽圖網址都在這裡，
   之後新增/修改/刪除衣裝款式，只需要編輯 window.TMPL_OUTFITS
   這個陣列即可，不用去 template-render.js 或 common.js 裡找。

   ⚠️ 素材網址一律從 site-config.js 的 window.ASSET_BASE 組出來，
   實際檔案放在 Live2D- repo 的 template/A/ 資料夾（01.webp ~ 30.webp）。
   目前「聯名模板」分頁本身還沒正式上線（nav-config.js 裡是
   enabled:false），但縮圖已經可以先放進去，之後開放分頁時不用
   再回頭補圖。

   每一項欄位說明：
   - name：衣裝名稱（顯示在卡片上）
   - price：單價（新台幣），會被 template-render.js 的報價計算機讀取
   - src：預覽圖網址（.webp）

   PRICE_ADD：第 2 套衣裝起，每多選一套要「額外」加收的金額
   （目前是每套衣裝都賣 1000，但第 2 套起要再加價 400，
   也就是總價不是單純「單價 × 套數」，而是有累進加價）。
   ============================================================ */
(function() {
    var BASE = window.ASSET_BASE;
    window.TMPL_OUTFITS = [
            { name:'01 女僕', price:1000, src: BASE + '/template/A/01.webp' },
            { name:'02 執事', price:1000, src: BASE + '/template/A/02.webp' },
            { name:'03 白無垢', price:1000, src: BASE + '/template/A/03.webp' },
            { name:'04 黑紋付', price:1000, src: BASE + '/template/A/04.webp' },
            { name:'05 少女睡衣', price:1000, src: BASE + '/template/A/05.webp' },
            { name:'06 長袖睡衣', price:1000, src: BASE + '/template/A/06.webp' },
            { name:'07 水手裙', price:1000, src: BASE + '/template/A/07.webp' },
            { name:'08 水手褲裝', price:1000, src: BASE + '/template/A/08.webp' },
            { name:'09 陰陽師', price:1000, src: BASE + '/template/A/09.webp' },
            { name:'10 巫女', price:1000, src: BASE + '/template/A/10.webp' },
            { name:'11 天使長', price:1000, src: BASE + '/template/A/11.webp' },
            { name:'12 小天使', price:1000, src: BASE + '/template/A/12.webp' },
            { name:'13 地雷裙', price:1000, src: BASE + '/template/A/13.webp' },
            { name:'14 地雷褲裝', price:1000, src: BASE + '/template/A/14.webp' },
            { name:'15 行燈袴', price:1000, src: BASE + '/template/A/15.webp' },
            { name:'16 小惡魔', price:1000, src: BASE + '/template/A/16.webp' },
            { name:'17 惡魔公爵', price:1000, src: BASE + '/template/A/17.webp' },
            { name:'18 大正紳士', price:1000, src: BASE + '/template/A/18.webp' },
            { name:'19 旗袍', price:1000, src: BASE + '/template/A/19.webp' },
            { name:'20 草裙', price:1000, src: BASE + '/template/A/20.webp' },
            { name:'21 夏威夷襯衫', price:1000, src: BASE + '/template/A/21.webp' },
            { name:'22 長衫', price:1000, src: BASE + '/template/A/22.webp' },
            { name:'23 儀隊', price:1000, src: BASE + '/template/A/23.webp' },
            { name:'24 和洋折衷', price:1000, src: BASE + '/template/A/24.webp' },
            { name:'25 比基尼', price:1000, src: BASE + '/template/A/25.webp' },
            { name:'26 軍官', price:1000, src: BASE + '/template/A/26.webp' },
            { name:'27 忍者', price:1000, src: BASE + '/template/A/27.webp' },
            { name:'28 泳圈', price:1000, src: BASE + '/template/A/28.webp' },
            { name:'29 歌德蘿莉塔', price:1000, src: BASE + '/template/A/29.webp' },
            { name:'30 歌德男爵', price:1000, src: BASE + '/template/A/30.webp' },
        ];
    window.TMPL_PRICE_ADD = 400; // 第2套起每套追加
})();
