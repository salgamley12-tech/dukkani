// Mobile drawer controller. Capture the hamburger click before app.js's legacy
// listener so one tap cannot toggle the drawer twice.
(() => {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu');
  const scrim = document.getElementById('mobile-scrim');
  if (!sidebar || !menuButton || !scrim) return;

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

  scrim.addEventListener('click', () => setOpen(false));
  document.addEventListener('click', event => {
    if (event.target.closest('#sidebar [data-view]') && matchMedia('(max-width: 760px)').matches) {
      setOpen(false);
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
