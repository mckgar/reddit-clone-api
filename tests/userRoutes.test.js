const request = require('supertest');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../app');

let adminCred;
let badCred;
let deleteCred0;
let deleteCred3;
let updateCred;

beforeAll(async () => {
  try {
    await new User(
      {
        username: 'admin_god',
        password: 'dog_nimda',
        admin: true
      }
    ).save();
    adminCred = jwt.sign({ username: 'admin_god' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'bad_cred',
        password: 'bad_password'
      }
    ).save();
    badCred = jwt.sign({ username: 'bad_cred' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'tonotdelete0',
        password: 'whocares'
      }
    ).save();

    await new User(
      {
        username: 'tobedeleted0',
        password: 'whocares'
      }
    ).save();
    deleteCred0 = jwt.sign({ username: 'tobedeleted0' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'tobedeleted1',
        password: 'whocares'
      }
    ).save();

    await new User(
      {
        username: 'tobedeleted2',
        password: 'whocares'
      }
    ).save();

    await new User(
      {
        username: 'tobedeleted3',
        password: 'whocares'
      }
    ).save();
    deleteCred3 = jwt.sign({ username: 'tobedeleted3' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'you_updater',
        password: 'whocares'
      }
    ).save();
    updateCred = jwt.sign({ username: 'you_updater' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'you_updater2',
        password: 'whocares'
      }
    ).save();
  } catch (err) {
    console.log(err);
  }
});

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

describe('GET /user/:username', () => {
  describe('Given valid username', () => {
    test('Responds with 200 status code', async () => {
      const response = await request(app).get('/api/v1/user/admin_god');
      expect(response.statusCode).toBe(200);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app).get('/api/v1/user/admin_god');
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('Responds with user information', async () => {
      const response = await request(app).get('/api/v1/user/admin_god');
      expect(response.body.username).toBeDefined();
      expect(response.body.post_score).toBeDefined();
      expect(response.body.comment_score).toBeDefined();
      expect(response.body.admin).toBeDefined();
      expect(response.body.moderator).toBeDefined();
      expect(response.body.posts).toBeDefined();
      expect(response.body.comments).toBeDefined();
    });

    test('User information is valid', async () => {
      const response = await request(app).get('/api/v1/user/admin_god');
      const user = await User.findOne({ username: 'admin_god' });
      expect(response.body.username).toEqual(user.username);
      expect(response.body.post_score).toEqual(user.post_score);
      expect(response.body.comment_score).toEqual(user.comment_score);
      expect(response.body.admin).toEqual(user.admin);
      expect(response.body.moderator).toEqual(user.moderator);
      expect(response.body.posts).toEqual(user.posts);
      expect(response.body.comments).toEqual(user.comments);
    });

  });

  describe('Given invalid username', () => {
    test('Responds with 404 status', async () => {
      const response = await request(app).get('/api/v1/user/invalid');
      expect(response.statusCode).toBe(404);
    });

    test('Responds with correct error message', async () => {
      const response = await request(app).get('/api/v1/user/invalid');
      expect(response.body.message).toEqual('Not Found');
    });
  })
});

describe('DELETE /user/:username', () => {
  describe('Given invalid credentials', () => {
    test('Responds with 401 status code when not supplied credentials', async () => {
      const response = await request(app).delete('/api/v1/user/tonotdelete0');
      expect(response.statusCode).toBe(401);
    });

    test('Responds with 403 status code when supplied invalid credentials', async () => {
      const response = await request(app).delete('/api/v1/user/tonotdelete0').set('Authorization', `Bearer ${badCred}`);
      expect(response.statusCode).toBe(403);
    });

    test('User is not removed from database', async () => {
      await request(app).delete('/api/v1/user/tonotdelete0');
      const user = await User.findOne({ username: 'tonotdelete0' });
      expect(user).toBeTruthy();
    })
  });

  describe('Given valid credentials and valid user', () => {
    test('Responds with 200 status code when the user requests to be deleted', async () => {
      const response = await request(app).delete('/api/v1/user/tobedeleted0').set('Authorization', `Bearer ${deleteCred0}`);
      expect(response.statusCode).toBe(200);
    });

    test('Responds with 200 status code when an admin requests to delete a user', async () => {
      const response = await request(app).delete('/api/v1/user/tobedeleted1').set('Authorization', `Bearer ${adminCred}`);
      expect(response.statusCode).toBe(200);
    });

    test('User is removed from database', async () => {
      await request(app).delete('/api/v1/user/tobedeleted2').set('Authorization', `Bearer ${adminCred}`);
      await request(app).delete('/api/v1/user/tobedeleted3').set('Authorization', `Bearer ${deleteCred3}`);
      const delete2 = await User.findOne({ username: 'tobedeleted2' });
      const delete3 = await User.findOne({ username: 'tobedeleted3' });
      expect(delete2).toBeFalsy();
      expect(delete3).toBeFalsy();
    });

  });

  describe('Given valid credentials but invalid user', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app).delete('/api/v1/user/doesnotexist').set('Authorization', `Bearer ${adminCred}`);
      expect(response.statusCode).toBe(404);
    });

    test('Responds with correct error message', async () => {
      const response = await request(app).delete('/api/v1/user/doesnotexist').set('Authorization', `Bearer ${adminCred}`);
      const response2 = await request(app).delete('/api/v1/user/doesnotexist2').set('Authorization', `Bearer ${adminCred}`);
      expect(response.body.message).toEqual('User doesnotexist does not exist');
      expect(response2.body.message).toEqual('User doesnotexist2 does not exist');
    });
  });
});

describe('PUT /user/:username', () => {
  describe('Given valid user and said users credentials', () => {
    describe('Updating user info', () => {
      test('Responds with 200 status code', async () => {
        try {
          const response = await request(app)
            .put('/api/v1/user/you_updater')
            .set('Authorization', `Bearer ${updateCred}`);
          expect(response.statusCode).toBe(200);
        } catch (err) {
          console.log(err);
        }
      });

      test('Email is successfully updated', async () => {
        const data = ['newEmail@example.com', 'another@fake.net'];
        for (const newEmail of data) {
          await request(app)
            .put('/api/v1/user/you_updater')
            .send({ email: newEmail })
            .set('Authorization', `Bearer ${updateCred}`);
          const user = await User.findOne({ username: 'you_updater' });
          expect(user.email).toEqual(newEmail);
        }
      });

      test('Password is successfully updated', async () => {
        const data = ['anotherbadpassword', 'evenworseone'];
        for (const newPassword of data) {
          await request(app)
            .put('/api/v1/user/you_updater')
            .send({ password: newPassword })
            .set('Authorization', `Bearer ${updateCred}`);
          const user = await User.findOne({ username: 'you_updater' });
          const passwordCompare = await bcrypt.compare(newPassword, user.password);
          expect(passwordCompare).toBeTruthy();
        }
      });

    });

    describe('Adding permissions', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .send({ admin: true })
          .set('Authorization', `Bearer ${updateCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given invalid info', () => {
      test('Responds with 400 status code', async () => {
        const data = [
          { email: 'not an email' },
          { email: '' },
          { email: 2 },
          { email: null },
          { email: true },
          { password: 'short' },
          { password: '' },
          { password: null },
          { password: true }
        ];
        for (const update of data) {
          const response = await request(app)
            .put('/api/v1/user/you_updater')
            .send(update)
            .set('Authorization', `Bearer ${updateCred}`);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with correct error message', async () => {
        const data = [
          { email: 'not an email' },
          { password: 'short' }
        ];
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .send(data[0])
          .set('Authorization', `Bearer ${updateCred}`);
        expect(response.body.errors).toEqual([
          {
            "value": "not an email",
            "msg": "Must submit a valid email",
            "param": "email",
            "location": "body"
          }
        ]);
        const response2 = await request(app)
          .put('/api/v1/user/you_updater')
          .send(data[1])
          .set('Authorization', `Bearer ${updateCred}`);
        expect(response2.body['errors']).toEqual([
          {
            "value": "short",
            "msg": "Password must be length 8 or greater",
            "param": "password",
            "location": "body"
          }
        ]);
      });
    });
  });

  describe('Given valid user and invalid credentials', () => {
    test('Responds with 401 status code if not given credntials', async () => {
      const response = await request(app)
        .put('/api/v1/user/you_updater');
      expect(response.statusCode).toBe(401);
    });

    test('Responds with 403 status code if not given admin or targeted users credentials', async () => {
      const response = await request(app)
        .put('/api/v1/user/you_updater')
        .set('Authorization', `Bearer ${badCred}`);
      expect(response.statusCode).toBe(403);
    })
  });

  describe('Given valid user and admin credentials', () => {
    describe('Updating permissions with valid info', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .send({ admin: false })
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.statusCode).toBe(200);
      });

      test('Updated permission is saved', async () => {
        await request(app)
          .put('/api/v1/user/you_updater2')
          .send({ admin: true })
          .set('Authorization', `Bearer ${adminCred}`);
        const user = await User.findOne({ username: 'you_updater2' });
        expect(user.admin).toBeTruthy();
      });
    });

    describe('Updating permissions with invalid info', () => {
      test('Responds with 400 status code', async () => {
        const data = [
          { admin: '' },
          { admin: 'queso' },
          { admin: 23 },
          { admin: null }
        ];
        for (const update of data) {
          const response = await request(app)
            .put('/api/v1/user/you_updater')
            .send(update)
            .set('Authorization', `Bearer ${adminCred}`);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with correct error message', async () => {
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .send({ admin: 'tough' })
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.body['errors']).toEqual([
          {
            "value": "tough",
            "msg": "Invalid value",
            "param": "admin",
            "location": "body"
          }
        ]);
      });
    });
  });

  describe('Given invalid user', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
            .put('/api/v1/user/doesnotexist')
            .set('Authorization', `Bearer ${adminCred}`);
          expect(response.statusCode).toBe(404);
    });
  });
});
