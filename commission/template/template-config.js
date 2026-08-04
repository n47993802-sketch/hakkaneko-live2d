/* ============================================================
   阿卡貓 HakkaNeko 網站 — 聯名模板頁 資料設定檔
   ============================================================
   template.html 專用。30 款衣裝的名稱／單價／預覽圖網址都在這裡，
   之後新增/修改/刪除衣裝款式，只需要編輯 window.TMPL_OUTFITS
   這個陣列即可，不用去 template-render.js 或 common.js 裡找。

   每一項欄位說明：
   - name：衣裝名稱（顯示在卡片上）
   - price：單價（新台幣），會被 template-render.js 的報價計算機讀取
   - src：預覽圖網址

   PRICE_ADD：第 2 套衣裝起，每多選一套要「額外」加收的金額
   （目前是每套衣裝都賣 1000，但第 2 套起要再加價 400，
   也就是總價不是單純「單價 × 套數」，而是有累進加價）。
   ============================================================ */
window.TMPL_OUTFITS = [
            { name:'01 女僕', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/01.png' },
            { name:'02 執事', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/02.png' },
            { name:'03 白無垢', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/03.png' },
            { name:'04 黑紋付', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/04.png' },
            { name:'05 少女睡衣', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/05.png' },
            { name:'06 長袖睡衣', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/06.png' },
            { name:'07 水手裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/07.png' },
            { name:'08 水手褲裝', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/08.png' },
            { name:'09 陰陽師', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/09.png' },
            { name:'10 巫女', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/10.png' },
            { name:'11 天使長', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/11.png' },
            { name:'12 小天使', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/12.png' },
            { name:'13 地雷裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/13.png' },
            { name:'14 地雷褲裝', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/14.png' },
            { name:'15 行燈袴', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/15.png' },
            { name:'16 小惡魔', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/16.png' },
            { name:'17 惡魔公爵', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/17.png' },
            { name:'18 大正紳士', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/18.png' },
            { name:'19 旗袍', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/19.png' },
            { name:'20 草裙', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/20.png' },
            { name:'21 夏威夷襯衫', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/21.png' },
            { name:'22 長衫', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/22.png' },
            { name:'23 儀隊', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/23.jpg' },
            { name:'24 和洋折衷', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/24.jpg' },
            { name:'25 比基尼', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/25.jpg' },
            { name:'26 軍官', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/26.jpg' },
            { name:'27 忍者', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/27.jpg' },
            { name:'28 泳圈', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/28.jpg' },
            { name:'29 歌德蘿莉塔', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/29.jpg' },
            { name:'30 歌德男爵', price:1000, src:'https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/HakkaNeko/CollabTemplateA/30.jpg' },
        ];
window.TMPL_PRICE_ADD = 400; // 第2套起每套追加
