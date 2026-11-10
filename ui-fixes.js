(() => {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu');
  const closeButton = sidebar?.querySelector('.sidebar-close');
  const scrim = document.getElementById('mobile-scrim');

  if (!sidebar || !menuButton || !closeButton || !scrim) return;

  function setOpen(open) {
    sidebar.classList.toggle('sidebar-open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    scrim.hidden = !open;
  }

  // امنع مستمع app.js القديم من تبديل القائمة مرة ثانية.
  menuButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(!sidebar.classList.contains('sidebar-open'));
  }, true);

  closeButton.addEventListener('click', () => setOpen(false));
  scrim.addEventListener('click', () => setOpen(false));

  sidebar.addEventListener('click', event => {
    if (event.target.closest('[data-view]')) setOpen(false);

    const debtButton = event.target.closest('[data-action="customer-debt"]');
    if (debtButton &&
        typeof window.closeModal === 'function' &&
        typeof window.openMovementForm === 'function') {
      window.closeModal();
      window.openMovementForm(debtButton.dataset.id);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
