(function () {
  const catalog = document.querySelector('.challenge-catalog');
  if (!catalog) return;

  const searchInput = document.getElementById('challenge-search');
  const emptyMsg = catalog.querySelector('.challenge-catalog__empty');
  const filterButtons = [...catalog.querySelectorAll('.challenge-catalog__filter')];
  const categories = [...catalog.querySelectorAll('.challenge-category')];
  const rows = [...catalog.querySelectorAll('.challenge-index__row')];

  let activeFilter = 'all';

  function normalize(text) {
    return (text || '').toLowerCase().trim();
  }

  function rowMatchesSearch(row, query) {
    if (!query) return true;
    const haystack = normalize(row.getAttribute('data-search') || row.textContent);
    return haystack.includes(query);
  }

  function rowMatchesFilter(row) {
    if (activeFilter === 'all') return true;
    return row.getAttribute('data-category') === activeFilter;
  }

  function applyFilters() {
    const query = normalize(searchInput ? searchInput.value : '');
    let visibleCount = 0;

    categories.forEach((cat) => {
      const catId = cat.getAttribute('data-category');
      const catRows = [...cat.querySelectorAll('.challenge-index__row')];
      let catVisible = 0;

      catRows.forEach((row) => {
        const show = rowMatchesFilter(row) && rowMatchesSearch(row, query);
        row.hidden = !show;
        if (show) catVisible += 1;
      });

      const showCategory =
        activeFilter === 'all' || activeFilter === catId ? catVisible > 0 : false;
      cat.hidden = !showCategory;
      if (showCategory) visibleCount += catVisible;
    });

    if (emptyMsg) {
      emptyMsg.hidden = visibleCount > 0;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter') || 'all';
      filterButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      applyFilters();
    });
  });

  function openRowFromHash() {
    const id = decodeURIComponent((location.hash || '').slice(1));
    if (!id) return;

    const row = document.getElementById(id);
    if (!row) return;

    const category = row.closest('.challenge-category');
    if (category) category.open = true;

    const nested = row.querySelector('details');
    if (nested) nested.open = true;

    requestAnimationFrame(() => {
      row.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openCategoryFromQuery() {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    if (!categoryId) return;

    const cat = document.getElementById('category-' + categoryId);
    if (cat) cat.open = true;
  }

  window.addEventListener('hashchange', openRowFromHash);
  window.addEventListener('load', () => {
    openCategoryFromQuery();
    openRowFromHash();
    applyFilters();
  });

  applyFilters();
})();
