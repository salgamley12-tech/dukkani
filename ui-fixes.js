// Single owner for mobile menu interactions. The original app.js also registered
// a click handler, so stop that older handler to prevent open-then-close toggling.
(() => {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('mobile-menu');
  const scrim = document.getElementById('mobile-scrim');
  const modalBody = document.getElementById('modal-body');
  if (!sidebar || !menuButton || !scrim) return;

  function closeSidebar() {
    sidebar.classList.remove('sidebar-open');
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'فتح القائمة');
    scrim.hidden = true;
  }

  function toggleSidebar(event) {
    // Prevent the legacy app.js listener from toggling the same class a second time.
    event.preventDefault();
    event.stopImmediatePropagation();
    const open = !sidebar.classList.contains('sidebar-open');
    sidebar.classList.toggle('sidebar-open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    scrim.hidden = !open;
  }

  // Capture before the legacy bubble-phase click listener in app.js.
  menuButton.addEventListener('click', toggleSidebar, true);
  scrim.addEventListener('click', closeSidebar);

  // Close the drawer when a view is selected anywhere in the app.
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton && window.matchMedia('(max-width: 760px)').matches) closeSidebar();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeSidebar();
  });

  // Actions in the customer ledger modal are outside the main app-content element.
  modalBody?.addEventListener('click', event => {
    const debtButton = event.target.closest('[data-action="customer-debt"]');
    if (!debtButton) return;
    const customerId = debtButton.dataset.id;
    if (typeof window.closeModal === 'function' && typeof window.openMovementForm === 'function') {
      window.closeModal();
      window.openMovementForm(customerId);
    }
  });
})();
