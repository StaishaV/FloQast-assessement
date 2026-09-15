const { randomUUID } = require('crypto');

let users = [];
let transactions = [];
const idempotencyKeys = new Map();

function reset() {
  users = [];
  transactions = [];
  idempotencyKeys.clear();
}

function addUser({ name, email, accountType }) {
  const user = {
    id: randomUUID(),
    name,
    email,
    accountType,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function findUserById(id) {
  return users.find((u) => u.id === id);
}

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function addTransaction({ userId, recipientId, amount, type }) {
  const transaction = {
    id: randomUUID(),
    userId,
    recipientId,
    amount,
    type,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  transactions.push(transaction);
  return transaction;
}

function getTransactionsForUser(userId) {
  return transactions
    .filter((t) => t.userId === userId || t.recipientId === userId)
    .map((t) => ({ ...t, direction: t.userId === userId ? 'sent' : 'received' }));
}

function rememberIdempotentTransaction(key, transaction) {
  idempotencyKeys.set(key, transaction);
}

function getIdempotentTransaction(key) {
  return idempotencyKeys.get(key);
}

module.exports = {
  reset,
  addUser,
  findUserById,
  findUserByEmail,
  addTransaction,
  getTransactionsForUser,
  rememberIdempotentTransaction,
  getIdempotentTransaction,
};
