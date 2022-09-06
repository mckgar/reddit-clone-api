const request = require('supertest');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../app');

beforeAll(async () => {
  try {
    const hashedPassword = await bcrypt.hash('password', 10);
    await new User(
      {
        username: 'tester1',
        password: hashedPassword
      }
    ).save();
  } catch (err) {
    console.log(err);
  }
});

describe('POST /login', () => {
  describe('Given valid username', () => {
    describe('Given valid password', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .post('/api/v1/login')
          .send({ username: 'tester1', password: 'password' });
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .post('/api/v1/login')
          .send({ username: 'tester1', password: 'password' });
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      });

      test('Responds with json object containing JWT', async () => {
        const response = await request(app)
          .post('/api/v1/login')
          .send({ username: 'tester1', password: 'password' });
        expect(response.body.token).toBeDefined();
      });

      test('JWT is valid', async () => {
        const response = await request(app)
          .post('/api/v1/login')
          .send({ username: 'tester1', password: 'password' });
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(decoded.username).toEqual('tester1');
      });
    });

    describe('Given invalid password', () => {
      test('Responds with 400 status code', async () => {
        const data = [
          { username: 'tester1' },
          { username: 'tester1', password: '' },
          { username: 'tester1', password: 'wrong' },
          { username: 'tester1', password: null }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/login')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        const data = [
          { username: 'tester1' },
          { username: 'tester1', password: '' },
          { username: 'tester1', password: 'wrong' },
          { username: 'tester1', password: null }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/login')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message', async () => {
        const data = [
          { username: 'tester1' },
          { username: 'tester1', password: '' },
          { username: 'tester1', password: 'wrong' },
          { username: 'tester1', password: null }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/login')
            .send(body);
          expect(response.body['errors']).toBeTruthy();
        }
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 400 status code', async () => {
      const data = [
        { password: 'password' },
        { username: '', password: 'password' },
        { username: 'doesnotexist', password: 'password' },
        { username: null, password: 'password' },
        {}
      ];
      for (const body of data) {
        const response = await request(app)
          .post('/api/v1/login')
          .send(body);
        expect(response.statusCode).toBe(400);
      }
    });

    test('Responds with json in content-type header', async () => {
      const data = [
        { password: 'password' },
        { username: '', password: 'password' },
        { username: 'doesnotexist', password: 'password' },
        { username: null, password: 'password' },
        {}
      ];
      for (const body of data) {
        const response = await request(app)
          .post('/api/v1/login')
          .send(body);
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      }
    });

    test('Responds with error message', async () => {
      const data = [
        { password: 'password' },
        { username: '', password: 'password' },
        { username: 'doesnotexist', password: 'password' },
        { username: null, password: 'password' },
        {}
      ];
      for (const body of data) {
        const response = await request(app)
          .post('/api/v1/login')
          .send(body);
        expect(response.body['errors']).toBeTruthy();
      }
    });
  });
});

afterAll(async () => {
  await require('../mongoConfigTesting').closeServer();
});