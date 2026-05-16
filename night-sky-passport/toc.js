(function () {
  const sidebar = document.querySelector('.toc-sidebar');
  if (!sidebar) return;

  const links = [...sidebar.querySelectorAll('a[href^="#"]')];
  const sections = links
    .map((link) => {
      const id = link.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.el.offsetTop - b.el.offsetTop);

  if (!sections.length) return;

  let activeId = null;
  const scrollOffset = 96;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    links.forEach((link) => {
      const match = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', match);
      if (match) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    const position = window.scrollY + scrollOffset;
    let current = sections[0].el.id;

    for (const { el } of sections) {
      if (el.offsetTop <= position) {
        current = el.id;
      }
    }

    setActive(current);
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
    },
    { passive: true }
  );

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').slice(1);
      setActive(id);
    });
  });

  window.addEventListener('load', updateActiveSection);
  window.addEventListener('hashchange', updateActiveSection);
  updateActiveSection();
})();
