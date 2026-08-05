let live2dApp = null;
let live2dModel = null;
let live2dInited = false;
let demoParams = {
  eye: 0.5,
  body: 0.5,
  exp: 0.5,
  breath: 0.5,
  blink: true,
  lip: false,
  physics: true,
};

function initLive2DDemo() {
  if (live2dInited) return;
  live2dInited = true;
}

const LIVE2D_MODEL_URL = "model/model.model3.json";

const CORS_PROXY = "https://corsproxy.io/?url=";

async function loadLive2DModel() {
  const badge = document.getElementById("demoStatusBadge");
  const placeholder = document.getElementById("live2dPlaceholder");
  const canvasEl = document.getElementById("live2dCanvas");
  {
    const _d =
      typeof currentLang !== "undefined" && I18N[currentLang]
        ? I18N[currentLang]
        : I18N["zh-TW"];
    badge.textContent = _d.badge_loading || "載入中…";
    badge.className =
      "text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full";
  }

  if (!window.PIXI) {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.5.10/browser/pixi.min.js",
    );
  }

  if (!window.Live2DCubismCore) {
    await loadScript(
      "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
    );
  }

  if (!(window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel)) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
    );
    if (window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel) {
      window.PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
    }
  }
  const Live2DModelCtor =
    window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel;
  if (!Live2DModelCtor) {
    throw new Error(
      "pixi-live2d-display 載入失敗：找不到 PIXI.live2d.Live2DModel，函式庫可能沒有正確下載。",
    );
  }

  const urlsToTry = [
    LIVE2D_MODEL_URL,
    CORS_PROXY + encodeURIComponent(LIVE2D_MODEL_URL),
  ];

  try {
    const wrapper = document.getElementById("live2dWrapper");

    const w = wrapper.clientWidth || 400,
      h = wrapper.clientHeight || 420;

    if (live2dApp) {
      live2dApp.destroy(true);
      live2dApp = null;
    }

    live2dApp = new PIXI.Application({
      width: w,
      height: h,
      backgroundAlpha: 0,
      view: canvasEl,
      antialias: true,
    });
    canvasEl.style.display = "block";
    placeholder.style.display = "none";

    let loadedModel = null;
    for (const url of urlsToTry) {
      try {
        loadedModel = await Live2DModelCtor.from(url, {
          autoHitTest: true,
          autoFocus: true,
        });
        break;
      } catch (e) {
        console.warn("Live2D model load attempt failed for", url, e);
        continue;
      }
    }
    if (!loadedModel) throw new Error("All URLs failed");
    live2dModel = loadedModel;

    live2dApp.stage.addChild(live2dModel);

    const scale =
      Math.min(
        w / live2dModel.internalModel.originalWidth,
        h / live2dModel.internalModel.originalHeight,
      ) * 0.85;
    live2dModel.scale.set(scale);
    live2dModel.x =
      w / 2 - (live2dModel.internalModel.originalWidth * scale) / 2;
    live2dModel.y =
      h / 2 - (live2dModel.internalModel.originalHeight * scale) / 2;

    wrapper.addEventListener("mousemove", (e) => {
      if (!live2dModel) return;
      const rect = wrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const sens = demoParams.eye;
      live2dModel.focus(
        rect.left + ((x * sens + 1) * rect.width) / 2,
        rect.top + ((y * sens + 1) * rect.height) / 2,
      );
    });

    wrapper.addEventListener(
      "touchmove",
      (e) => {
        if (!live2dModel) return;
        const touch = e.touches[0];
        const rect = wrapper.getBoundingClientRect();
        live2dModel.focus(touch.clientX, touch.clientY);
      },
      { passive: true },
    );

    live2dModel.on("hit", (areas) => {
      const headAreas = ["Head", "head", "Face", "face", "Hair", "hair"];
      if (areas.some((a) => headAreas.includes(a))) {
        live2dModel.motion("FlickHead");
        playIntroSound();
      } else {
        live2dModel.motion("TapBody");
        playBonk();
      }
    });

    {
      const _d =
        typeof currentLang !== "undefined" && I18N[currentLang]
          ? I18N[currentLang]
          : I18N["zh-TW"];
      badge.textContent = _d.badge_loaded || "✓ 已載入";
      badge.className =
        "text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full";
    }
  } catch (e) {
    {
      const _d =
        typeof currentLang !== "undefined" && I18N[currentLang]
          ? I18N[currentLang]
          : I18N["zh-TW"];
      badge.textContent = _d.badge_fail || "載入失敗";
      badge.className =
        "text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full";
    }
    placeholder.style.display = "flex";
    canvasEl.style.display = "none";
    console.error("Live2D load error:", e);
  }
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

function triggerMotion(name) {
  if (!live2dModel) {
    alert("請先載入模型！");
    return;
  }
  try {
    live2dModel.motion(name);
  } catch (e) {}
}

function updateParam(type, val) {
  const pct = Math.round(val);
  demoParams[type] = pct / 100;
  if (type === "eye") document.getElementById("eyeVal").textContent = pct + "%";
  if (type === "body")
    document.getElementById("bodyVal").textContent = pct + "%";
  if (type === "exp") document.getElementById("expVal").textContent = pct + "%";
  if (type === "breath")
    document.getElementById("breathVal").textContent = pct + "%";

  if (live2dModel) {
    try {
      if (type === "body")
        live2dModel.internalModel?.motionManager?.groups?.idle &&
          (live2dModel.internalModel.motionManager.preferredFrameRate =
            30 + Math.round(demoParams.body * 30));
    } catch (e) {}
  }
}

function toggleSwitch(type, val) {
  demoParams[type] = val;
  if (!live2dModel) return;
  try {
    if (type === "blink")
      live2dModel.internalModel.eyeBlink &&
        (live2dModel.internalModel.eyeBlink.enabled = val);
    if (type === "lip")
      live2dModel.internalModel.lipSync &&
        (live2dModel.internalModel.lipSync.enabled = val);
  } catch (e) {}
}
