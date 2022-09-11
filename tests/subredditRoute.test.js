const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Subreddit = require('../models/subreddit');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');

const app = require('../app');

let adminCred;
let powerCred;
let deletedCred;
let badCred;
let posterCred;

let stablePost;
let updatePost;
let bannedPost;
let deletePost0;
let deletePost1;
let deletePost2;
let doesNotExistPost = new mongoose.Types.ObjectId();

let stableComment;
let updateComment;
let deleteComment0;
let deleteComment1;
let deleteComment2;
let doesnotexistComment = new mongoose.Types.ObjectId();

let bigString = 'ahhhhhh';
while (bigString.length < 50000) {
  bigString += bigString;
}

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
        username: 'prolific',
        password: 'blahblahblah'
      }
    ).save();
    posterCred = jwt.sign({ username: 'prolific' }, process.env.JWT_SECRET);

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
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { banned_users: 'bad_cred' } }
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

    await new Subreddit(
      {
        name: 'emptySub',
        creator: 'powermod',
        description: 'Like combing a desert'
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'emptySub' },
      { $push: { moderators: 'powermod' } }
    );
    await User.findOneAndUpdate(
      { username: 'powermod' },
      { $push: { moderator: 'emptySub' } }
    );

    // Create posts for testing
    const stableSubPost = await new Post(
      {
        title: 'Stable Post',
        content: 'Stable post content',
        author: 'prolific',
        subreddit: 'original',
        user_post: false
      }
    ).save();
    stablePost = stableSubPost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: stablePost } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { posts: stablePost } }
    );

    const updateSubPost = await new Post(
      {
        title: 'Update Post',
        content: 'Update post content',
        author: 'prolific',
        subreddit: 'original',
        user_post: false
      }
    ).save();
    updatePost = updateSubPost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: updatePost } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { posts: updatePost } }
    );

    const bannedSubPost = await new Post(
      {
        title: 'Bad Post',
        content: 'Banned post content',
        author: 'prolific',
        subreddit: 'banhammered',
        user_post: false
      }
    ).save();
    bannedPost = bannedSubPost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: stablePost } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'banhammered' },
      { $push: { posts: stablePost } }
    );

    const deleteSubPost0 = await new Post(
      {
        title: 'Delete Post',
        content: 'Delete post content',
        author: 'prolific',
        subreddit: 'original',
        user_post: false
      }
    ).save();
    deletePost0 = deleteSubPost0._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: deletePost0 } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { posts: deletePost0 } }
    );
    const deleteSubPost1 = await new Post(
      {
        title: 'Delete Post',
        content: 'Delete post content',
        author: 'prolific',
        subreddit: 'original',
        user_post: false
      }
    ).save();
    deletePost1 = deleteSubPost1._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: deletePost1 } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { posts: deletePost1 } }
    );
    const deleteSubPost2 = await new Post(
      {
        title: 'Delete Post',
        content: 'Delete post content',
        author: 'prolific',
        subreddit: 'original',
        user_post: false
      }
    ).save();
    deletePost2 = deleteSubPost2._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: deletePost2 } }
    );
    await Subreddit.findOneAndUpdate(
      { name: 'original' },
      { $push: { posts: deletePost2 } }
    );

    // Create comments for testing
    const stableSubComment = await new Comment(
      {
        content: 'Stable comment content',
        author: 'prolific',
        post_parent: stablePost,
        user_post: false
      }
    ).save();
    stableComment = stableSubComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: stableComment } }
    );

    const updateSubComment = await new Comment(
      {
        content: 'Update comment content',
        author: 'prolific',
        post_parent: stablePost,
        user_post: false
      }
    ).save();
    updateComment = updateSubComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: updateComment } }
    );

    const deleteSubComment0 = await new Comment(
      {
        content: 'Update comment content',
        author: 'prolific',
        post_parent: stablePost,
        user_post: false
      }
    ).save();
    deleteComment0 = deleteSubComment0._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: deleteComment0 } }
    );

    const deleteSubComment1 = await new Comment(
      {
        content: 'Update comment content',
        author: 'prolific',
        post_parent: stablePost,
        user_post: false
      }
    ).save();
    deleteComment1 = deleteSubComment1._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: deleteComment1 } }
    );

    const deleteSubComment2 = await new Comment(
      {
        content: 'Update comment content',
        author: 'prolific',
        post_parent: stablePost,
        user_post: false
      }
    ).save();
    deleteComment2 = deleteSubComment2._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: deleteComment2 } }
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
        const subreddit = await Subreddit.findOne({ name: 'original' })
          .populate('posts');
        const posts = subreddit.posts;
        const modified = [];
        for (const post of posts) {
          const copy = {
            _id: post._id.toString(),
            title: post.title,
            content: post.content,
            author: post.author,
            score: post.score,
            user_post: post.user_post,
            subreddit: post.subreddit,
            date_posted: post.date_posted.valueOf(),
            date_edited: post.date_edited.valueOf(),
            __v: post.__v
          }
          modified.push(copy);
        }
        const check = response.body.posts;
        for (const post of check) {
          post.date_posted = new Date(post.date_posted).valueOf();
          post.date_edited = new Date(post.date_edited).valueOf();
        }
        expect(check).toEqual(modified);
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
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
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
                .set('Authorization', `Bearer ${powerCred}`);
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

describe('POST /r/:subreddit', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid credentials', () => {
      describe('Given valid info', () => {
        test('Responds with 201 status code', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(201);
          }
        });

        test('Responds with json in content-type header', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with json object containing post id', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body['post_id']).toBeDefined();
          }
        });

        test('Post id is valid', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            const post = await Post.findById(response.body.post_id);
            expect(post).toBeTruthy();
          }
        });

        test('Post is added to subreddit', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            const sub = await Subreddit.findOne({ name: 'original' });
            const found = sub.posts.filter(post => post == response.body.post_id);
            expect(found.length > 0).toBeTruthy();
          }
        });

        test('Post is added to user', async () => {
          const data = [
            { title: 'Title' },
            { title: 'Title', content: 'Content' }
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            const user = await Subreddit.findOne({ username: 'prolific' });
            const found = user.posts.filter(post => post == response.body.post_id);
            expect(found.length > 0).toBeTruthy();
          }
        });
      });

      describe('Given invalid info', () => {
        test('Responds with 400 status code', async () => {
          const data = [
            {},
            { title: null },
            { content: 'Content' },
            { content: bigString },
            { title: bigString },
            { title: 'bigString', content: bigString },
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          const data = [
            {},
            { title: null },
            { content: 'Content' },
            { content: bigString },
            { title: bigString },
            { title: 'bigString', content: bigString },
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with error message', async () => {
          const data = [
            {},
            { title: null },
            { content: 'Content' },
            { content: bigString },
            { title: bigString },
            { title: 'bigString', content: bigString },
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/r/original')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body.errors).toBeTruthy();
          }
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .post('/api/v1/r/original')
          .send({ title: 'badness' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post('/api/v1/r/original')
          .send({ title: 'badness' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    describe('Given credentials', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .post('/api/v1/r/doesnotexist')
          .send({ title: 'badness' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post('/api/v1/r/doesnotexist')
          .send({ title: 'badness' });
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('GET /r/:subreddit/:postid', () => {
  describe('Given valid subreddit', () => {
    describe('Subreddit is not banned', () => {
      describe('Given valid postid', () => {
        test('Responds with 200 status code', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          expect(response.statusCode).toBe(200);
        });

        test('Responds with json in content-type header', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        });

        test('Responds with json object containing subreddit information', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          expect(response.body.info.banned).toBeDefined();
          expect(response.body.info.description).toBeDefined();
          expect(response.body.info.creator).toBeDefined();
          expect(response.body.info.date_created).toBeDefined();
          expect(response.body.info.subscribers).toBeDefined();
          expect(response.body.info.moderators).toBeDefined();
        });

        test('Subreddit information is valid', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          const subreddit = await Subreddit.findOne({ name: 'original' });
          expect(response.body.info.banned).toBeFalsy();
          expect(response.body.info.description).toEqual(subreddit.description);
          expect(response.body.info.creator).toEqual(subreddit.creator);
          expect(new Date(response.body.info.date_created).valueOf())
            .toEqual(subreddit.date_created.valueOf());
          expect(response.body.info.subscribers).toEqual(subreddit.subscribers.length);
          expect(response.body.info.moderators).toEqual(subreddit.moderators);
        });

        test('Responds with json object containing post information', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          expect(response.body.post.title).toBeDefined();
          expect(response.body.post.content).toBeDefined();
          expect(response.body.post.author).toBeDefined();
          expect(response.body.post.score).toBeDefined();
          expect(response.body.comments).toBeDefined();
          expect(response.body.post.date_posted).toBeDefined();
          expect(response.body.post.date_edited).toBeDefined();
        });

        test('Post information is valid', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          const post = await Post.findById(stablePost);
          expect(response.body.post.title).toEqual(post.title);
          expect(response.body.post.content).toEqual(post.content);
          expect(response.body.post.author).toEqual(post.author);
          expect(response.body.post.score).toEqual(post.score);
          expect(new Date(response.body.post.date_posted).valueOf())
            .toEqual(post.date_posted.valueOf());
          expect(new Date(response.body.post.date_edited).valueOf())
            .toEqual(post.date_posted.valueOf());
        });

        test('Post comments are valid', async () => {
          const response = await request(app)
            .get(`/api/v1/r/original/${stablePost}`);
          const comments = await Comment.find({ post_parent: stablePost });
          const modified = [];
          for (const comment of comments) {
            const copy = {
              _id: comment._id.toString(),
              content: comment.content,
              author: comment.author.toString(),
              score: comment.score,
              post_parent: comment.post_parent.toString(),
              date_posted: comment.date_posted.valueOf(),
              date_edited: comment.date_edited.valueOf(),
              __v: comment.__v
            }
            if (comment.comment_parent) copy.comment_parent = comment.comment_parent.toString();
            modified.push(copy);
          }
          const check = response.body.comments;
          for (const comment of check) {
            comment.date_posted = new Date(comment.date_posted).valueOf();
            comment.date_edited = new Date(comment.date_edited).valueOf();
          }
          expect(check).toEqual(modified);
        });
      });

      describe('Given invalid postid', () => {
        test('Responds with 404 status code', async () => {
          for (const postid of [doesNotExistPost, 'badId']) {
            const response = await request(app)
              .get(`/api/v1/r/original/${postid}`);
            expect(response.statusCode).toBe(404);
          }
        });
      });

      describe('Given post belonging to another subreddit', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .get(`/api/v1/r/emptySub/${stablePost}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Subreddit is banned', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get(`/api/v1/r/banhammered/${bannedPost}`);
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get(`/api/v1/r/banhammered/${bannedPost}`);
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      });

      test('Responds with json object containing subreddit ban info', async () => {
        const response = await request(app)
          .get(`/api/v1/r/banhammered/${bannedPost}`);
        expect(response.body.info.banned).toBeDefined();
        expect(response.body.info.date_banned).toBeDefined();
      });

      test('Subreddit ban info is valid', async () => {
        const response = await request(app)
          .get(`/api/v1/r/banhammered/${bannedPost}`);
        const subreddit = await Subreddit.findOne({ name: 'banhammered' });
        expect(response.body.info.banned).toBeTruthy();
        expect(new Date(response.body.info.date_banned).valueOf())
          .toEqual(subreddit.date_banned.valueOf());
      });

      test('Does not respond with post info', async () => {
        const response = await request(app)
          .get(`/api/v1/r/banhammered/${bannedPost}`);
        expect(response.body.post).toBeFalsy();
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .get(`/api/v1/r/doesnotexist/${stablePost}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('PUT /r/:subreddit/:postid', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid credentials', () => {
      describe('Subreddit is not banned', () => {
        describe('Given valid postid', () => {
          describe('Given valid info', () => {
            test('Responds with 200 status code', async () => {
              for (const cred of [posterCred, adminCred]) {
                const response = await request(app)
                  .put(`/api/v1/r/original/${updatePost}`)
                  .send({ content: 'This is new content' })
                  .set('Authorization', `Bearer ${cred}`);
                expect(response.statusCode).toBe(200);
              }
            });

            test('Post content is successfully updated', async () => {
              const data = [
                { cred: posterCred, content: 'This is new content' },
                { cred: adminCred, content: 'This is admin content' }
              ];
              for (const input of data) {
                await request(app)
                  .put(`/api/v1/r/original/${updatePost}`)
                  .send({ content: input.content })
                  .set('Authorization', `Bearer ${input.cred}`);
                const post = await Post.findById(updatePost);
                expect(post.content).toEqual(input.content);
              }
            });
          });

          describe('Given invalid info', () => {
            test('Responds with 400 status code', async () => {
              const data = [
                { content: bigString }
              ];
              for (const body of data) {
                const response = await request(app)
                  .put(`/api/v1/r/original/${updatePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(400);
              }
            });

            test('Responds with json in content-type header', async () => {
              const data = [
                { content: bigString }
              ];
              for (const body of data) {
                const response = await request(app)
                  .put(`/api/v1/r/original/${updatePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.headers['content-type'])
                  .toEqual(expect.stringContaining('json'));
              }
            });

            test('Responds with error message', async () => {
              const data = [
                { content: bigString }
              ];
              for (const body of data) {
                const response = await request(app)
                  .put(`/api/v1/r/original/${updatePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.body.errors).toBeTruthy();
              }
            });
          });
        });

        describe('Given invalid postid', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .put(`/api/v1/r/original/${doesNotExistPost}`)
              .send({ content: 'whatever' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Subreddit is banned', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put(`/api/v1/r/banhammered/${bannedPost}`)
            .send({ content: 'whatever' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(403);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/original/${updatePost}`)
          .send({ content: 'whatever' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/original/${updatePost}`)
          .send({ content: 'whatever' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    describe('Given credentials', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/doesnotexist/${updatePost}`)
          .send({ content: 'whatever' })
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/doesnotexist/${updatePost}`)
          .send({ content: 'whatever' });
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('DELETE /r/:subreddit/:postid', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid postid', () => {
      describe('Given valid credentials', () => {
        test('Responds with 200 status code', async () => {
          const data = [
            { cred: posterCred, post: deletePost0 },
            { cred: powerCred, post: deletePost1 },
            { cred: adminCred, post: deletePost2 },
          ];
          for (const info of data) {
            const response = await request(app)
              .delete(`/api/v1/r/original/${info.post}`)
              .set('Authorization', `Bearer ${info.cred}`);
            expect(response.statusCode).toBe(200);
          }
        });

        test('Deleted post data', async () => {
          const data = [
            { cred: posterCred, post: deletePost0, del: '[Deleted by user]' },
            { cred: powerCred, post: deletePost1, del: '[Removed by mods]' },
            { cred: adminCred, post: deletePost2, del: '[Removed by admins]' },
          ];
          for (const info of data) {
            await request(app)
              .delete(`/api/v1/r/original/${info.post}`)
              .set('Authorization', `Bearer ${info.cred}`);
            const post = await Post.findById(info.post);
            const user = await User.findOne({ username: 'prolific' });
            expect(post.author).toBe('[Deleted]');
            expect(post.title).toBe(info.del);
            expect(post.content).toBe(info.del);
            expect(user.posts.find(post => { return post == info.post }))
              .toBeFalsy();
          }
        });
      });

      describe('Given invalid credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .delete(`/api/v1/r/original/${stablePost}`)
            .set('Authorization', `Bearer ${badCred}`);
          expect(response.statusCode).toBe(403);
        });
      });

      describe('Given no credentials', () => {
        test('Responds with 401 status code', async () => {
          const response = await request(app)
            .delete(`/api/v1/r/original/${stablePost}`);
          expect(response.statusCode).toBe(401);
        });
      });
    });

    describe('Given invalid postid', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/r/original/${doesNotExistPost}`)
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .delete(`/api/v1/r/doesnotexist/${stablePost}`)
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('POST /r/:subreddit/:postid', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid credentials', () => {
      describe('Subreddit is not banned', () => {
        describe('Given valid postid', () => {
          describe('Given valid info', () => {
            test('Responds with 201 status code', async () => {
              const response = await request(app)
                .post(`/api/v1/r/original/${stablePost}`)
                .send({ content: 'Content' })
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(201);
            });

            test('Comment is added to authors comments', async () => {
              await request(app)
                .post(`/api/v1/r/original/${stablePost}`)
                .send({ content: 'Why are we here?' })
                .set('Authorization', `Bearer ${posterCred}`);
              const user = await User.findOne({ username: 'prolific' }).populate('comments');
              expect(user.comments.find(comment => {
                return comment.content === 'Why are we here?'
              }))
                .toBeTruthy();
            });
          });

          describe('Given invalid info', () => {
            test('Responds with 400 status code', async () => {
              const data = [
                {},
                { content: null },
                { content: '' },
                { content: bigString },
              ];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/r/original/${stablePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(400);
              }
            });

            test('Responds with json in content-type header', async () => {
              const data = [
                {},
                { content: null },
                { content: '' },
                { content: bigString },
              ];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/r/original/${stablePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.headers['content-type'])
                  .toEqual(expect.stringContaining('json'));
              }
            });

            test('Responds with error message', async () => {
              const data = [
                {},
                { content: null },
                { content: '' },
                { content: bigString },
              ];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/r/original/${stablePost}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.body.errors).toBeTruthy();
              }
            });
          });
        });

        describe('Given invalid postid', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .post(`/api/v1/r/original/${doesNotExistPost}`)
              .send({ content: 'who cares' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Subreddit is banned', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/r/banhammered/${bannedPost}`)
            .send({ content: 'who cares' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(403);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/r/original/${stablePost}`)
          .send({ content: 'who cares' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/r/original/${stablePost}`)
          .send({ content: 'who cares' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .post(`/api/v1/r/doesnotexist/${stablePost}`)
        .send({ content: 'who cares' })
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('PUT /r/:subreddit/:postid/:commentid', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid credentials', () => {
      describe('Subreddit is not banned', () => {
        describe('Given valid postid', () => {
          describe('Given valid commentid', () => {
            describe('Given valid info', () => {
              test('Responds with 200 status code', async () => {
                const response = await request(app)
                  .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
                  .send({ content: 'Updated' })
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(200);
              });

              test('Comment content is successfully updated', async () => {
                await request(app)
                  .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
                  .send({ content: 'Here we go again' })
                  .set('Authorization', `Bearer ${posterCred}`);
                const comment = await Comment.findById(updateComment);
                expect(comment.content).toEqual('Here we go again');
                expect(comment.date_created !== comment.date_edited).toBeTruthy();
              });
            });

            describe('Given invalid info', () => {
              test('Responds with 400 status code', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.statusCode).toBe(400);
                }
              });

              test('Responds with json in content-type header', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.headers['content-type'])
                    .toEqual(expect.stringContaining('json'));
                }
              });

              test('Responds with error message', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.body.errors).toBeTruthy();
                }
              });
            });
          });

          describe('Given invalid commentid', () => {
            test('Responds with 404 status code', async () => {
              const response = await request(app)
                .put(`/api/v1/r/original/${stablePost}/${doesnotexistComment}`)
                .send({ content: 'Updated' })
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(404);
            });
          });
        });

        describe('Given invalid postid', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .put(`/api/v1/r/original/${doesNotExistPost}/${updateComment}`)
              .send({ content: 'Updated' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Subreddit is banned', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put(`/api/v1/r/banhammered/${bannedPost}/${updateComment}`)
            .send({ content: 'Updated' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(403);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
          .send({ content: 'Updated' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/original/${stablePost}/${updateComment}`)
          .send({ content: 'Updated' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    describe('Given credentials', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/doesnotexist/${stablePost}/${updateComment}`)
          .send({ content: 'Updated' })
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/r/doesnotexist/${stablePost}/${updateComment}`)
          .send({ content: 'Updated' });
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('DELETE /r/:subreddit/:postid/:commentid', () => {
  describe('Given valid subreddit', () => {
    describe('Given valid postid', () => {
      describe('Given valid commentid', () => {
        describe('Given valid credentials', () => {
          test('Responds with 200 status code', async () => {
            const data = [
              { comment: deleteComment0, cred: posterCred },
              { comment: deleteComment1, cred: powerCred },
              { comment: deleteComment2, cred: adminCred },
            ];
            for (const info of data) {
              const response = await request(app)
                .delete(`/api/v1/r/original/${stablePost}/${info.comment}`)
                .set('Authorization', `Bearer ${info.cred}`);
              expect(response.statusCode).toBe(200);
            }
          });

          test('Comment data is deleted', async () => {
            const data = [
              { comment: deleteComment0, cred: posterCred, del: '[Deleted by user]' },
              { comment: deleteComment1, cred: powerCred, del: '[Removed by mods]' },
              { comment: deleteComment2, cred: adminCred, del: '[Removed by admins]' },
            ];
            for (const info of data) {
              const response = await request(app)
                .delete(`/api/v1/r/original/${stablePost}/${info.comment}`)
                .set('Authorization', `Bearer ${info.cred}`);
              const comment = await Comment.findById(info.comment);
              expect(comment.author).toEqual('[Deleted]');
              expect(comment.content).toEqual(info.del);
            }
          });

          test('Comment is removed from user', async () => {
            const data = [
              { comment: deleteComment0, cred: posterCred, del: '[Deleted by user]' },
              { comment: deleteComment1, cred: powerCred, del: '[Removed by mods]' },
              { comment: deleteComment2, cred: adminCred, del: '[Removed by admins]' },
            ];
            for (const info of data) {
              const response = await request(app)
                .delete(`/api/v1/r/original/${stablePost}/${info.comment}`)
                .set('Authorization', `Bearer ${info.cred}`);
              const user = await User.findOne({ username: 'prolific' });
              expect(user.comments.find(
                comment => { return comment.toString() === info.comment.toString() }
              ))
                .toBeFalsy();
            }
          });
        });

        describe('Given invalid credentials', () => {
          test('Responds with 403 status code', async () => {
            const response = await request(app)
              .delete(`/api/v1/r/original/${stablePost}/${deleteComment0}`)
              .set('Authorization', `Bearer ${badCred}`);
            expect(response.statusCode).toBe(403);
          });
        });

        describe('Given no credentials', () => {
          test('Responds with 401 status code', async () => {
            const response = await request(app)
              .delete(`/api/v1/r/original/${stablePost}/${deleteComment0}`);
            expect(response.statusCode).toBe(401);
          });
        });
      });

      describe('Given invalid commentid', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .delete(`/api/v1/r/original/${stablePost}/${doesnotexistComment}`)
            .set('Authorization', `Bearer ${adminCred}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Given invalid postid', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/r/original/${doesNotExistPost}/${deleteComment0}`)
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .delete(`/api/v1/r/doesnotexist/${stablePost}/${deleteComment0}`)
        .set('Authorization', `Bearer ${adminCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('POST /r/:subreddit/:postid/:commentid', () => {
  describe('Given valid subreddit', () => {
    describe('Subreddit is not banned', () => {
      describe('Given valid postid', () => {
        describe('Given valid commentid', () => {
          describe('Given valid credentials', () => {
            describe('Given valid info', () => {
              test('Responds with 201 status code', async () => {
                const response = await request(app)
                  .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                  .send({ content: 'Child comment' })
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(201);
              });

              test('Comment is added to authors comments', async () => {
                await request(app)
                  .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                  .send({ content: 'Do you really want to go back in time?' })
                  .set('Authorization', `Bearer ${posterCred}`);
                const user = await User.findOne({ username: 'prolific' })
                  .populate('comments');
                expect(user.comments.find(comment => {
                  return comment.content === 'Do you really want to go back in time?'
                }))
                  .toBeTruthy();
              });
            });

            describe('Given invalid info', () => {
              test('Responds with 400 status code', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.statusCode).toBe(400);
                }
              });

              test('Responds with json in content-type header', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.headers['content-type'])
                    .toEqual(expect.stringContaining('json'));
                }
              });

              test('Responds with error message', async () => {
                const data = [
                  {},
                  { content: null },
                  { content: '' },
                  { content: bigString }
                ];
                for (const body of data) {
                  const response = await request(app)
                    .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                    .send(body)
                    .set('Authorization', `Bearer ${posterCred}`);
                  expect(response.body.errors).toBeTruthy();
                }
              });
            });
          });

          describe('Given invalid credentials', () => {
            test('Responds with 403 status code', async () => {
              const response = await request(app)
                .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                .send({ content: 'There\'s something inside you' })
                .set('Authorization', `Bearer ${badCred}`);
              expect(response.statusCode).toBe(403);
            });
          });

          describe('Given no credentials', () => {
            test('Responds with 403 status code', async () => {
              const response = await request(app)
                .post(`/api/v1/r/original/${stablePost}/${stableComment}`)
                .send({ content: 'It\'s hard to explain' });
              expect(response.statusCode).toBe(401);
            });
          });
        });

        describe('Given invalid commentid', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .post(`/api/v1/r/original/${stablePost}/${doesnotexistComment}`)
              .send({ content: 'There\'re talking about you boy' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Given invalid postid', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/r/original/${doesNotExistPost}/${stableComment}`)
            .send({ content: 'But you\'re still the same' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Subreddit is banned', () => {
      describe('Given credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/r/banhammered/${bannedPost}/${stableComment}`)
            .send({ content: 'Holding a palm full of miracles' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(403);
        });
      });

      describe('Given no credentials', () => {
        test('Responds with 401 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/r/banhammered/${bannedPost}/${stableComment}`)
            .send({ content: 'Building a house on the moon' });
          expect(response.statusCode).toBe(401);
        });
      });
    });
  });

  describe('Given invalid subreddit', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .post(`/api/v1/r/doesnotexist/${stableComment}/${stableComment}`)
        .send({ content: 'You\'re getting colder' })
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

afterAll(async () => {
  await require('../mongoConfigTesting').closeServer();
});
