# 這裡放 Live2D 模型檔案

把你匯出的整個模型資料夾內容（不是外層再包一層資料夾，是把裡面的檔案）直接放進這個 `model/` 資料夾，通常包含：

- `xxx.model3.json`（主要設定檔）
- `xxx.moc3`（模型主體）
- `textures/`（材質貼圖資料夾）
- `xxx.physics3.json`（物理效果，如頭髮飄動，非必要）
- `motions/` 或 `xxx.motion3.json`（動作檔案）
- `xxx.cdi3.json`（若有的話）

## 重要：主要設定檔請重新命名為 `model.model3.json`

`live2d-demo-render.js` 裡目前寫死指向 `model/model.model3.json`，所以請把你的 `.model3.json` 主設定檔改名成 `model.model3.json`。

**不需要**去打開 `.model3.json` 內部修改任何路徑——只要維持原本匯出時各檔案之間的相對位置關係，整包搬過來就好（`.model3.json` 裡面記錄的是「相對於它自己」的路徑，只要跟它同層或子資料夾的相對關係不變，就不用手動改內容）。

## 動作名稱要記得檢查

點頭部會嘗試播放叫做 `FlickHead` 的動作、點身體會播放 `TapBody`，這兩個名稱要跟你模型 `.model3.json` 裡 `Motions` 分組使用的名稱一致（用文字編輯器打開 `.model3.json` 用 Ctrl+F 找 `"Motions"` 那一段就能看到實際的分組名稱）。如果名稱不同，需要把 `live2d-demo-render.js` 裡的 `'FlickHead'` 和 `'TapBody'` 換成你模型實際的動作名稱。

放好之後，把這份 README.md 刪掉即可（純粹是放置說明，跟網站本身無關）。
