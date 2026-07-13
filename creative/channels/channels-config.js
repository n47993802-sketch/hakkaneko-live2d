/* ============================================================
   阿卡貓 HakkaNeko 網站 — 推薦頻道名單設定檔
   ============================================================
   channels.html 專用。這裡列出的頻道，會在該頁面顯示直播中/離線
   狀態徽章（跟 common.js 裡偵測「阿卡貓自己」是否開台的
   setLiveStatus()/checkMyLiveStatus() 是不同的兩件事：
   那兩個是全站共用、判斷阿卡貓自己直播狀態；這裡是只有
   channels.html 需要的「推薦頻道」清單）。

   之後要增減推薦頻道，只需要編輯這一個檔案：
   - Twitch 頻道：TWITCH_CHANNELS 陣列裡直接加/刪帳號字串即可，
     但記得同時要在 channels.html 裡加上對應的
     <span id="live-帳號"></span> 徽章元素，不然畫面不會顯示。
   - YouTube 頻道：YOUTUBE_CHANNELS 陣列，id 要對應
     channels.html 裡徽章元素的 id。
   ============================================================ */
window.CHANNELS_CONFIG = {
    twitch: ['bunny0422', 'yazawaribii', 'shinyuki2511', 'yukina_nya_026', 'darkmeyaya'],
    youtube: [
        { id: 'yt-live-MurichanChannel', handle: 'MurichanChannel' },
        { id: 'yt-live-darkmeyaya',      handle: 'darkmeyaya' }
    ]
};
