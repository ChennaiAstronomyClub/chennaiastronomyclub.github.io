(function () {
  const container = document.querySelector('.hero__stars');
  if (!container || container.querySelector('.hero__star')) return;

  const palette = [
    [0.28, [255, 255, 255]],
    [0.22, [140, 185, 255]],
    [0.14, [175, 210, 255]],
    [0.12, [255, 248, 220]],
    [0.1, [255, 225, 130]],
    [0.08, [255, 185, 95]],
    [0.04, [255, 125, 75]],
    [0.02, [255, 95, 115]],
  ];

  let seed = 20260520;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function pickColor() {
    const r = rnd();
    let acc = 0;
    for (const [w, rgb] of palette) {
      acc += w;
      if (r <= acc) return rgb;
    }
    return palette[0][1];
  }

  const count = 80;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'hero__star';

    const bright = rnd() < 0.1;
    const size = bright ? 2.5 + rnd() * 1.5 : 1.25 + rnd() * 1.25;
    const opacity = Math.min(
      0.42,
      (bright ? 0.45 + rnd() * 0.4 : 0.22 + rnd() * 0.45) * 0.48
    );
    const [r, g, b] = pickColor();

    star.dataset.glow = `${r},${g},${b}`;
    star.style.left = `${(rnd() * 100).toFixed(2)}%`;
    star.style.top = `${(rnd() * 100).toFixed(2)}%`;
    star.style.width = `${size.toFixed(2)}px`;
    star.style.height = star.style.width;
    star.style.opacity = opacity.toFixed(2);
    star.style.background = `rgba(${r}, ${g}, ${b}, 1)`;

    frag.appendChild(star);
  }

  container.appendChild(frag);
})();
