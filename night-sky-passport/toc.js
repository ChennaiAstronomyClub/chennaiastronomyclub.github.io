(function () {
  const sidebar = document.querySelector('.toc-sidebar');
  if (!sidebar) return;

  const links = [...sidebar.querySelectorAll('a[href^="#"]')];
  const chipLinks = [...document.querySelectorAll('.section-chips a[href^="#"]')];
  const allLinks = [...links, ...chipLinks];

  const sections = links
    .map((link) => {
      const id = link.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.el.offsetTop - b.el.offsetTop);

  if (!sections.length) return;

  const shallowList = sidebar.querySelector('.toc-sidebar__list--shallow');
  let activeId = null;
  const scrollOffset = 96;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;

    allLinks.forEach((link) => {
      const match = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', match);
      if (match) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (shallowList) {
      shallowList.querySelectorAll(':scope > li').forEach((li) => {
        li.classList.remove('is-expanded');
      });
      const activeLink = links.find((l) => l.getAttribute('href') === `#${id}`);
      if (activeLink) {
        const topLi = activeLink.closest('.toc-sidebar__list--shallow > li');
        if (topLi) topLi.classList.add('is-expanded');
      }
    }
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

  allLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').slice(1);
      setActive(id);
    });
  });

  window.addEventListener('load', updateActiveSection);
  window.addEventListener('hashchange', updateActiveSection);
  updateActiveSection();
})();
