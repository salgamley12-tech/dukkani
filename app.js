const STORAGE_KEY = 'dukkani-debts-v1';
const defaultState = { customers: [], transactions: [], currency: 'ر.س' };
let state = loadState();
let activeFilter = 'all';
let selectedCustomerId = null;
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions)) return structuredClone(defaultState);
    return { ...defaultState, ...parsed };
  } catch { return structuredClone(defaultState); }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showToast('تعذّر حفظ البيانات. تأكد من توفر مساحة في المتصفح.', 'error');
    return false;
  }
}
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function money(value) {
  const amount = new Intl.NumberFormat('ar', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);
  return `${amount} <span class="currency">${escapeHTML(state.currency)}</span>`;
}
function dateText(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
function timestampText(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
function getBalance(customerId) {
  return state.transactions.reduce((balance, tx) => tx.customerId !== customerId ? balance : balance + (tx.type === 'debt' ? Number(tx.amount) : -Number(tx.amount)), 0);
}
function customerTransactions(customerId) {
  return state.transactions.filter(tx => tx.customerId === customerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function lastTransaction(customerId) { return customerTransactions(customerId)[0]; }
function isOverdue(customer) {
  const balance = getBalance(customer.id);
  return balance > 0 && customer.dueDate && customer.dueDate < todayISO();
}
function showToast(message, type = 'success') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'toast-error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
function initials(name) { return (name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('') || 'ز').toUpperCase(); }

function render() {
  const activeCustomers = state.customers.filter(customer => getBalance(customer.id) > 0);
  const overdueCustomers = activeCustomers.filter(isOverdue);
  const monthPrefix = todayISO().slice(0, 7);
  const monthPayments = state.transactions.filter(tx => tx.type === 'payment' && tx.createdAt?.slice(0, 7) === monthPrefix).reduce((sum, tx) => sum + Number(tx.amount), 0);
  $('#total-debt').innerHTML = money(activeCustomers.reduce((sum, customer) => sum + getBalance(customer.id), 0));
  $('#overdue-total').innerHTML = money(overdueCustomers.reduce((sum, customer) => sum + getBalance(customer.id), 0));
  $('#overdue-count').textContent = overdueCustomers.length ? `${new Intl.NumberFormat('ar').format(overdueCustomers.length)} زبون بحاجة إلى متابعة` : 'لا توجد ديون متأخرة';
  $('#owing-count').textContent = new Intl.NumberFormat('ar').format(activeCustomers.length);
  $('#month-payments').innerHTML = money(monthPayments);
  $('#all-count').textContent = new Intl.NumberFormat('ar').format(state.customers.length);
  $('#active-count').textContent = new Intl.NumberFormat('ar').format(activeCustomers.length);
  $('#late-count').textContent = new Intl.NumberFormat('ar').format(overdueCustomers.length);
  $$('.currency-label').forEach(el => el.textContent = state.currency);
  renderCustomers();
}
function renderCustomers() {
  const search = $('#search-input').value.trim().toLocaleLowerCase('ar');
  let customers = state.customers.filter(customer => {
    const matchesSearch = `${customer.name} ${customer.phone || ''}`.toLocaleLowerCase('ar').includes(search);
    const balance = getBalance(customer.id);
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'owing' && balance > 0) || (activeFilter === 'overdue' && isOverdue(customer));
    return matchesSearch && matchesFilter;
  });
  const sortBy = $('#sort-select').value;
  customers.sort((a, b) => {
    if (sortBy === 'highest') return getBalance(b.id) - getBalance(a.id);
    if (sortBy === 'recent') return new Date(lastTransaction(b.id)?.createdAt || b.createdAt) - new Date(lastTransaction(a.id)?.createdAt || a.createdAt);
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
    const aDue = a.dueDate || '9999-12-31'; const bDue = b.dueDate || '9999-12-31';
    return aDue.localeCompare(bDue) || new Date(lastTransaction(a.id)?.createdAt || a.createdAt) - new Date(lastTransaction(b.id)?.createdAt || b.createdAt);
  });
  $('#customer-rows').innerHTML = customers.map(customer => {
    const balance = getBalance(customer.id);
    const last = lastTransaction(customer.id);
    const overdue = isOverdue(customer);
    const dueText = balance <= 0 ? '<span class="status status-clear">لا يوجد رصيد</span>' : customer.dueDate ? `<span class="${overdue ? 'due-overdue' : 'due-date'}">${overdue ? '<span class="status status-late">متأخر</span> ' : ''}${dateText(customer.dueDate)}</span>` : '<span class="muted">لم يحدد</span>';
    return `<tr>
      <td><div class="customer-cell"><span class="avatar">${escapeHTML(initials(customer.name))}</span><span class="customer-meta"><strong>${escapeHTML(customer.name)}</strong><small>${escapeHTML(customer.phone || 'لا يوجد رقم هاتف')}</small></span></div></td>
      <td class="balance-cell ${balance > 0 ? 'has-balance' : 'clear-balance'}">${money(balance)}</td>
      <td><span class="last-movement">${last ? (last.type === 'payment' ? 'دفعة مستلمة' : 'دين مضاف') : 'لا توجد حركات'}</span><small class="table-subtext">${last ? timestampText(last.createdAt) : dateText(customer.createdAt?.slice(0, 10))}</small></td>
      <td>${dueText}</td>
      <td><div class="row-actions"><button class="text-action" data-action="detail" data-id="${escapeHTML(customer.id)}" type="button">كشف الحساب</button>${balance > 0 ? `<button class="small-pay" data-action="pay" data-id="${escapeHTML(customer.id)}" type="button">دفعة</button>` : ''}</div></td>
    </tr>`;
  }).join('');
  const empty = customers.length === 0;
  $('#empty-state').classList.toggle('visible', empty);
  $('#customer-rows').closest('table').classList.toggle('hidden', empty);
  if (empty) {
    const noCustomers = state.customers.length === 0;
    $('#empty-title').textContent = noCustomers ? 'لا يوجد زبائن بعد' : 'لم نعثر على نتائج';
    $('#empty-description').textContent = noCustomers ? 'أضف زبونًا لتبدأ تسجيل الديون ومتابعة الدفعات.' : 'جرّب تغيير البحث أو عامل التصفية.';
    $('#empty-add-button').hidden = !noCustomers;
  }
}
function renderCustomerOptions(selectedId = '') {
  const select = $('#movement-customer');
  select.innerHTML = '<option value="">اختر الزبون</option>' + state.customers.map(customer => `<option value="${escapeHTML(customer.id)}" ${customer.id === selectedId ? 'selected' : ''}>${escapeHTML(customer.name)} — الرصيد ${new Intl.NumberFormat('ar', { maximumFractionDigits: 2 }).format(getBalance(customer.id))} ${escapeHTML(state.currency)}</option>`).join('');
}
function openMovement(customerId = '', type = 'debt') {
  if (!state.customers.length) { showToast('أضف زبونًا أولًا قبل تسجيل حركة.', 'error'); openDialog('customer-dialog'); return; }
  $('#movement-form').reset();
  $('#movement-error').textContent = '';
  renderCustomerOptions(customerId);
  $(`input[name="type"][value="${type}"]`).checked = true;
  updateMovementFields();
  openDialog('movement-dialog');
  if (!customerId) $('#movement-customer').focus();
}
function updateMovementFields() {
  const type = $('input[name="type"]:checked').value;
  const customerId = $('#movement-customer').value;
  $('#amount-label').textContent = type === 'payment' ? 'مبلغ الدفعة' : 'مبلغ الدين';
  $('#due-date-field').hidden = type === 'payment';
  $('#save-movement-button').textContent = type === 'payment' ? 'حفظ الدفعة' : 'حفظ الدين';
  $('#balance-hint').textContent = customerId ? `الرصيد الحالي: ${new Intl.NumberFormat('ar', { maximumFractionDigits: 2 }).format(getBalance(customerId))} ${state.currency}` : '';
  $('#movement-error').textContent = '';
}
function openDetail(customerId) {
  const customer = state.customers.find(item => item.id === customerId);
  if (!customer) return;
  selectedCustomerId = customerId;
  $('#detail-name').textContent = customer.name;
  $('#detail-contact').textContent = customer.phone || 'لا يوجد رقم هاتف مسجّل';
  $('#detail-balance').innerHTML = money(getBalance(customerId));
  $('#detail-notes').textContent = customer.notes ? `ملاحظات: ${customer.notes}` : '';
  const transactions = customerTransactions(customerId);
  $('#ledger-count').textContent = `${new Intl.NumberFormat('ar').format(transactions.length)} حركة`;
  $('#ledger-list').innerHTML = transactions.length ? transactions.map(tx => `<article class="ledger-item"><span class="ledger-icon ${tx.type === 'payment' ? 'ledger-payment' : 'ledger-debt'}">${tx.type === 'payment' ? '↓' : '↑'}</span><div class="ledger-info"><strong>${tx.type === 'payment' ? 'دفعة مستلمة' : 'دين مضاف'}</strong><small>${timestampText(tx.createdAt)}${tx.note ? ` · ${escapeHTML(tx.note)}` : ''}${tx.type === 'debt' && tx.dueDate ? ` · موعد المتابعة: ${dateText(tx.dueDate)}` : ''}</small></div><strong class="ledger-amount ${tx.type === 'payment' ? 'payment-amount' : 'debt-amount'}">${tx.type === 'payment' ? '−' : '+'}${money(tx.amount)}</strong></article>`).join('') : '<div class="ledger-empty">لا توجد حركات مسجلة لهذا الزبون.</div>';
  openDialog('detail-dialog');
}
function makeId() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

$('#today-label').textContent = new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
$('#add-customer-button').addEventListener('click', () => { $('#customer-form').reset(); openDialog('customer-dialog'); });
$('#empty-add-button').addEventListener('click', () => { $('#customer-form').reset(); openDialog('customer-dialog'); });
$('#add-movement-button').addEventListener('click', () => openMovement());
$('#search-input').addEventListener('input', renderCustomers);
$('#sort-select').addEventListener('change', renderCustomers);
$$('.filter-tab').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  $$('.filter-tab').forEach(tab => tab.classList.toggle('active', tab === button));
  renderCustomers();
}));
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.close)));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
$('#customer-rows').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'detail') openDetail(button.dataset.id);
  if (button.dataset.action === 'pay') openMovement(button.dataset.id, 'payment');
});
$('#movement-customer').addEventListener('change', updateMovementFields);
$$('input[name="type"]').forEach(radio => radio.addEventListener('change', updateMovementFields));
$('#detail-payment-button').addEventListener('click', () => { closeDialog('detail-dialog'); openMovement(selectedCustomerId, 'payment'); });
$('#detail-debt-button').addEventListener('click', () => { closeDialog('detail-dialog'); openMovement(selectedCustomerId, 'debt'); });

$('#customer-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = String(data.get('name') || '').trim();
  if (!name) return;
  state.customers.push({ id: makeId(), name, phone: String(data.get('phone') || '').trim(), notes: String(data.get('notes') || '').trim(), createdAt: new Date().toISOString(), dueDate: '' });
  if (saveState()) { render(); closeDialog('customer-dialog'); showToast('تمت إضافة الزبون بنجاح.'); }
});
$('#movement-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const customerId = String(data.get('customerId') || '');
  const customer = state.customers.find(item => item.id === customerId);
  const type = String(data.get('type'));
  const amount = Number(data.get('amount'));
  const error = $('#movement-error');
  error.textContent = '';
  if (!customer) { error.textContent = 'اختر زبونًا من القائمة.'; return; }
  if (!Number.isFinite(amount) || amount <= 0) { error.textContent = 'أدخل مبلغًا أكبر من صفر.'; return; }
  if (type === 'payment' && amount > getBalance(customerId) + 0.000001) { error.textContent = 'مبلغ الدفعة أكبر من رصيد الزبون الحالي.'; return; }
  const dueDate = String(data.get('dueDate') || '');
  if (type === 'debt' && dueDate && dueDate < todayISO()) { error.textContent = 'اختر موعد متابعة اليوم أو تاريخًا لاحقًا.'; return; }
  const transaction = { id: makeId(), customerId, type, amount: Math.round(amount * 100) / 100, note: String(data.get('note') || '').trim(), dueDate: type === 'debt' ? dueDate : '', createdAt: new Date().toISOString() };
  state.transactions.push(transaction);
  if (type === 'debt' && dueDate) customer.dueDate = dueDate;
  if (type === 'payment' && amount >= getBalance(customerId) + amount - 0.000001) customer.dueDate = '';
  if (saveState()) {
    render(); closeDialog('movement-dialog');
    showToast(type === 'payment' ? 'تم تسجيل الدفعة وتحديث الرصيد.' : 'تم تسجيل الدين وتحديث موعد المتابعة.');
    if ($('#detail-dialog').open) openDetail(customerId);
  }
});
$('#settings-button').addEventListener('click', () => { $('#settings-form').elements.currency.value = state.currency; openDialog('settings-dialog'); });
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const currency = String(new FormData(event.currentTarget).get('currency') || '').trim();
  if (!currency) return;
  state.currency = currency;
  if (saveState()) { render(); closeDialog('settings-dialog'); showToast('تم تحديث رمز العملة.'); }
});
$('#export-button').addEventListener('click', () => {
  const backup = { ...state, exportedAt: new Date().toISOString(), format: 'dukkani-backup-v1' };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `dukkani-backup-${todayISO()}.json`; link.click();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل النسخة الاحتياطية. احتفظ بها في مكان آمن.');
});

render();
