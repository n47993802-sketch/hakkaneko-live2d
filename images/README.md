# images／videos 資料夾說明

這兩個資料夾是「空的骨架」，用來讓你之後把散落在別的 GitHub repo
（`n47993802-sketch/Live2D-`）裡的圖檔／GIF，集中搬進**這個** repo
（`hakkaneko-live2d`）時，有一個清楚、按頁面分類好的地方可以放。

目前網站程式碼**還沒有改**去讀取這裡的檔案 —— 現有的
`<img src="https://raw.githubusercontent.com/...">` 網址都維持原樣、
繼續正常顯示，不會因為多了這些空資料夾就故障。
等你把對應的檔案實際放進資料夾之後，再依照下面「怎麼切換」的說明，
把程式碼裡的網址改成本機路徑即可。

## 資料夾對應表（哪個分頁用哪個資料夾）

| 資料夾 | 對應分頁 | 目前對應的舊網址 | 內容 |
|---|---|---|---|
| `images/intro/` | index.html（自我介紹） | `pbs.twimg.com/...`（頭貼、合作繪師頭貼） | 首頁用的頭像類圖片 |
| `images/artists/` | artists.html（合作繪師） | 各繪師頭貼、範例圖 | 繪師介紹卡片圖片 |
| `images/rules/` | commission/rules/rules.html（流程與規範） | （目前多為文字，無大量圖片） | 流程說明用的示意圖（如有） |
| `images/core/` | commission/core/core.html（V皮設計） | （目前多為文字/表格） | V皮設計方案示意圖（如有） |
| `images/anim/` | commission/anim/anim.html（動畫設計） | （目前多為文字/表格） | 動畫設計方案示意圖（如有） |
| `images/template/` | commission/template/template.html（聯名模板） | `HakkaNeko/CollabTemplateA/01.png` ~ `30.png` | 30 款衣裝縮圖，`commission/template/template-config.js` 內 `TMPL_OUTFITS` 陣列 |
| `images/portfolio/cover/` | creative/portfolio/portfolio.html（作品展示・V皮/動畫作品） | `HakkaNeko/cover%20image/*.png、*.webp` | 作品展示的封面照片 |
| `images/portfolio/stickers/` | creative/portfolio/portfolio.html（作品展示・動態貼圖） | `HakkaNeko/DynamicStickers/*.gif` | `creative/portfolio/portfolio-config.js` 內 `GIF_DATA.stickers` |
| `images/portfolio/logos/` | creative/portfolio/portfolio.html（作品展示・動態Logo） | `HakkaNeko/DynamicLogo/*.gif` | `creative/portfolio/portfolio-config.js` 內 `GIF_DATA.logos` |
| `images/channels/` | creative/channels/channels.html（推薦頻道） | Twitch/YouTube 頻道圖示（多為外部 CDN，通常不需要搬） | 頻道相關圖片（如有） |
| `images/fanart/` | creative/fanart/fanart.html（二創展示） | `HakkaNeko/Second%20creation%20drawing/*`（目前用 GitHub API **動態抓取**，不是寫死清單） | 二創圖片 |
| `images/live2d-demo/` | creative/live2d-demo/live2d-demo.html（角色互動，目前隱藏中） | 尚未實作 | 預留 |
| `images/common/` | 所有頁面共用 | 網站 icon、favicon、共用裝飾圖 | 共用素材 |
| `videos/portfolio/stickers/` `videos/portfolio/logos/` `videos/anim/` `videos/fanart/` `videos/template/` | 對應同名 images 資料夾 | 目前的 `.gif` | 轉檔後的 `.webm`（動畫）＋ 對應的 `.webp`（靜態縮圖／封面） |

> `creative/fanart/fanart.html` 比較特別：它不是寫死圖片清單，而是用 GitHub API
> （`FANART_API` / `FANART_RAW`，定義在 `common.js` 裡）即時列出
> 指定資料夾內的檔案，所以只要你把圖丟進舊 repo 對應資料夾，網站就會
> 自動出現，不用改程式碼。等你確定要把二創圖都搬來這個新 repo 後，
> 只要把 `common.js` 裡這兩個常數的 repo 路徑，改成指向這個 repo 的
> `images/fanart/` 即可（一次只需要改兩行）。

## 為什麼要拆成 .webm + .webp 兩種檔案？

你提到 GIF 一直有「閃爍」問題，`common.js` 裡也留了大量註解在處理這件事
（搜尋 `零閃爍核心原則`、`gif-hidden` 就找得到）。這是因為：

- GIF 在瀏覽器裡是「一張圖片」，只要那個 `<img>` 被 `display:none`
  或整個從 DOM 移除過一次，重新顯示時很多瀏覽器會把它的播放進度
  重置、甚至短暫顯示第一幀然後才繼續播 —— 這就是閃爍的來源，
  舊code才需要用一堆 `visibility` / `transform` 的技巧去繞過。
- 換成 `.webm`（動畫本體，用 `<video>` 播放）＋ `.webp`（靜態縮圖，
  用來當作 `poster` 或列表縮圖）之後，`<video>` 元素本身有更穩定的
  播放狀態控制（可以 `pause()` / `currentTime = 0`），加上檔案體積
  通常比 GIF 小很多，實務上可以整個拿掉那些防閃爍的 hack。
- 之後真的要換檔案格式時，記得同時要修改 `common.js` 裡的
  `GIF_DATA`（會建議順便改名成 `MEDIA_DATA`）跟 `TMPL_OUTFITS`，
  把 `<img src="xxx.gif">` 的地方換成
  `<video src="xxx.webm" poster="xxx.webp" autoplay muted loop playsinline>`。
  這部分屬於「內容格式改變」，建議實際換檔時再讓我一起處理，
  避免我用猜的寫出跟你實際檔名對不上的程式碼。

## 怎麼切換（等你把檔案放進資料夾之後）

1. 把對應的圖檔／webm／webp 放進上表的資料夾。
2. 打開 `common.js`，找到 `TMPL_OUTFITS`、`GIF_DATA` 這兩個陣列，
   或是 `creative/portfolio/portfolio.html`、`creative/fanart/fanart.html` 裡的 `<img src="...">`，
   把網址從
   `https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/...`
   改成相對路徑，例如 `images/template/01.png`。
3. 存檔、上傳到 GitHub Pages 後直接測試該分頁即可，不需要改動其他檔案。
