# images／ 資料夾說明

**最終決定（取代舊版的搬遷計畫）：** 作品類素材（動態貼圖、動態Logo、
動畫展示封面、聯名模板縮圖、二創展示）**永久留在**獨立的
`n47993802-sketch/Live2D-` repo，不會搬進這個網站 repo 裡。
理由：素材檔案（尤其動態貼圖/Logo 常常调整、二創持續新增）由不同
的人／流程維護，跟網站程式碼分開比較好管理，也不會讓網站 repo
因為圖檔/影片檔而變得肥大。

所有素材網址都從 `site-config.js` 的 `window.ASSET_BASE`
（`https://n47993802-sketch.github.io/Live2D-`）組出來，資料夾對應：

| Live2D- repo 內的資料夾 | 內容 | 網站程式碼裡對應的設定檔 |
|---|---|---|
| `portfolio/A` | 動態 Logo（.webm + 同名 .webp 縮圖） | `creative/portfolio/portfolio-config.js` |
| `portfolio/B` | 動態貼圖（.webm + 同名 .webp 縮圖） | `creative/portfolio/portfolio-config.js` |
| `portfolio/C` | 動畫資訊與演出設計／V皮展示封面（.webp） | `creative/portfolio/portfolio.html`（目前是寫死的 HTML，數量少沒有另外拆 config） |
| `fanart` | 二創展示（由 GitHub API 即時列出資料夾內容，不是寫死清單） | `creative/fanart/fanart-render.js` |
| `template/A` | 聯名模板 30 款衣裝縮圖（.webp） | `commission/template/template-config.js` |

之後如果要新增/替換作品，只需要把檔案丟進 `Live2D-` repo 對應資料夾，
再依上表打開網站這邊對應的設定檔加一行即可（fanart 例外，丟檔案就會
自動出現，不用改程式碼）。

## `images/common/` 是什麼？

這個資料夾**跟上面的作品素材無關**，放的是網站自己的東西：
`hakkaneko-pixel.gif`（貓咪像素圖示，10 個頁面的 favicon／Loader／
標題小圖示共用同一份檔案）。這個檔案就留在網站 repo 裡，不用搬。
