const path = require('path');
const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 4000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_TYPES = ['basic', 'premium'];
const TRANSACTION_TYPES = ['transfer', 'payment', 'deposit', 'withdrawal'];

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[mock-api] ${req.method} ${req.path}`);
  next();
});

function authenticate(req, res, next) {
  const header = req.header('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  req.authUserId = token;
  next();
}

// --- Users ---

app.post('/api/users', (req, res) => {
  const { name, email, accountType } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'email must be a valid email address' });
  }
  if (!ACCOUNT_TYPES.includes(accountType)) {
    return res.status(400).json({ error: `accountType must be one of: ${ACCOUNT_TYPES.join(', ')}` });
  }
  if (store.findUserByEmail(email)) {
    return res.status(409).json({ error: 'a user with this email already exists' });
  }

  const user = store.addUser({ name: name.trim(), email, accountType });
  res.status(201).json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = store.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  res.status(200).json(user);
});

// --- Transactions ---

app.post('/api/transactions', authenticate, (req, res) => {
  const { userId, recipientId, amount, type } = req.body || {};

  if (req.authUserId !== userId) {
    return res.status(403).json({ error: 'not authorized to create a transaction for this user' });
  }
  if (!userId || !store.findUserById(userId)) {
    return res.status(400).json({ error: 'userId does not reference an existing user' });
  }
  if (!recipientId || !store.findUserById(recipientId)) {
    return res.status(400).json({ error: 'recipientId does not reference an existing user' });
  }
  if (recipientId === userId) {
    return res.status(400).json({ error: 'recipientId cannot be the same as userId' });
  }
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TRANSACTION_TYPES.join(', ')}` });
  }

  const idempotencyKey = req.header('Idempotency-Key');
  if (idempotencyKey) {
    const existing = store.getIdempotentTransaction(idempotencyKey);
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  const transaction = store.addTransaction({ userId, recipientId, amount, type });
  if (idempotencyKey) {
    store.rememberIdempotentTransaction(idempotencyKey, transaction);
  }

  res.status(201).json(transaction);
});

app.get('/api/transactions/:userId', authenticate, (req, res) => {
  if (req.authUserId !== req.params.userId) {
    return res.status(403).json({ error: 'not authorized to view these transactions' });
  }
  if (!store.findUserById(req.params.userId)) {
    return res.status(404).json({ error: 'user not found' });
  }
  res.status(200).json(store.getTransactionsForUser(req.params.userId));
});

// --- Test utilities ---

app.post('/test/reset', (req, res) => {
  store.reset();
  res.status(204).send();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Mock frontend (served from the same origin as the API) ---

app.use(express.static(path.join(__dirname, '..', 'mock-frontend')));

// --- Error handling (e.g. malformed JSON body) ---

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Mock API + frontend listening on http://localhost:${PORT}`);
});

module.exports = app;
