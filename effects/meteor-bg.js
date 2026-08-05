(function () {
  const canvas = document.getElementById("meteor-canvas");
  const ctx = canvas.getContext("2d");
  let meteors = [],
    stars = [],
    nebulae = [],
    orbs = [];
  let animId,
    isLight = false,
    t = 0;
  let _resizeTimer = null;
  let isRunning = false;

  const reducedMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  function shouldRun() {
    return !document.hidden && !isLight && !reducedMotionMQ.matches;
  }
  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    _lastTs = 0;
    animId = requestAnimationFrame(draw);
  }
  function stopLoop() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
  }

  const isMobile =
    (("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 900) ||
    window.innerWidth <= 768;

  const STAR_COUNT = isMobile ? 40 : 100;
  const MAX_METEORS = isMobile ? 2 : 6;
  const ENABLE_BURST = !isMobile;
  const ENABLE_NEBULA = !isMobile;

  let _lastTs = 0,
    _slowFrames = 0,
    _degraded = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
    initNebulae();
  }

  function resizeDebounced() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(resize, 300);
  }

  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.022 + 0.006,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.05,
    }));
  }

  function initNebulae() {
    if (!ENABLE_NEBULA) {
      nebulae = [];
      return;
    }
    nebulae = [
      {
        x: canvas.width * 0.15,
        y: canvas.height * 0.2,
        r: 220,
        color: "rgba(168,85,247,",
        a: 0.04,
      },
      {
        x: canvas.width * 0.85,
        y: canvas.height * 0.15,
        r: 180,
        color: "rgba(236,72,153,",
        a: 0.03,
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height * 0.75,
        r: 260,
        color: "rgba(99,102,241,",
        a: 0.035,
      },
    ];
  }

  function spawnMeteor() {
    if (meteors.length >= MAX_METEORS) return;
    const colors = ["#e879f9", "#a855f7", "#818cf8", "#67e8f9", "#f472b6"];
    meteors.push({
      x: Math.random() * canvas.width * 1.4 - canvas.width * 0.2,
      y: -30,
      len: Math.random() * 150 + 80,
      speed: Math.random() * 5 + 4,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
      alpha: 1,
      width: Math.random() * 1.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function draw(ts) {
    if (!shouldRun()) {
      isRunning = false;
      return;
    }

    if (!_degraded && _lastTs > 0) {
      const delta = ts - _lastTs;
      if (delta > 50) {
        _slowFrames++;
        if (_slowFrames >= 3) {
          _degraded = true;

          stars = stars.slice(0, Math.floor(stars.length * 0.4));
          meteors = [];
        }
      } else {
        _slowFrames = 0;
      }
    }
    _lastTs = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.003;

    nebulae.forEach((n) => {
      const pulse = 1 + 0.15 * Math.sin(t + n.r);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * pulse);
      grad.addColorStop(0, n.color + n.a * 2 + ")");
      grad.addColorStop(1, n.color + "0)");
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    stars.forEach((s) => {
      s.tw += s.spd;
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -5) s.x = canvas.width + 5;
      if (s.x > canvas.width + 5) s.x = -5;
      if (s.y < -5) s.y = canvas.height + 5;
      if (s.y > canvas.height + 5) s.y = -5;

      const alpha = s.a * (0.4 + 0.6 * Math.sin(s.tw));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,200,255,${alpha.toFixed(3)})`;
      ctx.fill();

      if (ENABLE_BURST && !_degraded) {
        if (alpha > 0.55 && s.burst === undefined && Math.random() < 0.002) {
          s.burst = 1.0;
        }
        if (s.burst !== undefined) {
          s.burst -= 0.04;
          if (s.burst <= 0) {
            s.burst = undefined;
          } else {
            const bAlpha = s.burst * 0.65;
            const bLen = s.r * (5 + s.burst * 9);
            ctx.save();
            ctx.strokeStyle = "rgba(255,230,255,1)";
            ctx.lineCap = "round";
            ctx.globalAlpha = bAlpha;
            ctx.lineWidth = s.r * 0.55;
            ctx.beginPath();
            ctx.moveTo(s.x - bLen, s.y);
            ctx.lineTo(s.x + bLen, s.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - bLen);
            ctx.lineTo(s.x, s.y + bLen);
            ctx.stroke();
            ctx.globalAlpha = bAlpha * 0.4;
            ctx.lineWidth = s.r * 0.3;
            const d = bLen * 0.5;
            ctx.beginPath();
            ctx.moveTo(s.x - d, s.y - d);
            ctx.lineTo(s.x + d, s.y + d);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.x + d, s.y - d);
            ctx.lineTo(s.x - d, s.y + d);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    });

    if (Math.random() < 0.015) spawnMeteor();

    meteors = meteors.filter((m) => m.alpha > 0.02);
    meteors.forEach((m) => {
      const dx = Math.cos(m.angle) * m.len;
      const dy = Math.sin(m.angle) * m.len;
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - dx, m.y - dy);
      grad.addColorStop(0, hexToRgba(m.color, m.alpha));
      grad.addColorStop(0.3, hexToRgba(m.color, m.alpha * 0.5));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - dx, m.y - dy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.width;
      ctx.stroke();

      const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width * 4);
      hg.addColorStop(0, hexToRgba(m.color, m.alpha));
      hg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.width * 4, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();

      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.alpha -= 0.01;
    });

    animId = requestAnimationFrame(draw);
  }

  window.setMeteorMode = function (light) {
    isLight = light;
    if (shouldRun()) {
      startLoop();
    } else {
      stopLoop();

      if (isLight) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  document.addEventListener("visibilitychange", function () {
    if (shouldRun()) startLoop();
    else stopLoop();
  });

  try {
    reducedMotionMQ.addEventListener("change", function () {
      if (shouldRun()) {
        startLoop();
      } else {
        stopLoop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  } catch (e) {}

  window.addEventListener("resize", resizeDebounced);
  resize();
  if (shouldRun()) startLoop();
})();
