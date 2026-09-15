const API_BASE = '/api';
const STORAGE_KEY = 'floqast_mock_current_user';

const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');
const registerFormContainer = document.getElementById('register-form-container');
const currentUserContainer = document.getElementById('current-user-container');
const currentUserName = document.getElementById('current-user-name');
const currentUserId = document.getElementById('current-user-id');
const logoutButton = document.getElementById('logout-button');

const transactionSection = document.getElementById('transaction-section');
const transactionForm = document.getElementById('transaction-form');
const transactionError = document.getElementById('transaction-error');
const transactionSuccess = document.getElementById('transaction-success');
const transactionSubmitButton = transactionForm.querySelector('[data-testid="transaction-submit"]');
const transactionList = document.getElementById('transaction-list');
const refreshButton = document.getElementById('refresh-transactions');

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
  el.textContent = '';
}

function renderAuthState() {
  const user = getCurrentUser();
  if (user) {
    registerFormContainer.hidden = true;
    currentUserContainer.hidden = false;
    currentUserName.textContent = user.name;
    currentUserId.textContent = user.id;
    transactionSection.hidden = false;
    loadTransactions();
  } else {
    registerFormContainer.hidden = false;
    currentUserContainer.hidden = true;
    transactionSection.hidden = true;
  }
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideError(registerError);

  const formData = new FormData(registerForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    accountType: formData.get('accountType'),
  };

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      showError(registerError, data.error || 'Failed to create account');
      return;
    }

    setCurrentUser(data);
    registerForm.reset();
    renderAuthState();
  } catch (err) {
    showError(registerError, 'Network error — could not reach the server');
  }
});

logoutButton.addEventListener('click', () => {
  clearCurrentUser();
  renderAuthState();
});

transactionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideError(transactionError);
  transactionSuccess.hidden = true;

  const user = getCurrentUser();
  if (!user) {
    showError(transactionError, 'You must create an account first');
    return;
  }

  const formData = new FormData(transactionForm);
  const payload = {
    userId: user.id,
    recipientId: formData.get('recipientId'),
    amount: Number(formData.get('amount')),
    type: formData.get('type'),
  };

  transactionSubmitButton.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.id}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      showError(transactionError, data.error || 'Failed to create transaction');
      return;
    }

    transactionSuccess.textContent = `Transaction ${data.id} completed`;
    transactionSuccess.hidden = false;
    transactionForm.reset();
    await loadTransactions();
  } catch (err) {
    showError(transactionError, 'Network error — could not reach the server');
  } finally {
    transactionSubmitButton.disabled = false;
  }
});

refreshButton.addEventListener('click', loadTransactions);

async function loadTransactions() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const response = await fetch(`${API_BASE}/transactions/${user.id}`, {
      headers: { Authorization: `Bearer ${user.id}` },
    });
    const data = await response.json();
    if (!response.ok) {
      showError(transactionError, data.error || 'Failed to load transactions');
      return;
    }
    renderTransactions(data);
  } catch (err) {
    showError(transactionError, 'Network error — could not reach the server');
  }
}

function renderTransactions(transactions) {
  transactionList.innerHTML = '';
  if (transactions.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No transactions yet';
    empty.setAttribute('data-testid', 'transaction-empty');
    transactionList.appendChild(empty);
    return;
  }

  for (const t of transactions) {
    const item = document.createElement('li');
    item.setAttribute('data-testid', 'transaction-item');
    item.textContent = `${t.direction === 'sent' ? '→' : '←'} ${t.type} $${t.amount.toFixed(2)} (${t.direction})`;
    transactionList.appendChild(item);
  }
}

renderAuthState();
