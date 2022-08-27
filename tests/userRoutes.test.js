const request = require('supertest');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../app');

describe('POST /user', () => {
  describe('Given valid username and password', () => {
    test('Saves new user to database', async () => {
      await request(app).post('/api/v1/user').send(
        {
          username: 'tester0',
          password: 'password'
        }
      );
      const newUser = await User.find({ username: 'tester0' });
      expect(newUser).toBeTruthy();
    });

    test('Hashes password before saving to the database', async () => {
      await request(app).post('/api/v1/user').send(
        { username: 'tester00', password: 'password' }
      );
      const newUser = await User.findOne({ username: 'tester00' });
      const valid = await bcrypt.compare('password', newUser.password);
      expect(valid && newUser.password !== 'password').toBeTruthy();
    })

    test('Responds with a 201 code', async () => {
      const response = await request(app).post('/api/v1/user').send(
        {
          username: 'tester1',
          password: 'password'
        }
      );
      expect(response.statusCode).toBe(201);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app).post('/api/v1/user').send(
        {
          username: 'tester2',
          password: 'password'
        }
      );
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('Responds with json object containing JWT', async () => {
      const response = await request(app).post('/api/v1/user').send(
        {
          username: 'tester3',
          password: 'password'
        }
      );
      expect(response.body.token).toBeDefined();
    });

    test('JWT is valid', async () => {
      const response = await request(app).post('/api/v1/user').send(
        {
          username: 'tester03',
          password: 'password'
        }
      );
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      console.log(decoded);
      expect(decoded.username === 'tester03').toBeTruthy();
    });
  });

  describe('Missing username and/or password', () => {
    test('Responds with 400 status code', async () => {
      const data = [
        { username: 'tester4' },
        { password: 'password' },
        {}
      ];
      for (const body of data) {
        const response = await request(app).post('/api/v1/user').send(body);
        expect(response.statusCode).toBe(400);
      }
    });
    test('Responds with json in content-type header', async () => {
      const data = [
        { username: 'tester4' },
        { password: 'password' },
        {}
      ];
      for (const body of data) {
        const response = await request(app).post('/api/v1/user').send(body);
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      }
    });
    test('Responds with correct error message in json object', async () => {
      const data = [
        { username: 'tester4' },
        { password: 'password' },
        {}
      ];
      let response = await request(app).post('/api/v1/user').send(data[0]);
      expect(response.body['errors']).toEqual([
        {
          "value": "",
          "msg": "Password must be length 8 or greater",
          "param": "password",
          "location": "body"
        }
      ]);
      response = await request(app).post('/api/v1/user').send(data[1]);
      expect(response.body['errors']).toEqual([
        {
          "value": "",
          "msg": "Username is required",
          "param": "username",
          "location": "body"
        }
      ]);
      response = await request(app).post('/api/v1/user').send(data[2]);
      expect(response.body['errors']).toEqual([
        {
          "value": "",
          "msg": "Username is required",
          "param": "username",
          "location": "body"
        },
        {
          "value": "",
          "msg": "Password must be length 8 or greater",
          "param": "password",
          "location": "body"
        }
      ]);
    });    
  });

  describe('Invalid username or password', () => {
    test('Responds with 400 status code', async () => {
      await request(app).post('/api/v1/user').send(
        { username: 'tester6', password: 'password' }
      );
      const data = [
        { username: 'tester6', password: 'password' },
        { username: 'tester6dos', password: 'short' },
        { username: 'tester6', password: 'short' }
      ];
      for (const body of data) {
        const response = await request(app).post('/api/v1/user').send(body);
        expect(response.statusCode).toBe(400);
      }
    });

    test('Responds with json in content-type header', async () => {
      const data = [
        { username: 'tester5', password: 'password' },
        { username: 'tester5dos', password: 'short' },
        { username: 'tester5', password: 'short' }
      ];
      for (const body of data) {
        const response = await request(app).post('/api/v1/user').send(body);
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      }
    });

    test('Responds with correct error message', async () => {
      await request(app).post('/api/v1/user').send(
        { username: 'tester5', password: 'password' }
      );
      const data = [
        { username: 'tester5', password: 'password' },
        { username: 'tester5dos', password: 'short' },
        { username: 'tester5', password: 'short' }
      ];
      
      let response = await request(app).post('/api/v1/user').send(data[0]);
      expect(response.body['errors']).toEqual([
        {
          "value": "tester5",
          "msg": "Username is already in use",
          "param": "username",
          "location": "body"
        }
      ]);
      response = await request(app).post('/api/v1/user').send(data[1]);
      expect(response.body['errors']).toEqual([
        {
          "value": "short",
          "msg": "Password must be length 8 or greater",
          "param": "password",
          "location": "body"
        }
      ]);
      response = await request(app).post('/api/v1/user').send(data[2]);
      expect(response.body['errors']).toEqual([
        {
          "value": "tester5",
          "msg": "Username is already in use",
          "param": "username",
          "location": "body"
        },
        {
          "value": "short",
          "msg": "Password must be length 8 or greater",
          "param": "password",
          "location": "body"
        }
      ]);
    })
  })
});
