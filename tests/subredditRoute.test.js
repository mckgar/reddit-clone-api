const request = require('supertest');
const jwt = require('jsonwebtoken');
const Subreddit = require('../models/subreddit');
const User = require('../models/user');

const app = require('../app');

let adminCred;
let powerCred;
let deletedCred;
let badCred;

beforeAll(async () => {
  try {
    // Create users for testing
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
        username: 'powermod',
        password: 'everywhere'
      }
    ).save();
    powerCred = jwt.sign({ username: 'powermod' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'delete_cred',
        password: 'delete_password',
        deleted: true
      }
    ).save();
    deletedCred = jwt.sign({ username: 'delete_cred' }, process.env.JWT_SECRET);

    await new User(
      {
        username: 'bad_cred',
        password: 'bad_password'
      }
    ).save();
    badCred = jwt.sign({ username: 'bad_cred' }, process.env.JWT_SECRET);

    await new User({ username: 'newMod0', password: 'whocares' }).save();
    await new User({ username: 'newMod1', password: 'whocares' }).save();
    await new User({ username: 'newMod2', password: 'whocares' }).save();
    await new User({ username: 'newMod3', password: 'whocares' }).save();

    await new User({ username: 'badMod0', password: 'whocares' }).save();
    await new User({ username: 'badMod1', password: 'whocares' }).save();
    await new User({ username: 'badMod2', password: 'whocares' }).save();
    await new User({ username: 'badMod3', password: 'whocares' }).save();

    // Create subreddits for testing
    await new Subreddit(
      {
        name: 'original',
        creator: 'powermod',
        description: 'This is the first subreddit'
      }
    ).save();
    const originalMods = ['powermod', 'badMod0', 'badMod1', 'badMod2', 'badMod3'];
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { moderators: { $each: originalMods } } }
    );
    await User.updateMany(
      { username: { $in: originalMods } },
      { $push: { moderator: 'original' } }
    );

    await new Subreddit(
      {
        name: 'banhammered',
        creator: 'powermod',
        description: 'This is the banned subreddit',
        banned: true,
        date_banned: Date.now()
      }
    ).save();

    await new Subreddit(
      {
        name: 'badSub',
        creator: 'powermod',
        description: 'This is a to be banned subreddit'
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'badSub' },
      { $push: { moderators: 'powermod' } }
    );
    await User.findOneAndUpdate(
      { username: 'powermod' },
      { $push: { moderator: 'badSub' } }
    );
  } catch (err) {
    console.log(err);
  }
});

describe('POST /r', () => {
  describe('Given valid credentials', () => {
    describe('Given valid subreddit name', () => {
      test('Responds with 201 status code', async () => {
        const response = await request(app)
          .post('/api/v1/r')
          .send({ subreddit: 'brandnew0' })
          .set('Authorization', `Bearer ${powerCred}`);
        expect(response.statusCode).toBe(201);
      });

      test('New subreddit is created', async () => {
        await request(app)
          .post('/api/v1/r')
          .send({ subreddit: 'brandnew1' })
          .set('Authorization', `Bearer ${powerCred}`);
        const created = await Subreddit.findOne({ name: 'brandnew1' });
        expect(created).toBeTruthy();
      });

      test('Creator is made a moderator of new subreddit', async () => {
        await request(app)
          .post('/api/v1/r')
          .send({ subreddit: 'brandnew2' })
          .set('Authorization', `Bearer ${powerCred}`);
        const created = await Subreddit.findOne({ name: 'brandnew2' });
        const creator = await User.findOne({ username: 'powermod' });
        expect(created.moderators.filter(a => a === 'powermod').length).toBe(1);
        expect(creator.moderator.filter(a => a === 'brandnew2').length).toBe(1);
      });
    });

    describe('Given invalid subreddit name', () => {
      test('Responds with 400 status code', async () => {
        const data = [
          { subreddit: 'original' },
          { subreddit: 'thissubredditnameiswaytoolongimaginehavingtotypethis' },
          { subreddit: '' },
          { subreddit: null },
          {}
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/r')
            .send({ subreddit: 'original' })
            .set('Authorization', `Bearer ${powerCred}`);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        const data = [
          { subreddit: 'original' },
          { subreddit: 'thissubredditnameiswaytoolongimaginehavingtotypethis' },
          { subreddit: '' },
          { subreddit: null },
          {}
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/r')
            .send({ subreddit: 'original' })
            .set('Authorization', `Bearer ${powerCred}`);
          expect(response.header['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message', async () => {
        const data = [
          { subreddit: 'original' },
          { subreddit: 'thissubredditnameiswaytoolongimaginehavingtotypethis' },
          { subreddit: '' },
          { subreddit: null },
          {}
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/r')
            .send(body)
            .set('Authorization', `Bearer ${powerCred}`);
          expect(response.body['errors']).toBeTruthy();
        }
      });
    });
  });

  describe('Given invalid credentials', () => {
    test('Responds with 403 status code', async () => {
      const response = await request(app)
        .post('/api/v1/r')
        .send({ subreddit: 'brandnew3' })
        .set('Authorization', `Bearer ${deletedCred}`);;
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Given no credentials', () => {
    test('Responds with 401 status code', async () => {
      const response = await request(app)
        .post('/api/v1/r')
        .send({ subreddit: 'brandnew3' });
      expect(response.statusCode).toBe(401);
    });
  });
});

describe('GET /r/:subreddit', () => {
  describe('Given valid subreddit', () => {
    describe('Subreddit is not banned', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with subreddit info', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        expect(response.body.info.banned).toBeDefined();
        expect(response.body.info.description).toBeDefined();
        expect(response.body.info.creator).toBeDefined();
        expect(response.body.info.date_created).toBeDefined();
        expect(response.body.info.subscribers).toBeDefined();
        expect(response.body.info.moderators).toBeDefined();
      });

      test('Subreddit info is valid', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        const subreddit = await Subreddit.findOne({ name: 'original' });
        expect(response.body.info.banned).toBeFalsy();
        expect(response.body.info.description).toEqual(subreddit.description);
        expect(response.body.info.creator).toEqual(subreddit.creator);
        expect(new Date(response.body.info.date_created).valueOf())
          .toEqual(subreddit.date_created.valueOf());
        expect(response.body.info.subscribers).toEqual(subreddit.subscribers.length);
        expect(response.body.info.moderators).toEqual(subreddit.moderators);
      });

      test('Responds with subreddit posts', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        expect(response.body.posts).toBeDefined();
      });

      test('Subreddit posts are valid', async () => {
        const response = await request(app)
          .get('/api/v1/r/original');
        const subreddit = await Subreddit.findOne({ name: 'original' }).populate('posts');
        expect(response.body.posts).toEqual(subreddit.posts);
      });
    });

    describe('Subreddit is banned', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get('/api/v1/r/banhammered');
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get('/api/v1/r/banhammered');
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with subreddit info', async () => {
        const response = await request(app)
          .get('/api/v1/r/banhammered');
        expect(response.body.info.banned).toBeDefined();
        expect(response.body.info.date_banned).toBeDefined();
      });

      test('Subreddit info is valid', async () => {
        const response = await request(app)
          .get('/api/v1/r/banhammered');
        const subreddit = await Subreddit.findOne({ name: 'banhammered' });
        expect(response.body.info.banned).toBeTruthy();
        expect(new Date(response.body.info.date_banned).valueOf())
          .toEqual(subreddit.date_banned.valueOf());
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .get('/api/v1/r/doesnotexist');
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('PUT /r/:subreddit', () => {
  describe('Given valid subreddit', () => {
    describe('Updating subreddit information', () => {
      describe('Given valid credentials', () => {
        describe('Given valid info', () => {
          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put('/api/v1/r/original')
              .send({ description: 'This is a new description' })
              .set('Authorization', `Bearer ${powerCred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Updates subreddit information', async () => {
            await request(app)
              .put('/api/v1/r/original')
              .send({ description: 'This is an even newer description' })
              .set('Authorization', `Bearer ${powerCred}`);
            const sub = await Subreddit.findOne({ name: 'original' });
            expect(sub.description).toEqual('This is an even newer description');
          });
        });
      });

      describe('Given invalid credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put('/api/v1/r/original')
            .send({ description: 'This is a bad description' })
            .set('Authorization', `Bearer ${badCred}`);
          expect(response.statusCode).toBe(403);
        });
      });

      describe('Given no credentials', () => {
        test('Responds with 401 status code', async () => {
          const response = await request(app)
            .put('/api/v1/r/original')
            .send({ description: 'This is a bad description' });
          expect(response.statusCode).toBe(401);
        });
      });
    });

    describe('Updating subreddit moderators', () => {
      describe('Given valid credentials', () => {
        describe('Given valid user', () => {
          test('Responds with 200 status code', async () => {
            const data1 = [
              { addModerator: 'newMod0' },
              { removeModerator: 'badMod0' }
            ];
            const data2 = [
              { addModerator: 'newMod1' },
              { removeModerator: 'badMod1' }
            ];
            for (const body of data1) {
              const response = await request(app)
                .put('/api/v1/r/original')
                .send(body)
                .set('Authorization', `Bearer ${powerCred}`);
              expect(response.statusCode).toBe(200);
            }
            for (const body of data2) {
              const response = await request(app)
                .put('/api/v1/r/original')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.statusCode).toBe(200);
            }
          });

          test('Adds subreddit moderators', async () => {
            await request(app)
              .put('/api/v1/r/original')
              .send({ addModerator: 'newMod2' })
              .set('Authorization', `Bearer ${powerCred}`);
            const sub1 = await Subreddit.findOne({ name: 'original' });
            const user1 = await User.findOne({ username: 'newMod2' });
            expect(sub1.moderators.filter(a => a === 'newMod2').length).toBe(1);
            expect(user1.moderator.filter(a => a === 'original').length).toBe(1);

            await request(app)
              .put('/api/v1/r/original')
              .send({ addModerator: 'newMod3' })
              .set('Authorization', `Bearer ${adminCred}`);
            const sub2 = await Subreddit.findOne({ name: 'original' });
            const user2 = await User.findOne({ username: 'newMod3' });
            expect(sub2.moderators.filter(a => a === 'newMod3').length).toBe(1);
            expect(user2.moderator.filter(a => a === 'original').length).toBe(1);
          });

          test('Removes subreddit moderators', async () => {
            await request(app)
              .put('/api/v1/r/original')
              .send({ removeModerator: 'badMod2' })
              .set('Authorization', `Bearer ${powerCred}`);
            const sub1 = await Subreddit.findOne({ name: 'original' });
            const user1 = await User.findOne({ username: 'badMod2' });
            expect(sub1.moderators.filter(a => a === 'badMod2').length).toBe(0);
            expect(user1.moderator.filter(a => a === 'original').length).toBe(0);

            await request(app)
              .put('/api/v1/r/original')
              .send({ removeModerator: 'badMod3' })
              .set('Authorization', `Bearer ${adminCred}`);
            const sub2 = await Subreddit.findOne({ name: 'original' });
            const user2 = await User.findOne({ username: 'badMod3' });
            expect(sub2.moderators.filter(a => a === 'badMod3').length).toBe(0);
            expect(user2.moderator.filter(a => a === 'original').length).toBe(0);
          });
        });

        describe('Given invalid user', () => {
          test('Responds with 400 status code', async () => {
            const data = [
              { addModerator: 'doesnotexist' },
              { addModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { addModerator: '' },
              { removeModerator: 'doesnotexist' },
              { removeModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { removeModerator: '' },
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/original')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            const data = [
              { addModerator: 'doesnotexist' },
              { addModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { addModerator: '' },
              { removeModerator: 'doesnotexist' },
              { removeModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { removeModerator: '' },
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/original')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with error message', async () => {
            const data = [
              { addModerator: 'doesnotexist' },
              { addModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { addModerator: '' },
              { removeModerator: 'doesnotexist' },
              { removeModerator: 'waytoolongtoactuallybeausernobodyhasanamethislong' },
              { removeModerator: '' },
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/original')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.body['errors']).toBeTruthy();
            }
          })
        })
      });

      describe('Given invalid credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put('/api/v1/r/original')
            .send({ moderator: 'newMod' })
            .set('Authorization', `Bearer ${badCred}`);
          expect(response.statusCode).toBe(403);
        });
      });

      describe('Given no credentials', () => {
        test('Responds with 401 status code', async () => {
          const response = await request(app)
            .put('/api/v1/r/original')
            .send({ moderator: 'newMod' });
          expect(response.statusCode).toBe(401);
        });
      });
    });

    describe('Banning subreddit', () => {
      describe('Given valid credentials', () => {
        describe('Given valid input', () => {
          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put('/api/v1/r/badSub')
              .send({ ban: false })
              .set('Authorization', `Bearer ${adminCred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Subreddit ban status is changed', async () => {
            const data = [
              { ban: true },
              { ban: false }
            ];
            for (const body of data) {
              await request(app)
                .put('/api/v1/r/badSub')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              const subreddit = await Subreddit.findOne({ name: 'badSub' });
              expect(subreddit.banned).toEqual(body.ban);
            }
          });
        });

        describe('Given invalid input', () => {
          test('Responds with 400 status code', async () => {
            const data = [
              { ban: 'hello' },
              { ban: null },
              { ban: 23 }
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/badSub')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            const data = [
              { ban: 'hello' },
              { ban: null },
              { ban: 23 }
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/badSub')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with error message', async () => {
            const data = [
              { ban: 'hello' },
              { ban: null },
              { ban: 23 }
            ];
            for (const body of data) {
              const response = await request(app)
                .put('/api/v1/r/badSub')
                .send(body)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.body['errors']).toBeTruthy();
            }
          });
        });
      });

      describe('Given invalid credentials', () => {
        test('Responds with 403 status code', async () => {
          for (const cred of [powerCred, badCred]) {
            const response = await request(app)
              .put('/api/v1/r/badSub')
              .send({ ban: false })
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(403);
          }
        });
      });

      describe('Given no credentials', () => {
        test('Responds with 401 status code', async () => {
          const response = await request(app)
            .put('/api/v1/r/badSub')
            .send({ ban: false });
          expect(response.statusCode).toBe(401);
        });
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .put('/api/v1/r/doesnotexist')
        .set('Authorization', `Bearer ${adminCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

afterAll(async () => {
  await require('../mongoConfigTesting').closeServer();
});
