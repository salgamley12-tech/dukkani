// Sole owner of sidebar state. Capture the hamburger click before app.js's
// legacy listener so a single tap cannot toggle the drawer twice.
(() => {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu');
  const scrim = document.getElementById('mobile-scrim');
  if (!sidebar || !menuButton || !scrim) return;

  const closeButton = sidebar.querySelector('.sidebar-close');
  if (!closeButton) return;

  function setOpen(open) {
    sidebar.classList.toggle('sidebar-open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    scrim.hidden = !open;
  }

  menuButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(!sidebar.classList.contains('sidebar-open'));
  }, true);

  closeButton.addEventListener('click', () => setOpen(false));
  scrim.addEventListener('click', () => setOpen(false));
  sidebar.addEventListener('click', event => {
    if (event.target.closest('[data-view]')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
