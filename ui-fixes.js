// Small interaction fixes layered onto the existing application.
const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('mobile-menu');
const scrim = document.getElementById('mobile-scrim');

function closeSidebar() {
  sidebar?.classList.remove('sidebar-open');
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (scrim) scrim.hidden = true;
}
function toggleSidebar() {
  const open = !sidebar?.classList.contains('sidebar-open');
  sidebar?.classList.toggle('sidebar-open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton?.setAttribute('aria-expanded', String(open));
  if (scrim) scrim.hidden = !open;
}

menuButton?.addEventListener('click', toggleSidebar);
scrim?.addEventListener('click', closeSidebar);
document.querySelectorAll('.nav-link[data-view]').forEach(button => button.addEventListener('click', closeSidebar));

// The customer-account modal is outside #app-content, so its actions need their own delegated handler.
document.getElementById('modal-body')?.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action="customer-debt"]');
  if (!actionButton) return;
  const customerId = actionButton.dataset.id;
  if (typeof closeModal === 'function' && typeof openMovementForm === 'function') {
    closeModal();
    openMovementForm(customerId);
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSidebar();
});
