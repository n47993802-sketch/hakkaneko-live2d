let live2dApp = null;
let live2dModel = null;
let live2dInited = false;
let interactionBound = false;
let tickerBound = false;
let demoParams = {
  blink: true,
  physics: true,
  breathAuto: true,
  expressionHappy: 0,
  expressionSurprised: 0,
};

let baseScale = 1;
let viewOffsetX = 0,
  viewOffsetY = 0,
  viewZoom = 1;
let isLeftDragging = false,
  isRightDragging = false,
  isMiddleDragging = false;
let dragStartX = 0,
  dragStartY = 0;
let dragStartOffsetX = 0,
  dragStartOffsetY = 0;
let isTwoFingerTouch = false;

const pose = {
  headX: 0,
  headY: 0,
  headZ: 0,
  bodyX: 0,
  bodyY: 0,
  bodyZ: 0,
  eyeX: 0,
  eyeY: 0,
};
const poseTarget = {
  headX: 0,
  headY: 0,
  headZ: 0,
  bodyX: 0,
  bodyY: 0,
  bodyZ: 0,
  eyeX: 0,
  eyeY: 0,
};
const POSE_LERP = 0.15;

const RANGE = {
  headX: 30,
  headY: 30,
  headZ: 30,
  bodyX: 10,
  bodyY: 10,
  bodyZ: 10,
  eye: 1,
};

const ZOOM_MIN = 0.3,
  ZOOM_MAX = 3;

const MODEL_CONFIG =
  typeof window !== "undefined" && window.MODEL_RENDER_CONFIG
    ? window.MODEL_RENDER_CONFIG
    : {};
const MODEL_SPECS = MODEL_CONFIG.models || {};
const MODEL_ORDER =
  Array.isArray(MODEL_CONFIG.modelOrder) && MODEL_CONFIG.modelOrder.length
    ? MODEL_CONFIG.modelOrder.filter((key) => !!MODEL_SPECS[key])
    : Object.keys(MODEL_SPECS);
const DEFAULT_MODEL_KEY = MODEL_ORDER.includes(MODEL_CONFIG.defaultModelKey)
  ? MODEL_CONFIG.defaultModelKey
  : MODEL_ORDER[0] || "";

let currentModelKey = DEFAULT_MODEL_KEY;
try {
  const savedModel = localStorage.getItem("hakka_live2d_model");
  if (savedModel && MODEL_SPECS[savedModel]) {
    currentModelKey = savedModel;
  }
} catch (e) {}

const EXPRESSION_PARAMS = MODEL_CONFIG.expressionParams || {};

const expressionPresetCache = new Map();
let activeExpressionKey = null;
let activeExpressionRestore = null;

function getCurrentModelSpec() {
  if (MODEL_SPECS[currentModelKey]) return MODEL_SPECS[currentModelKey];
  if (DEFAULT_MODEL_KEY && MODEL_SPECS[DEFAULT_MODEL_KEY]) {
    return MODEL_SPECS[DEFAULT_MODEL_KEY];
  }
  const firstKey = Object.keys(MODEL_SPECS)[0];
  return firstKey ? MODEL_SPECS[firstKey] : null;
}

function getMotionButtons(spec) {
  return spec && Array.isArray(spec.motions) ? spec.motions : [];
}

function getExpressionButtons(spec) {
  return spec && Array.isArray(spec.expressions) ? spec.expressions : [];
}

function getMotionByKey(spec, motionKey) {
  if (!spec || !Array.isArray(spec.motions)) return null;
  return (
    spec.motions.find(
      (motion) =>
        motion &&
        (motion.key === motionKey ||
          motion.name === motionKey ||
          motion.group === motionKey),
    ) || null
  );
}

function renderModelControls() {
  const spec = getCurrentModelSpec();
  if (!spec) return;
  const modelSelect = document.getElementById("modelSelect");
  const sourceLabel = document.getElementById("modelSourceLabel");
  const sourcePath = document.getElementById("modelSourcePath");
  if (modelSelect) {
    const optionItems =
      MODEL_ORDER.length > 0 ? MODEL_ORDER : Object.keys(MODEL_SPECS);
    modelSelect.innerHTML = optionItems
      .map((key) => {
        const item = MODEL_SPECS[key];
        const label = item?.label || item?.displayName || key;
        return `<option value="${key}">${label}</option>`;
      })
      .join("");
    if (modelSelect.value !== spec.key) modelSelect.value = spec.key;
  }
  if (sourceLabel) sourceLabel.textContent = spec.displayName;
  if (sourcePath) sourcePath.textContent = spec.sourceLabel;

  const motionControls = document.getElementById("motionControls");
  if (motionControls) {
    const motions = getMotionButtons(spec);
    motionControls.className =
      motions.length <= 1 ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2";
    motionControls.innerHTML = motions
      .map(
        (motion) => {
          const motionKey = motion?.key || motion?.name || "";
          return `
                    <button onclick="triggerMotionByKey('${motionKey}')" class="py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${motion.buttonClass}">
                        <span class="material-symbols-outlined" aria-hidden="true">${motion.icon}</span>
                        ${motion.label}
                    </button>
                `;
        },
      )
      .join("");
  }

  const expressionControls = document.getElementById("expressionControls");
  if (expressionControls) {
    if (spec.expressionMode === "presets") {
      const expressions = getExpressionButtons(spec);
      expressionControls.innerHTML = `
                        <div class="space-y-2">
                            <div class="grid grid-cols-2 gap-2">
                                ${expressions
                                  .map(
                                    (expression) => {
                                      const isActive =
                                        expression.key === activeExpressionKey;
                                      const buttonClass = isActive
                                        ? "bg-pink-600/45 text-pink-100 border-pink-400/60"
                                        : "bg-purple-600/25 hover:bg-purple-600/50 text-purple-200 border-purple-500/30";
                                      return `
                                    <button onclick="triggerExpression('${expression.key}')" class="py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${buttonClass}">
                                        <span class="material-symbols-outlined" aria-hidden="true">sentiment_satisfied</span>
                                        ${expression.label}
                                    </button>
                                `;
                                    },
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `;
    } else {
      const happyLabel = spec.sliderLabels?.expressionHappy || "開心";
      const surprisedLabel = spec.sliderLabels?.expressionSurprised || "驚訝";
      const happyAccent =
        spec.sliderStyles?.expressionHappy || "accent-blue-500";
      const surprisedAccent =
        spec.sliderStyles?.expressionSurprised || "accent-indigo-500";
      expressionControls.innerHTML = `
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-xs text-purple-300 mb-1.5">
                                    <span>${happyLabel}</span><span id="expressionHappyVal" class="text-white font-bold">${Math.round((demoParams.expressionHappy || 0) * 100)}%</span>
                                </div>
                                <input type="range" id="expressionHappy" min="0" max="100" value="${Math.round((demoParams.expressionHappy || 0) * 100)}"
                                    oninput="updateParam('expressionHappy', this.value)"
                                    class="w-full h-1.5 rounded-full appearance-none bg-purple-900/60 ${happyAccent} cursor-pointer">
                            </div>
                            <div>
                                <div class="flex justify-between text-xs text-purple-300 mb-1.5">
                                    <span>${surprisedLabel}</span><span id="expressionSurprisedVal" class="text-white font-bold">${Math.round((demoParams.expressionSurprised || 0) * 100)}%</span>
                                </div>
                                <input type="range" id="expressionSurprised" min="0" max="100" value="${Math.round((demoParams.expressionSurprised || 0) * 100)}"
                                    oninput="updateParam('expressionSurprised', this.value)"
                                    class="w-full h-1.5 rounded-full appearance-none bg-purple-900/60 ${surprisedAccent} cursor-pointer">
                            </div>
                        </div>
                    `;
    }
  }
}

async function loadExpressionPreset(modelKey, expressionKey) {
  const spec = MODEL_SPECS[modelKey];
  if (!spec || spec.expressionMode !== "presets") return null;
  const expression = getExpressionButtons(spec).find(
    (entry) => entry.key === expressionKey,
  );
  if (!expression) return null;
  if (!expressionPresetCache.has(expression.file)) {
    const response = await fetch(expression.file, { cache: "no-cache" });
    if (!response.ok) throw new Error("無法載入表情檔：" + expression.file);
    expressionPresetCache.set(expression.file, await response.json());
  }
  return expressionPresetCache.get(expression.file);
}

function applyExpressionPresetOnce(coreModel, preset) {
  if (!preset || !Array.isArray(preset.Parameters)) return;
  preset.Parameters.forEach((param) => {
    if (!param || !param.Id) return;
    setParamSafe(coreModel, param.Id, param.Value);
  });
}

function getParamSafe(coreModel, id) {
  try {
    if (typeof coreModel.getParameterValueById === "function") {
      return Number(coreModel.getParameterValueById(id)) || 0;
    }
    if (typeof coreModel.getParameterValue === "function") {
      return Number(coreModel.getParameterValue(id)) || 0;
    }
  } catch (e) {}
  return 0;
}

function captureExpressionValues(coreModel, preset) {
  if (!preset || !Array.isArray(preset.Parameters)) return [];
  return preset.Parameters
    .filter((param) => param && param.Id)
    .map((param) => ({ id: param.Id, value: getParamSafe(coreModel, param.Id) }));
}

function restoreExpressionValues(coreModel, snapshot) {
  if (!Array.isArray(snapshot)) return;
  snapshot.forEach((entry) => {
    if (!entry || !entry.id) return;
    setParamSafe(coreModel, entry.id, entry.value);
  });
}

async function triggerExpression(expressionKey) {
  const spec = getCurrentModelSpec();
  if (!live2dModel) {
    alert("請先載入模型！");
    return;
  }
  if (spec.expressionMode !== "presets") return;
  try {
    const preset = await loadExpressionPreset(spec.key, expressionKey);
    const im = live2dModel.internalModel;
    const coreModel = im && im.coreModel;
    if (!coreModel || !preset) return;

    if (activeExpressionKey === expressionKey) {
      restoreExpressionValues(coreModel, activeExpressionRestore);
      activeExpressionKey = null;
      activeExpressionRestore = null;
      renderModelControls();
      return;
    }

    if (activeExpressionKey && activeExpressionRestore) {
      restoreExpressionValues(coreModel, activeExpressionRestore);
      activeExpressionKey = null;
      activeExpressionRestore = null;
    }

    activeExpressionRestore = captureExpressionValues(coreModel, preset);
    applyExpressionPresetOnce(coreModel, preset);
    activeExpressionKey = expressionKey;
    renderModelControls();
  } catch (e) {
    console.warn("Expression preset load failed:", e);
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function initLive2DDemo() {
  if (live2dInited) return;
  live2dInited = true;
}

async function loadLive2DModel() {
  const badge = document.getElementById("demoStatusBadge");
  const placeholder = document.getElementById("live2dPlaceholder");
  const canvasEl = document.getElementById("live2dCanvas");
  const spec = getCurrentModelSpec();
  if (!spec) {
    if (badge) {
      badge.textContent = "模型設定遺失";
      badge.className =
        "text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full";
    }
    return;
  }
  activeExpressionKey = null;
  activeExpressionRestore = null;
  renderModelControls();
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
    spec.modelUrl,
    "https://corsproxy.io/?url=" + encodeURIComponent(spec.modelUrl),
  ];

  try {
    const wrapper = document.getElementById("live2dWrapper");

    const w = wrapper.clientWidth || 400,
      h = wrapper.clientHeight || 420;

    if (!live2dApp) {
      live2dApp = new PIXI.Application({
        width: w,
        height: h,
        backgroundAlpha: 0,
        view: canvasEl,
        antialias: true,
      });
    } else {
      live2dApp.renderer.resize(w, h);
    }
    canvasEl.style.display = "block";
    placeholder.style.display = "none";

    if (live2dModel) {
      try {
        live2dApp.stage.removeChild(live2dModel);
        live2dModel.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
      } catch (e) {
        console.warn("清除舊的 Live2D 模型時發生非致命錯誤：", e);
      }
      live2dModel = null;
    }

    isLeftDragging = false;
    isRightDragging = false;
    isMiddleDragging = false;
    isTwoFingerTouch = false;
    pose.headX =
      pose.headY =
      pose.headZ =
      pose.bodyX =
      pose.bodyY =
      pose.bodyZ =
      pose.eyeX =
      pose.eyeY =
        0;
    poseTarget.headX =
      poseTarget.headY =
      poseTarget.headZ =
      poseTarget.bodyX =
      poseTarget.bodyY =
      poseTarget.bodyZ =
      poseTarget.eyeX =
      poseTarget.eyeY =
        0;

    let loadedModel = null;
    for (const url of urlsToTry) {
      try {
        loadedModel = await Live2DModelCtor.from(url, { autoInteract: false });
        break;
      } catch (e) {
        console.warn("Live2D model load attempt failed for", url, e);
        continue;
      }
    }
    if (!loadedModel) throw new Error("All URLs failed");
    live2dModel = loadedModel;

    live2dApp.stage.addChild(live2dModel);

    live2dModel.anchor.set(0.5, 0.5);

    baseScale =
      Math.min(
        w / live2dModel.internalModel.originalWidth,
        h / live2dModel.internalModel.originalHeight,
      ) * 0.85;

    viewOffsetX = 0;
    viewOffsetY = 0;
    viewZoom = 1;
    applyModelTransform(w, h);

    if (!tickerBound) {
      live2dApp.ticker.add(updatePose);
      tickerBound = true;
    }

    bindInteractionEvents();

    toggleSwitch("blink", demoParams.blink);
    toggleSwitch("physics", demoParams.physics);
    toggleSwitch("breathAuto", demoParams.breathAuto);
    if (spec.expressionMode === "sliders") {
      applyExpression("happy", demoParams.expressionHappy);
      applyExpression("surprised", demoParams.expressionSurprised);
    }

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

function updatePose() {
  if (!live2dModel) return;
  pose.headX += (poseTarget.headX - pose.headX) * POSE_LERP;
  pose.headY += (poseTarget.headY - pose.headY) * POSE_LERP;
  pose.headZ += (poseTarget.headZ - pose.headZ) * POSE_LERP;
  pose.bodyX += (poseTarget.bodyX - pose.bodyX) * POSE_LERP;
  pose.bodyY += (poseTarget.bodyY - pose.bodyY) * POSE_LERP;
  pose.bodyZ += (poseTarget.bodyZ - pose.bodyZ) * POSE_LERP;
  pose.eyeX += (poseTarget.eyeX - pose.eyeX) * POSE_LERP;
  pose.eyeY += (poseTarget.eyeY - pose.eyeY) * POSE_LERP;

  const im = live2dModel.internalModel;
  const coreModel = im && im.coreModel;
  if (!coreModel) return;

  setParamSafe(coreModel, "ParamAngleX", pose.headX);
  setParamSafe(coreModel, "ParamAngleY", pose.headY);
  setParamSafe(coreModel, "ParamAngleZ", pose.headZ);
  setParamSafe(coreModel, "ParamEyeBallX", pose.eyeX);
  setParamSafe(coreModel, "ParamEyeBallY", pose.eyeY);
  setParamSafe(coreModel, "ParamBodyAngleX", pose.bodyX);
  setParamSafe(coreModel, "ParamBodyAngleY", pose.bodyY);
  setParamSafe(coreModel, "ParamBodyAngleZ", pose.bodyZ);

  const spec = getCurrentModelSpec();
  if (spec && spec.expressionMode === "sliders") {
    applyExpression("happy", demoParams.expressionHappy);
    applyExpression("surprised", demoParams.expressionSurprised);
  }
}

function applyExpression(type, value) {
  if (!live2dModel) return;
  const im = live2dModel.internalModel;
  const coreModel = im && im.coreModel;
  if (!coreModel) return;
  const ids = EXPRESSION_PARAMS[type];
  if (!ids) return;

  const normalized = clamp(Number(value) || 0, 0, 1);
  const eyeOpen = 1 - normalized * 0.7;
  const mouthOpen = normalized * 0.8;

  ids.forEach((id) => {
    if (id === "ParamEyeLOpen" || id === "ParamEyeROpen") {
      setParamSafe(coreModel, id, eyeOpen);
    } else if (id === "ParamEyeROpen2") {
      setParamSafe(coreModel, id, mouthOpen);
    } else {
      setParamSafe(coreModel, id, normalized);
    }
  });
}

function setParamSafe(coreModel, id, value) {
  try {
    if (typeof coreModel.setParameterValueById === "function") {
      coreModel.setParameterValueById(id, value);
    } else if (typeof coreModel.setParameterValue === "function") {
      coreModel.setParameterValue(id, value);
    }
  } catch (e) {}
}

function bindInteractionEvents() {
  if (interactionBound) return;
  interactionBound = true;

  const wrapper = document.getElementById("live2dWrapper");
  wrapper.style.cursor = "grab";
  wrapper.addEventListener("contextmenu", (e) => e.preventDefault());

  wrapper.addEventListener("mousedown", (e) => {
    if (!live2dModel) return;
    if (e.button === 0) {
      isLeftDragging = true;
    } else if (e.button === 2) {
      isRightDragging = true;
      dragStartX = e.clientX;
    } else if (e.button === 1) {
      isMiddleDragging = true;
      wrapper.style.cursor = "grabbing";
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartOffsetX = viewOffsetX;
      dragStartOffsetY = viewOffsetY;
    } else {
      return;
    }
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!live2dModel) return;
    const rect = wrapper.getBoundingClientRect();

    if (isLeftDragging && !(e.buttons & 1)) {
      isLeftDragging = false;
      poseTarget.headX = 0;
      poseTarget.headY = 0;
      poseTarget.bodyX = 0;
      poseTarget.bodyY = 0;
      poseTarget.eyeX = 0;
      poseTarget.eyeY = 0;
    }
    if (isRightDragging && !(e.buttons & 2)) {
      isRightDragging = false;
      poseTarget.headZ = 0;
      poseTarget.bodyZ = 0;
    }
    if (isMiddleDragging && !(e.buttons & 4)) {
      isMiddleDragging = false;
      wrapper.style.cursor = "grab";
    }

    if (isLeftDragging) {
      const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      poseTarget.headX = nx * RANGE.headX;
      poseTarget.headY = -ny * RANGE.headY;
      poseTarget.bodyX = nx * RANGE.bodyX;
      poseTarget.bodyY = -ny * RANGE.bodyY;
      poseTarget.eyeX = nx * RANGE.eye;
      poseTarget.eyeY = -ny * RANGE.eye;
    }
    if (isRightDragging) {
      const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      poseTarget.headZ = nx * RANGE.headZ;
      poseTarget.bodyZ = nx * RANGE.bodyZ;
    }
    if (isMiddleDragging) {
      viewOffsetX = dragStartOffsetX + (e.clientX - dragStartX);
      viewOffsetY = dragStartOffsetY + (e.clientY - dragStartY);
      applyModelTransform(rect.width, rect.height);
      return;
    }
  });

  const endLeftDrag = () => {
    if (isLeftDragging) {
      poseTarget.headX = 0;
      poseTarget.headY = 0;
      poseTarget.bodyX = 0;
      poseTarget.bodyY = 0;
      poseTarget.eyeX = 0;
      poseTarget.eyeY = 0;
    }
    isLeftDragging = false;
  };
  const endRightDrag = () => {
    if (isRightDragging) {
      poseTarget.headZ = 0;
      poseTarget.bodyZ = 0;
    }
    isRightDragging = false;
  };
  const endMiddleDrag = () => {
    isMiddleDragging = false;
    wrapper.style.cursor = "grab";
  };

  document.addEventListener("mouseup", (e) => {
    if (e.button === 0) endLeftDrag();
    else if (e.button === 2) endRightDrag();
    else if (e.button === 1) endMiddleDrag();
  });

  wrapper.addEventListener(
    "wheel",
    (e) => {
      if (!live2dModel) return;
      e.preventDefault();
      const rect = wrapper.getBoundingClientRect();
      const zoomStep = 0.1;
      const dir = e.deltaY < 0 ? 1 : -1;
      viewZoom = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, viewZoom + dir * zoomStep),
      );
      applyModelTransform(rect.width, rect.height);
    },
    { passive: false },
  );

  wrapper.addEventListener(
    "touchmove",
    (e) => {
      if (!live2dModel) return;
      const rect = wrapper.getBoundingClientRect();
      if (e.touches.length >= 2) {
        e.preventDefault();
        isTwoFingerTouch = true;
        const t0 = e.touches[0],
          t1 = e.touches[1];
        const midX = (t0.clientX + t1.clientX) / 2;
        const nx = clamp(((midX - rect.left) / rect.width) * 2 - 1, -1, 1);
        poseTarget.headZ = nx * RANGE.headZ;
        poseTarget.bodyZ = nx * RANGE.bodyZ;
        return;
      }

      const touch = e.touches[0];
      const nx = clamp(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      const ny = clamp(
        ((touch.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1,
      );
      poseTarget.headX = nx * RANGE.headX;
      poseTarget.headY = -ny * RANGE.headY;
      poseTarget.bodyX = nx * RANGE.bodyX;
      poseTarget.bodyY = -ny * RANGE.bodyY;
      poseTarget.eyeX = nx * RANGE.eye;
      poseTarget.eyeY = -ny * RANGE.eye;
    },
    { passive: false },
  );
  wrapper.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      poseTarget.headX = 0;
      poseTarget.headY = 0;
      poseTarget.bodyX = 0;
      poseTarget.bodyY = 0;
      poseTarget.eyeX = 0;
      poseTarget.eyeY = 0;
      if (isTwoFingerTouch) {
        poseTarget.headZ = 0;
        poseTarget.bodyZ = 0;
      }
      isTwoFingerTouch = false;
    } else if (e.touches.length === 1 && isTwoFingerTouch) {
      poseTarget.headZ = 0;
      poseTarget.bodyZ = 0;
      isTwoFingerTouch = false;
    }
  });
  wrapper.addEventListener("touchcancel", () => {
    poseTarget.headX = 0;
    poseTarget.headY = 0;
    poseTarget.bodyX = 0;
    poseTarget.bodyY = 0;
    poseTarget.eyeX = 0;
    poseTarget.eyeY = 0;
    poseTarget.headZ = 0;
    poseTarget.bodyZ = 0;
    isTwoFingerTouch = false;
  });
}

function applyModelTransform(w, h) {
  if (!live2dModel) return;
  try {
    live2dModel.scale.set(baseScale * viewZoom);
    live2dModel.x = w / 2 + viewOffsetX;
    live2dModel.y = h / 2 + viewOffsetY;
  } catch (e) {}
}

function resetView() {
  viewOffsetX = 0;
  viewOffsetY = 0;
  viewZoom = 1;
  if (!live2dModel) return;
  const wrapper = document.getElementById("live2dWrapper");
  const rect = wrapper.getBoundingClientRect();
  applyModelTransform(rect.width, rect.height);
}

let enlargePlaceholder = null;
function toggleEnlargeView() {
  const showcase = document.getElementById("modelShowcaseGrid");
  const isEnlarged = document.body.classList.contains("model-enlarged");
  if (!isEnlarged) {
    enlargePlaceholder = document.createComment("model-enlarge-placeholder");
    showcase.parentNode.insertBefore(enlargePlaceholder, showcase);
    document.body.appendChild(showcase);
    document.body.classList.add("model-enlarged");
  } else {
    if (enlargePlaceholder && enlargePlaceholder.parentNode) {
      enlargePlaceholder.parentNode.insertBefore(showcase, enlargePlaceholder);
      enlargePlaceholder.remove();
    }
    enlargePlaceholder = null;
    document.body.classList.remove("model-enlarged");
  }

  const nowEnlarged = !isEnlarged;
  const icon = document.getElementById("enlargeViewIcon");
  const label = document.getElementById("enlargeViewLabel");
  const btn = document.getElementById("enlargeViewBtn");
  if (icon)
    icon.className = nowEnlarged
      ? "fa-solid fa-compress"
      : "fa-solid fa-expand";
  if (label) label.textContent = nowEnlarged ? "縮小檢視" : "放大檢視";
  if (btn)
    btn.title = nowEnlarged
      ? "縮小檢視（還原成一般畫面）"
      : "放大檢視（全螢幕）";

  setTimeout(handleEnlargeViewChange, 80);
}

function handleEnlargeViewChange() {
  if (!live2dApp || !live2dModel) return;
  const wrapper = document.getElementById("live2dWrapper");
  const w = wrapper.clientWidth || 400,
    h = wrapper.clientHeight || 420;
  try {
    live2dApp.renderer.resize(w, h);
    baseScale =
      Math.min(
        w / live2dModel.internalModel.originalWidth,
        h / live2dModel.internalModel.originalHeight,
      ) * 0.85;
    applyModelTransform(w, h);
  } catch (e) {}
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

function normalizeMotionConfig(motion) {
  if (!motion) return null;
  return {
    key: motion.key || motion.name || "motion",
    name: motion.name || "",
    label: motion.label || motion.name || motion.key || "motion",
    group: motion.group || motion.name || motion.motionGroup || "",
    index: Number.isInteger(motion.index) ? motion.index : 0,
    priority: Number.isInteger(motion.priority) ? motion.priority : 3,
    file: motion.file || motion.path || motion.url || "",
  };
}

function normalizeMotionToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
}

function normalizeMotionFileName(filePath) {
  const rawName = String(filePath || "").split("/").pop() || "";
  try {
    return normalizeMotionToken(decodeURIComponent(rawName));
  } catch (e) {
    return normalizeMotionToken(rawName);
  }
}

function getSettingsMotionGroups(internalModel) {
  return (
    (internalModel &&
      internalModel.settings &&
      (internalModel.settings.motions ||
        (internalModel.settings.json &&
          internalModel.settings.json.FileReferences &&
          internalModel.settings.json.FileReferences.Motions))) ||
    null
  );
}

function getMotionGroups(motionManager, internalModel) {
  const groups = new Set();
  const addGroup = (name) => {
    if (typeof name === "string" && name.trim()) groups.add(name);
  };

  const managerGroups =
    motionManager && (motionManager.definitions || motionManager.motionGroups);
  if (managerGroups && typeof managerGroups === "object") {
    Object.keys(managerGroups).forEach(addGroup);
  }

  const settingsGroups = getSettingsMotionGroups(internalModel);
  if (settingsGroups && typeof settingsGroups === "object") {
    Object.keys(settingsGroups).forEach(addGroup);
  }

  return Array.from(groups);
}

function resolveMotionGroupName(motionCfg, motionManager, internalModel) {
  const groups = getMotionGroups(motionManager, internalModel);
  const candidates = [
    motionCfg.group,
    motionCfg.name,
    motionCfg.key,
    motionCfg.label,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (groups.includes(candidate)) return candidate;
  }

  const groupMap = new Map(
    groups.map((groupName) => [normalizeMotionToken(groupName), groupName]),
  );
  for (const candidate of candidates) {
    const hit = groupMap.get(normalizeMotionToken(candidate));
    if (hit) return hit;
  }

  return motionCfg.group || groups[0] || "";
}

function resolveMotionIndexByFile(motionManager, group, filePath) {
  if (!motionManager || !group || !filePath) return null;
  const groups = motionManager.definitions || motionManager.motionGroups;
  const entries = groups && groups[group];
  if (!Array.isArray(entries)) return null;
  const wanted = normalizeMotionFileName(filePath);
  if (!wanted) return null;
  const idx = entries.findIndex((entry) => {
    const entryFile = entry && (entry.File || entry.file);
    if (typeof entryFile !== "string") return false;
    const current = normalizeMotionFileName(entryFile);
    return current === wanted;
  });
  return idx >= 0 ? idx : null;
}

function resolveSettingsMotionByFile(internalModel, filePath) {
  const settingsGroups = getSettingsMotionGroups(internalModel);
  if (!settingsGroups || !filePath) return null;
  const wanted = normalizeMotionFileName(filePath);
  if (!wanted) return null;

  for (const groupName of Object.keys(settingsGroups)) {
    const motions = settingsGroups[groupName];
    if (!Array.isArray(motions)) continue;
    for (let i = 0; i < motions.length; i += 1) {
      const entry = motions[i];
      const entryFile = entry && (entry.File || entry.file);
      if (typeof entryFile !== "string") continue;
      if (normalizeMotionFileName(entryFile) === wanted) {
        return { group: groupName, index: i };
      }
    }
  }

  return null;
}

function resolveMotionTarget(motionCfg, motionManager, internalModel) {
  let group = resolveMotionGroupName(motionCfg, motionManager, internalModel);
  let index = Number.isInteger(motionCfg.index) ? motionCfg.index : 0;

  if (motionCfg.file && motionManager) {
    const currentIndex = resolveMotionIndexByFile(
      motionManager,
      group,
      motionCfg.file,
    );
    if (Number.isInteger(currentIndex)) {
      index = currentIndex;
      return { group, index };
    }

    const managerGroups = motionManager.definitions || motionManager.motionGroups;
    if (managerGroups && typeof managerGroups === "object") {
      for (const groupName of Object.keys(managerGroups)) {
        const foundIndex = resolveMotionIndexByFile(
          motionManager,
          groupName,
          motionCfg.file,
        );
        if (Number.isInteger(foundIndex)) {
          group = groupName;
          index = foundIndex;
          return { group, index };
        }
      }
    }
  }

  if (motionCfg.file) {
    const hit = resolveSettingsMotionByFile(internalModel, motionCfg.file);
    if (hit) {
      return { group: hit.group, index: hit.index };
    }
  }

  return { group, index };
}

async function triggerMotionByConfig(motionCfg) {
  if (!live2dModel || !motionCfg) return false;
  const im = live2dModel.internalModel;
  const motionManager = (im && (im.motionManager || im.motion)) || null;
  const availableGroups = getMotionGroups(motionManager, im);
  const target = resolveMotionTarget(motionCfg, motionManager, im);
  const tryCalls = [];

  if (typeof live2dModel.motion === "function" && target.group) {
    tryCalls.push(async () => {
      await live2dModel.motion(target.group, target.index, motionCfg.priority);
      return true;
    });
    tryCalls.push(async () => {
      await live2dModel.motion(target.group);
      return true;
    });
  }

  if (motionManager && typeof motionManager.startMotion === "function" && target.group) {
    tryCalls.push(async () => {
      await motionManager.startMotion(target.group, target.index, motionCfg.priority);
      return true;
    });
  }

  if (motionManager && typeof motionManager.startRandomMotion === "function" && target.group) {
    tryCalls.push(async () => {
      await motionManager.startRandomMotion(target.group, motionCfg.priority);
      return true;
    });
  }

  if (motionManager && typeof motionManager.startMotionByName === "function" && motionCfg.file) {
    tryCalls.push(async () => {
      await motionManager.startMotionByName(motionCfg.file, motionCfg.priority);
      return true;
    });
  }

  if (typeof live2dModel.motion === "function") {
    const fallbackNames = [motionCfg.name, motionCfg.group, motionCfg.key].filter(Boolean);
    fallbackNames.forEach((candidate) => {
      tryCalls.push(async () => {
        await live2dModel.motion(candidate);
        return true;
      });
    });
  }

  for (const call of tryCalls) {
    try {
      const ok = await call();
      if (ok) return true;
    } catch (e) {
      continue;
    }
  }
  console.warn("Motion trigger fallback exhausted", {
    motionCfg,
    target,
    availableGroups,
  });
  return false;
}

async function triggerMotionByKey(motionKey) {
  if (!live2dModel) {
    alert("請先載入模型！");
    return;
  }
  const spec = getCurrentModelSpec();
  const motion = getMotionByKey(spec, motionKey);
  if (!motion) {
    console.warn("Motion config not found:", motionKey);
    return;
  }
  const motionCfg = normalizeMotionConfig(motion);
  try {
    const triggered = await triggerMotionByConfig(motionCfg);
    if (!triggered) {
      console.warn("Motion trigger failed (all strategies):", motionCfg);
    }
  } catch (e) {
    console.warn("Motion trigger failed:", motionCfg, e);
  }
}

async function triggerMotion(name) {
  const spec = getCurrentModelSpec();
  const motion =
    (spec?.motions || []).find((item) => item && item.name === name) || null;
  if (motion && motion.key) {
    await triggerMotionByKey(motion.key);
    return;
  }
  if (!live2dModel) {
    alert("請先載入模型！");
    return;
  }
  try {
    if (typeof live2dModel.motion === "function") {
      await live2dModel.motion(name);
    }
  } catch (e) {
    console.warn("Motion trigger failed (legacy):", name, e);
  }
}

function switchModel(modelKey) {
  if (!MODEL_SPECS[modelKey]) return;
  currentModelKey = modelKey;
  activeExpressionKey = null;
  activeExpressionRestore = null;
  try {
    localStorage.setItem("hakka_live2d_model", modelKey);
  } catch (e) {}
  renderModelControls();
  if (live2dModel || live2dApp) {
    loadLive2DModel();
  }
}

function updateParam(type, val) {
  const spec = getCurrentModelSpec();
  if (!spec || spec.expressionMode !== "sliders") return;
  const pct = Math.round(val);
  demoParams[type] = pct / 100;
  if (type === "expressionHappy") {
    const el = document.getElementById("expressionHappyVal");
    if (el) el.textContent = pct + "%";
  }
  if (type === "expressionSurprised") {
    const el = document.getElementById("expressionSurprisedVal");
    if (el) el.textContent = pct + "%";
  }

  if (live2dModel) {
    try {
      if (type === "expressionHappy")
        applyExpression("happy", demoParams.expressionHappy);
      if (type === "expressionSurprised")
        applyExpression("surprised", demoParams.expressionSurprised);
    } catch (e) {}
  }
}

function toggleSwitch(type, val) {
  demoParams[type] = val;
  if (!live2dModel) return;
  try {
    if (type === "blink") {
      const im = live2dModel.internalModel;
      if (im._eyeBlinkBackup === undefined) im._eyeBlinkBackup = im.eyeBlink;
      im.eyeBlink = val ? im._eyeBlinkBackup : null;
      if (im.coreModel && !val) {
        setParamSafe(im.coreModel, "ParamEyeLOpen", 1);
        setParamSafe(im.coreModel, "ParamEyeROpen", 1);
      }
    }

    if (type === "physics") {
      const im = live2dModel.internalModel;
      if (im._physicsBackup === undefined) im._physicsBackup = im.physics;
      im.physics = val ? im._physicsBackup : null;
    }

    if (type === "breathAuto") {
      const im = live2dModel.internalModel;
      const coreModel = im && im.coreModel;
      if (im._breathBackup === undefined) im._breathBackup = im.breath;
      im.breath = val ? im._breathBackup : null;
      if (coreModel && !val) {
        setParamSafe(coreModel, "ParamBreath", 0);
        setParamSafe(coreModel, "ParamBreath2", 0);
      }
    }
  } catch (e) {}
}

renderModelControls();
