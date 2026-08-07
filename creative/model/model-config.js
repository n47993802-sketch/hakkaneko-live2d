window.MODEL_RENDER_CONFIG = {
  defaultModelKey: "hakkanekoqq",
  modelOrder: ["hakkanekoqq", "test"],
  models: {
    hakkanekoqq: {
      key: "hakkanekoqq",
      label: "阿卡貓 HakkaNekoQQ",
      displayName: "阿卡貓 HakkaNekoQQ",
      sourceLabel: "models/HakkaNekoQQ/HakkaNekoQQ.model3.json",
      modelUrl: encodeURI(
        "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/models/HakkaNekoQQ/HakkaNekoQQ.model3.json?v=20260807a",
      ),
      motions: [
        {
          key: "idle",
          name: "Idle",
          label: "待機",
          icon: "bedtime",
          buttonClass:
            "bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 border-purple-500/30",
        },
        {
          key: "tapBody",
          name: "TapBody",
          label: "揮手",
          icon: "waving_hand",
          buttonClass:
            "bg-pink-600/30 hover:bg-pink-600/60 text-pink-200 border-pink-500/30",
        },
      ],
      expressionMode: "sliders",
      sliderLabels: {
        expressionHappy: "開心",
        expressionSurprised: "驚訝",
      },
      sliderStyles: {
        expressionHappy: "accent-blue-500",
        expressionSurprised: "accent-indigo-500",
      },
    },
    test: {
      key: "test",
      label: "Test",
      displayName: "Test",
      sourceLabel: "models/Test/Test 五官技术升级.model3.json",
      modelUrl: encodeURI(
        "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/models/Test/Test 五官技术升级.model3.json?v=20260807a",
      ),
      motions: [
        {
          key: "testFaceTracking",
          name: "Test Face Tracking",
          group: "Test Face Tracking",
          index: 0,
          file: "models/Test/Motions/Test Face Tracking.motion3.json",
          label: "嘴部控制",
          icon: "record_voice_over",
          buttonClass:
            "bg-cyan-600/30 hover:bg-cyan-600/60 text-cyan-200 border-cyan-500/30",
        },
      ],
      expressionMode: "presets",
      expressions: [
        {
          key: "angry",
          label: "生氣",
          file: encodeURI(
            "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/models/Test/Expressions/1.exp3.json",
          ),
        },
        {
          key: "sad",
          label: "傷心",
          file: encodeURI(
            "https://raw.githubusercontent.com/n47993802-sketch/Live2D-/main/models/Test/Expressions/2.exp3.json",
          ),
        },
      ],
    },
  },
  expressionParams: {
    happy: [],
    surprised: ["ParamEyeROpen2"],
  },
  runtimeParams: {
    autoBlink: ["ParamEyeLOpen", "ParamEyeROpen"],
    autoBreath: ["ParamBreath"],
  },
};
