import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../FynxApi/src/infrastructure/http/app.js';

describe('Transactions Endpoints (Integration)', () => {
  const JWT_SECRET = 'test_secret';
  
  // Sign a test token for the default seeded user (id: 1)
  const token = jwt.sign({ id: 1, email: 'demo@fynx.com' }, JWT_SECRET);

  let createdTransactionId: string | number;

  it('should get transaction categories successfully', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new transaction successfully', async () => {
    const payload = {
      amount: 150.0,
      description: 'Supermercado Mensal',
      category: 'Food',
      type: 'expense',
      date: '2026-06-02',
      paymentMethod: 'pix',
    };

    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.amount).toBe(payload.amount);
    expect(res.body.description).toBe(payload.description);
    
    createdTransactionId = res.body.id;
  });

  it('should list transactions and filter them correctly', async () => {
    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('transactions');
    expect(res.body).toHaveProperty('totalCount');
    expect(Array.isArray(res.body.transactions)).toBe(true);
    expect(res.body.totalCount).toBeGreaterThanOrEqual(1);
  });

  it('should get a single transaction by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdTransactionId);
    expect(res.body.description).toBe('Supermercado Mensal');
  });

  it('should return 404 for a transaction that does not exist', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should get transaction summary successfully', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('netAmount');
    expect(res.body).toHaveProperty('totalIncome');
    expect(res.body).toHaveProperty('totalExpenses');
  });

  it('should get transaction stats successfully', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dailyAverage');
    expect(res.body).toHaveProperty('mostExpensiveTransaction');
  });

  it('should delete an existing transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    // Verify it's actually deleted
    const verifyRes = await request(app)
      .get(`/api/v1/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.status).toBe(404);
  });
});
