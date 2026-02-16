const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';

const app = require('../server');
const { sequelize } = require('../config/database');
const { User, Family, FamilyMembership, FamilyMember, Event, Memory, Activity } = require('../models');

describe('API sanity checks', () => {
  let token;
  let familyId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('register and login user', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(registerResponse.body.success).toBe(true);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    token = loginResponse.body.token;
    expect(token).toBeTruthy();
  });

  test('create family and membership', async () => {
    const response = await request(app)
      .post('/api/families')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sanity Family',
        description: 'Test family'
      })
      .expect(201);

    familyId = response.body.family.id;
    expect(familyId).toBeTruthy();

    const membership = await FamilyMembership.findOne({ where: { familyId } });
    expect(membership).toBeTruthy();
    expect(membership.role).toBe('admin');
  });

  test('create member, event, memory and see activity', async () => {
    const memberResponse = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId,
        firstName: 'Jamie',
        lastName: 'Doe'
      })
      .expect(201);

    expect(memberResponse.body.member.id).toBeTruthy();

    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId,
        title: 'Family Dinner',
        type: 'celebration',
        date: new Date().toISOString()
      })
      .expect(201);

    expect(eventResponse.body.event.id).toBeTruthy();

    const memoryResponse = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${token}`)
      .field('familyId', familyId)
      .field('title', 'First Memory')
      .field('type', 'photo')
      .expect(201);

    expect(memoryResponse.body.memory.id).toBeTruthy();

    const activityResponse = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(activityResponse.body.activities.length).toBeGreaterThan(0);
  });
});
