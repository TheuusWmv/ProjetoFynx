import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../FynxApi/src/infrastructure/http/app.js';

describe('Auth Endpoints (Integration)', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should not register a user with an already registered email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Email já cadastrado');
  });

  it('should not register a user with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Incomplete User',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Nome, email e senha são obrigatórios');
  });

  it('should login an existing user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas');
  });
});
