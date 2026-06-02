import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../FynxApi/src/infrastructure/http/app.js';

describe('Goals and Budgets Endpoints (Integration)', () => {
  const JWT_SECRET = 'test_secret';
  const token = jwt.sign({ id: 1, email: 'demo@fynx.com' }, JWT_SECRET);

  let createdGoalId: string | number;
  let createdBudgetId: string | number;

  // --- Spending Goals ---
  it('should create a new spending goal successfully', async () => {
    const payload = {
      title: 'Viagem Europa',
      category: 'Lazer',
      target_amount: 10000.0,
      period: 'yearly',
      goal_type: 'saving',
      start_date: '2026-06-02',
      end_date: '2027-06-02',
    };

    const res = await request(app)
      .post('/api/v1/goals/spending-goals')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(payload.title);
    expect(res.body.targetAmount).toBe(payload.target_amount);

    createdGoalId = res.body.id;
  });

  it('should list spending goals', async () => {
    const res = await request(app)
      .get('/api/v1/goals/spending-goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should get a single spending goal by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/goals/spending-goals/${createdGoalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdGoalId);
  });

  it('should update progress on a spending goal', async () => {
    const res = await request(app)
      .patch(`/api/v1/goals/spending-goals/${createdGoalId}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.currentAmount).toBe(500);
  });

  it('should delete a spending goal', async () => {
    const res = await request(app)
      .delete(`/api/v1/goals/spending-goals/${createdGoalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const verifyRes = await request(app)
      .get(`/api/v1/goals/spending-goals/${createdGoalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.status).toBe(404);
  });

  // --- Budgets ---
  it('should create a new budget successfully', async () => {
    const payload = {
      name: 'Supermercado Alimentação',
      category: 'Food',
      allocated_amount: 800.0,
      period: 'monthly',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
    };

    const res = await request(app)
      .post('/api/v1/goals/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(payload.name);

    createdBudgetId = res.body.id;
  });

  it('should list budgets', async () => {
    const res = await request(app)
      .get('/api/v1/goals/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should delete a budget', async () => {
    const res = await request(app)
      .delete(`/api/v1/goals/budgets/${createdBudgetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const verifyRes = await request(app)
      .get(`/api/v1/goals/budgets/${createdBudgetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.status).toBe(404);
  });
});
