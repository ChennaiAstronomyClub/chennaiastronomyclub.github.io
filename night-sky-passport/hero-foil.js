(function () {
  const hero = document.querySelector('.hero--foil');
  if (!hero) return;

  const panel = hero.querySelector('.hero__foil-panel');
  if (!panel) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const kolamGrad = document.getElementById('kolam-foil');
  const stars = panel.querySelectorAll('.hero__star');

  const isIOS =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const touchCapable = navigator.maxTouchPoints > 0;
  const coarseOrNoHover =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const isMobileLike =
    isIOS ||
    isAndroid ||
    (touchCapable && (coarseOrNoHover || window.innerWidth < 1200));

  const needsOrientationPermission =
    isIOS && typeof DeviceOrientationEvent?.requestPermission === 'function';

  stars.forEach((star) => {
    if (!star.dataset.baseOpacity) {
      star.dataset.baseOpacity = star.style.opacity || '0.25';
      star.dataset.left = (parseFloat(star.style.left) / 100).toFixed(4);
    }
  });

  const maxTilt = 3;
  const viewW = 2048;
  const DEFAULT_X = 0.52;
  const DEFAULT_Y = 0.48;

  const mode =
    !isMobileLike && hasFinePointer
      ? 'pointer'
      : isMobileLike
        ? 'mobile'
        : 'static';

  let raf = 0;
  let targetX = DEFAULT_X;
  let targetY = DEFAULT_Y;
  let currentX = DEFAULT_X;
  let currentY = DEFAULT_Y;
  let active = false;
  let orientationListening = false;
  let motionListening = false;
  let touchReady = false;
  let baseGamma = null;
  let baseBeta = null;

  panel.dataset.heroMode = mode;

  const motionBtn = document.createElement('button');
  motionBtn.type = 'button';
  motionBtn.className = 'hero__motion-enable';
  motionBtn.hidden = true;
  motionBtn.textContent = 'Enable tilt & shine';
  const inner = panel.querySelector('.hero__foil-inner');
  if (inner) inner.appendChild(motionBtn);

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function resetStars() {
    stars.forEach((star) => {
      star.style.opacity = star.dataset.baseOpacity;
      star.style.boxShadow = '';
    });
  }

  function setStatic() {
    panel.classList.add('hero__foil-panel--static');
    panel.classList.remove('is-active', 'hero__foil-panel--orientation');
    active = false;
    targetX = currentX = DEFAULT_X;
    targetY = currentY = DEFAULT_Y;
    apply(DEFAULT_X, DEFAULT_Y, false);
    resetStars();
  }

  function setLive() {
    panel.classList.remove('hero__foil-panel--static');
  }

  function showMotionButton(label) {
    motionBtn.hidden = false;
    if (label) motionBtn.textContent = label;
  }

  function hideMotionButton() {
    motionBtn.hidden = true;
  }

  function updateKolamFoil(gp) {
    if (!kolamGrad) return;
    const slide = (gp - 0.5) * viewW * 1.15;
    kolamGrad.setAttribute('gradientTransform', `translate(${slide.toFixed(0)} 0)`);
  }

  function updateStars(x, lit) {
    if (!stars.length || !lit) {
      resetStars();
      return;
    }

    const litX = 1 - x;

    stars.forEach((star) => {
      const base = parseFloat(star.dataset.baseOpacity);
      const left = parseFloat(star.dataset.left);
      const dist = Math.abs(left - litX);
      const side = 1 - Math.min(1, dist / 0.32);
      const mul = 1 + side * side * 4.2;
      const opacity = Math.min(0.72, base * mul);

      star.style.opacity = opacity.toFixed(3);

      if (side > 0.2) {
        const glow = 0.12 + side * 0.45;
        const blur = 1.5 + side * 4;
        const rgb = star.dataset.glow || '245,248,255';
        star.style.boxShadow = `0 0 ${blur.toFixed(1)}px rgba(${rgb},${glow.toFixed(2)})`;
      } else {
        star.style.boxShadow = '';
      }
    });
  }

  function apply(x, y, lit) {
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;
    const tilt = Math.min(1, Math.hypot(nx, ny) * 0.72);

    if (panel.classList.contains('hero__foil-panel--static')) {
      panel.style.setProperty('--foil-rx', '0deg');
      panel.style.setProperty('--foil-ry', '0deg');
    } else {
      panel.style.setProperty('--foil-rx', `${(-ny * maxTilt).toFixed(2)}deg`);
      panel.style.setProperty('--foil-ry', `${(nx * maxTilt).toFixed(2)}deg`);
    }

    panel.style.setProperty('--foil-mx', `${(x * 100).toFixed(1)}%`);
    panel.style.setProperty('--foil-my', `${(y * 100).toFixed(1)}%`);
    panel.style.setProperty('--foil-gp', x.toFixed(3));
    panel.style.setProperty('--foil-gp-desc', (x * 0.85 + 0.075).toFixed(3));
    panel.style.setProperty('--foil-tilt', tilt.toFixed(3));

    updateKolamFoil(x);
    updateStars(x, lit);
  }

  function tick() {
    const ease = active ? 0.2 : 0.14;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    const lit = active && !panel.classList.contains('hero__foil-panel--static');
    apply(currentX, currentY, lit);

    if (
      Math.abs(targetX - currentX) > 0.0008 ||
      Math.abs(targetY - currentY) > 0.0008 ||
      active
    ) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  function queue(x, y) {
    targetX = x;
    targetY = y;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function pointerFromClient(clientX, clientY) {
    const rect = panel.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  }

  function onOrientation(event) {
    if (event.gamma == null || event.beta == null) return;

    setLive();
    hideMotionButton();

    if (baseGamma === null) {
      baseGamma = event.gamma;
      baseBeta = event.beta;
    }

    const gamma = event.gamma - baseGamma;
    const beta = event.beta - baseBeta;
    const x = clamp(0.5 + gamma / 38, 0.12, 0.88);
    const y = clamp(DEFAULT_Y + beta / 52, 0.22, 0.78);

    active = true;
    panel.classList.add('is-active', 'hero__foil-panel--orientation');
    queue(x, y);
  }

  function onDeviceMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null) return;

    setLive();
    hideMotionButton();

    const x = clamp(0.5 - acc.x / 12, 0.12, 0.88);
    const y = clamp(DEFAULT_Y + acc.y / 14, 0.22, 0.78);

    active = true;
    panel.classList.add('is-active', 'hero__foil-panel--orientation');
    queue(x, y);
  }

  function startOrientation() {
    if (!orientationListening) {
      orientationListening = true;
      baseGamma = null;
      baseBeta = null;
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }
    if (!motionListening && 'DeviceMotionEvent' in window) {
      motionListening = true;
      window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
    }
  }

  function stopSensors() {
    if (orientationListening) {
      orientationListening = false;
      window.removeEventListener('deviceorientation', onOrientation);
    }
    if (motionListening) {
      motionListening = false;
      window.removeEventListener('devicemotion', onDeviceMotion);
    }
    panel.classList.remove('hero__foil-panel--orientation', 'is-active');
  }

  function requestSensorAccess() {
    const requests = [];

    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      requests.push(DeviceOrientationEvent.requestPermission());
    }
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      requests.push(DeviceMotionEvent.requestPermission());
    }

    if (!requests.length) return Promise.resolve(['granted']);

    return Promise.all(requests);
  }

  function onMotionEnableClick() {
    requestSensorAccess()
      .then((results) => {
        const ok = results.every((state) => state === 'granted');
        if (ok) {
          setLive();
          startOrientation();
          hideMotionButton();
        } else {
          showMotionButton('Drag on cover for shine');
        }
      })
      .catch(() => {
        showMotionButton('Drag on cover for shine');
      });
  }

  function setupTouch() {
    if (touchReady) return;
    touchReady = true;

    function onTouchLike(e) {
      if (e.pointerType && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

      const point = e.touches?.[0] || e;
      if (point.clientX == null) return;

      setLive();
      active = true;
      panel.classList.add('is-active');
      const { x, y } = pointerFromClient(point.clientX, point.clientY);
      queue(x, y);
    }

    function onTouchEnd(e) {
      if (e.touches && e.touches.length > 0) return;
      active = false;
      panel.classList.remove('is-active');
      if (orientationListening || motionListening) return;
      setStatic();
    }

    panel.addEventListener('touchstart', onTouchLike, { passive: true, capture: true });
    panel.addEventListener('touchmove', onTouchLike, { passive: true, capture: true });
    panel.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    panel.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });

    panel.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') onTouchLike(e);
      },
      { passive: true, capture: true }
    );
    panel.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'touch') onTouchLike(e);
      },
      { passive: true, capture: true }
    );
    panel.addEventListener(
      'pointerup',
      (e) => {
        if (e.pointerType === 'touch') onTouchEnd(e);
      },
      { passive: true, capture: true }
    );
  }

  function setupMobile() {
    setStatic();
    setupTouch();

    motionBtn.addEventListener('click', onMotionEnableClick, false);

    if (needsOrientationPermission) {
      showMotionButton('Enable tilt & shine');
    } else {
      startOrientation();
    }
  }

  function setupPointer() {
    function onPointerMove(e) {
      if (e.pointerType === 'touch') return;
      active = true;
      panel.classList.add('is-active');
      const { x, y } = pointerFromClient(e.clientX, e.clientY);
      queue(x, y);
    }

    panel.addEventListener('pointerenter', onPointerMove, { passive: true });
    panel.addEventListener('pointermove', onPointerMove, { passive: true });
    panel.addEventListener(
      'pointerleave',
      () => {
        active = false;
        panel.classList.remove('is-active');
        queue(DEFAULT_X, DEFAULT_Y);
      },
      { passive: true }
    );

    apply(DEFAULT_X, DEFAULT_Y, false);
  }

  if (mode === 'pointer') {
    setupPointer();
  } else if (mode === 'mobile') {
    setupMobile();
  } else {
    setStatic();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSensors();
  });
})();
