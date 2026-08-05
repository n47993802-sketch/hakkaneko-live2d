var gifPage = { stickers: 0, logos: 0 };

if (typeof ulbGroups !== "undefined") {
  ulbGroups.stickers = window.PORTFOLIO_MEDIA.stickers;
  ulbGroups.logos = window.PORTFOLIO_MEDIA.logos;
}

function gifBuildAll() {
  ["stickers", "logos"].forEach(function (key) {
    var grid = document.getElementById("gif-grid-" + key);
    if (!grid || grid.children.length > 0) return;
    var items = window.PORTFOLIO_MEDIA[key];
    var isS = key === "stickers";
    var borderActive = isS ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.35)";
    var badgeBg = isS ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)";

    items.forEach(function (item, idx) {
      var card = document.createElement("div");
      card.className = "port-gif-card";
      card.style.setProperty("--port-accent", borderActive);
      card.style.setProperty(
        "--port-accent-shadow",
        isS ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)",
      );

      (function (captureKey, captureIdx) {
        card.onclick = function () {
          ulbOpen(captureKey, captureIdx);
        };
      })(key, idx);

      var wrap = document.createElement("div");
      wrap.className = "port-gif-wrap gif-skeleton";

      var video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", item.label);
      video.poster = item.poster;

      video.preload = "none";
      video.className = "gif-img-fade";
      video.style.cssText =
        "width:100%;height:100%;object-fit:contain;display:block;transform:translateZ(0);-webkit-transform:translateZ(0);position:relative;z-index:1;";
      video.onerror = function () {
        this.style.display = "none";
        var p = this.parentElement;
        if (p) {
          p.classList.remove("gif-skeleton");
          p.innerHTML +=
            '<i class="fa-solid fa-image" style="font-size:2rem;color:rgba(168,85,247,.25);position:absolute;"></i>';
        }
      };
      video.oncanplay = function () {
        this.classList.add("loaded");
        var p = this.parentElement;
        if (p) p.classList.remove("gif-skeleton");
        this.play().catch(function () {});
      };

      if (idx < window.PORTFOLIO_PER_PAGE) {
        video.src = item.src;
        video.preload = "auto";
        video.dataset.loaded = "1";
      } else {
        video.dataset.src = item.src;
      }

      wrap.appendChild(video);

      var info = document.createElement("div");
      info.style.cssText = "padding:.55rem .7rem .65rem;text-align:center;";
      var labelEl = document.createElement("p");
      labelEl.textContent = item.label;
      labelEl.className = "port-gif-label";
      labelEl.style.background = badgeBg;
      info.appendChild(labelEl);
      if (item.sub) {
        var subEl = document.createElement("p");
        subEl.textContent = item.sub;
        subEl.className = "port-gif-sub";
        info.appendChild(subEl);
      }

      card.appendChild(wrap);
      card.appendChild(info);
      grid.appendChild(card);
    });

    gifRenderPage(key);
  });
}

function gifRenderPage(key) {
  var grid = document.getElementById("gif-grid-" + key);
  var dotsEl = document.getElementById("gif-dots-" + key);
  if (!grid) return;
  var cards = grid.children;
  var total = window.PORTFOLIO_MEDIA[key].length;
  var pages = Math.ceil(total / window.PORTFOLIO_PER_PAGE);
  var page = gifPage[key];
  var start = page * window.PORTFOLIO_PER_PAGE;
  var end = start + window.PORTFOLIO_PER_PAGE;
  var isS = key === "stickers";
  var dotActive = isS ? "#34d399" : "#fbbf24";

  for (var i = 0; i < cards.length; i++) {
    var isVisible = i >= start && i < end;
    cards[i].style.display = isVisible ? "" : "none";

    if (isVisible) {
      var lazyVideo = cards[i].querySelector("video");
      if (lazyVideo && !lazyVideo.dataset.loaded && lazyVideo.dataset.src) {
        lazyVideo.preload = "auto";
        lazyVideo.src = lazyVideo.dataset.src;
        lazyVideo.dataset.loaded = "1";
      } else if (lazyVideo && lazyVideo.paused) {
        lazyVideo.play().catch(function () {});
      }
    }
  }

  dotsEl.innerHTML = "";
  for (var p = 0; p < pages; p++) {
    (function (pi) {
      var dot = document.createElement("span");
      dot.style.cssText =
        "display:inline-block;width:8px;height:8px;border-radius:50%;cursor:pointer;transition:background .2s,transform .2s;background:" +
        (pi === page ? dotActive : "rgba(255,255,255,.2)") +
        ";" +
        (pi === page ? "transform:scale(1.3);" : "");
      dot.onclick = function () {
        gifPage[key] = pi;
        gifRenderPage(key);
      };
      dotsEl.appendChild(dot);
    })(p);
  }
}

function gifNav(key, dir) {
  var pages = Math.ceil(
    window.PORTFOLIO_MEDIA[key].length / window.PORTFOLIO_PER_PAGE,
  );
  var next = gifPage[key] + dir;
  if (next < 0 || next >= pages) return;
  gifPage[key] = next;
  gifRenderPage(key);
}

var _gifBuilt = false;
function gifEnsureInit() {
  if (_gifBuilt) return;
  _gifBuilt = true;
  gifBuildAll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    gifEnsureInit();
  });
} else {
  gifEnsureInit();
}

function triggerPortReveal() {
  var pageEl = document.getElementById("page-portfolio");
  if (!pageEl) return;
  var firstPortEl = pageEl.querySelector(".port-reveal");
  if (!firstPortEl || firstPortEl.classList.contains("visible")) return;
  var portEls = pageEl.querySelectorAll(".port-reveal");
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var n = portEls.length;
      var step = Math.min(70, 500 / n);
      portEls.forEach(function (el, i) {
        setTimeout(
          function () {
            el.classList.add("visible");
          },
          Math.round(i * step),
        );
      });
    });
  });
  pageEl.classList.remove("gif-hidden", "hidden");
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", triggerPortReveal);
} else {
  triggerPortReveal();
}
