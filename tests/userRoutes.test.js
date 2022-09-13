const request = require('supertest');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Subreddit = require('../models/subreddit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../app');
const mongoose = require('mongoose');

//JWT credentials for use in tests
let adminCred;
let badCred;
let deleteCred0;
let deleteCred3;
let updateCred;
let posterCred;

let stableUserPost;
let updateUserPost;
let deleteUserPost;
let removedUserPost;
let doesNotExistPost = new mongoose.Types.ObjectId();

let stableUserPostComment;
let stableUserPostCommentChild;
let updateUserPostComment;
let deleteUserPostComment;
let removeUserPostComment;
let doesNotExistPostComment = new mongoose.Types.ObjectId();

beforeAll(async () => {
  try {
    // Set up users to be used during tests
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

    await new User(
      {
        username: 'prolific',
        password: 'whocares'
      }
    ).save();
    posterCred = jwt.sign({ username: 'prolific' }, process.env.JWT_SECRET);

    // Set up posts to be used during tests
    const stablePost = await new Post(
      {
        title: 'Stable Post',
        content: 'Stable post content',
        author: 'prolific',
        user_post: true
      }
    ).save();
    stableUserPost = stablePost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: stableUserPost } }
    );

    const updatePost = await new Post(
      {
        title: 'Update Post',
        content: 'Update post content',
        author: 'prolific',
        user_post: true
      }
    ).save();
    updateUserPost = updatePost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: updateUserPost } }
    );

    const deletePost = await new Post(
      {
        title: 'Delete Post',
        content: 'Delete post content',
        author: 'prolific',
        user_post: true
      }
    ).save();
    deleteUserPost = deletePost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: deleteUserPost } }
    );

    const removePost = await new Post(
      {
        title: 'Remove Post',
        content: 'Remove post content',
        author: 'prolific',
        user_post: true
      }
    ).save();
    removedUserPost = removePost._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { posts: removedUserPost } }
    );

    // Set up comments to be used during tests
    const stableComment = await new Comment(
      {
        content: 'Stable comment content',
        author: 'prolific',
        post_parent: stableUserPost
      }
    ).save();
    stableUserPostComment = stableComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: stableUserPostComment } }
    );
    await Post.findByIdAndUpdate(
      stableUserPost,
      { $push: { comments: stableUserPostComment } }
    );

    const stableCommentChild = await new Comment(
      {
        content: 'Stable comment child content',
        author: 'prolific',
        post_parent: stableUserPost,
        comment_parent: stableUserPostComment
      }
    ).save();
    stableUserPostCommentChild = stableCommentChild._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: stableUserPostComment } }
    );
    await Comment.findByIdAndUpdate(
      stableUserPostComment,
      { $push: { comments: stableUserPostCommentChild } }
    );

    const updateComment = await new Comment(
      {
        content: 'Update comment content',
        author: 'prolific',
        post_parent: stableUserPost
      }
    ).save();
    updateUserPostComment = updateComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: updateUserPostComment } }
    );
    await Post.findByIdAndUpdate(
      stableUserPost,
      { $push: { comments: updateUserPostComment } }
    );

    const deleteComment = await new Comment(
      {
        content: 'Delete comment content',
        author: 'prolific',
        post_parent: stableUserPost
      }
    ).save();
    deleteUserPostComment = deleteComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: deleteUserPostComment } }
    );
    await Post.findByIdAndUpdate(
      stableUserPost,
      { $push: { comments: deleteUserPostComment } }
    );

    const removeComment = await new Comment(
      {
        content: 'Remove comment content',
        author: 'prolific',
        post_parent: stableUserPost
      }
    ).save();
    removeUserPostComment = removeComment._id;
    await User.findOneAndUpdate(
      { username: 'prolific' },
      { $push: { comments: removeUserPostComment } }
    );
    await Post.findByIdAndUpdate(
      stableUserPost,
      { $push: { comments: removeUserPostComment } }
    );

    // Add subreddits
    await new Subreddit(
      {
        name: 'original',
        creator: 'powermod',
        description: 'This is the first subreddit'
      }
    ).save();

    await new Subreddit(
      {
        name: 'toBeRemoved',
        creator: 'powermod',
        description: 'This is the removed subreddit'
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'toBeRemoved' },
      { $push: { subscribers: 'you_updater' } }
    );
    await User.findOneAndUpdate(
      { username: 'you_updater' },
      { $push: { subscriptions: 'toBeRemoved' } }
    );

    await new Subreddit(
      {
        name: 'toBeAdded',
        creator: 'powermod',
        description: 'This is the added subreddit'
      }
    ).save();
  } catch (err) {
    console.log(err);
  }
});

describe('POST /user', () => {
  describe('Given valid username', () => {
    describe('Given valid password', () => {
      test('Responds with a 201 code', async () => {
        const response = await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester1', password: 'password' });
        expect(response.statusCode).toBe(201);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester2', password: 'password' });
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with json object containing JWT', async () => {
        const response = await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester3', password: 'password' });
        expect(response.body.token).toBeDefined();
      });

      test('JWT is valid', async () => {
        const response = await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester03', password: 'password' });
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(decoded.username === 'tester03').toBeTruthy();
      });

      test('Saves new user to database', async () => {
        await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester0', password: 'password' });
        const newUser = await User.find({ username: 'tester0' });
        expect(newUser).toBeTruthy();
      });

      test('Hashes password before saving to the database', async () => {
        await request(app)
          .post('/api/v1/user')
          .send({ username: 'tester00', password: 'password' });
        const newUser = await User.findOne({ username: 'tester00' });
        const valid = await bcrypt.compare('password', newUser.password);
        expect(valid && newUser.password !== 'password').toBeTruthy();
      });
    });

    describe('Given invalid password', () => {
      test('Responds with 400 status code', async () => {
        const data = [
          { username: 'tester4' },
          { username: 'tester4', password: null },
          { username: 'tester4', passowrd: 'short' }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/user')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        const data = [
          { username: 'tester4' },
          { username: 'tester4', password: null },
          { username: 'tester4', passowrd: 'short' }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/user')
            .send(body);
          expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message', async () => {
        const data = [
          { username: 'tester4' },
          { username: 'tester4', password: null },
          { username: 'tester4', passowrd: 'short' }
        ];
        for (const body of data) {
          const response = await request(app)
            .post('/api/v1/user')
            .send(body);
          expect(response.body['errors']).toBeTruthy();
        }
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 400 status code', async () => {
      await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester6', password: 'password' });
      const response = await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester6', password: 'password' });
      expect(response.statusCode).toBe(400);
    });

    test('Responds with json in content-type header', async () => {
      await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester5', password: 'password' });
      const response = await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester5', password: 'password' });
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('Responds with error message', async () => {
      await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester7', password: 'password' });
      const response = await request(app)
        .post('/api/v1/user')
        .send({ username: 'tester7', password: 'password' });
      expect(response.body['errors']).toBeTruthy();
    });
  });
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
  });
});

describe('DELETE /user/:username', () => {
  // Deletes user data but doesn't remove entry from database to match reddit
  // functionality of knowing which username has existed but has been deleted
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/tobedeleted0')
          .set('Authorization', `Bearer ${deleteCred0}`);
        expect(response.statusCode).toBe(200);
        const response2 = await request(app)
          .delete('/api/v1/user/tobedeleted1')
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response2.statusCode).toBe(200);
      });

      test('User data is deleted', async () => {
        await request(app)
          .delete('/api/v1/user/tobedeleted3')
          .set('Authorization', `Bearer ${deleteCred3}`);
        const deleted = await User.findOne({ username: 'tobedeleted3' });
        expect(deleted.username).toEqual('tobedeleted3');
        expect(deleted.password).toEqual(null);
        expect(deleted.email).toEqual(null);
        expect(deleted.post_score).toEqual(null);
        expect(deleted.comment_score).toEqual(null);
        expect(deleted.admin).toEqual(null);
        expect(deleted.moderator).toEqual(null);
        expect(deleted.subscriptions).toEqual(null);
        expect(deleted.following).toEqual(null);
        expect(deleted.followers).toEqual(null);
        expect(deleted.blocked).toEqual(null);
        expect(deleted.posts).toEqual(null);
        expect(deleted.comments).toEqual(null);
        expect(deleted.upvoted_posts).toEqual(null);
        expect(deleted.upvoted_comments).toEqual(null);
        expect(deleted.downvoted_posts).toEqual(null);
        expect(deleted.downvoted_comments).toEqual(null);
        expect(deleted.chats).toEqual(null);
        expect(deleted.deleted).toBeTruthy();
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/tobedeleted2')
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/tobedeleted2');
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/doesnotexist')
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/doesnotexist')
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete('/api/v1/user/doesnotexist');
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('PUT /user/:username', () => {
  describe('Given valid username', () => {
    describe('Given the users credentials', () => {
      describe('Updating user info', () => {
        describe('Given valid info', () => {
          test('Responds with 200 status code', async () => {
            const data = [
              { email: 'newEmail@example.com' },
              { password: 'newpassword' },
              { email: 'newEmail@example.com', password: 'newpassword' }
            ];
            for (const update of data) {
              const response = await request(app)
                .put('/api/v1/user/you_updater')
                .send(update)
                .set('Authorization', `Bearer ${updateCred}`);
              expect(response.statusCode).toBe(200);
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

          test('Responds with json in content-type header', async () => {
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
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with error message', async () => {
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
              expect(response.body['errors']).toBeTruthy();
            }
          });
        });
      });

      describe('Updating user permissions', () => {
        test('Responds with 403 status code', async () => {
          const data = [
            { admin: true },
            { admin: false }
          ];
          for (const body of data) {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send(body)
              .set('Authorization', `Bearer ${updateCred}`);
            expect(response.statusCode).toBe(403);
          }
        });
      });

      describe('Updating user subscriptions', () => {
        describe('Given valid subreddit', () => {
          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'original' })
              .set('Authorization', `Bearer ${updateCred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Subreddits are added to user subscriptions', async () => {
            await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'toBeAdded' })
              .set('Authorization', `Bearer ${updateCred}`);
            const user = await User.findOne({ username: 'you_updater' });
            expect(user.subscriptions.find(sub => sub === 'toBeAdded')).toBeTruthy();
          });

          test('Subreddits are removed from user subscriptions', async () => {
            await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'toBeRemoved' })
              .set('Authorization', `Bearer ${updateCred}`);
            const user = await User.findOne({ username: 'you_updater' });
            expect(user.subscriptions.find(sub => sub === 'toBeRemoved')).toBeFalsy();
          });
        });

        describe('Given invalid subreddit', () => {
          test('Responds with 400 status code', async () => {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'doesNotExist' })
              .set('Authorization', `Bearer ${updateCred}`);
            expect(response.statusCode).toBe(400);
          });

          test('Responds with json in content-type header', async () => {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'doesNotExist' })
              .set('Authorization', `Bearer ${updateCred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          });

          test('Responds with error message', async () => {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send({ subscribe: 'doesNotExist' })
              .set('Authorization', `Bearer ${updateCred}`);
            expect(response.body.errors).toBeTruthy();
          });
        });
      });
    });

    describe('Given admin credentials', () => {
      describe('Updating user info', () => {
        test('Responds with 403 status code', async () => {
          const data = [
            { email: 'newEmail@example.com' },
            { password: 'newpassword' },
            { email: 'newEmail@example.com', password: 'newpassword' }
          ];
          for (const update of data) {
            const response = await request(app)
              .put('/api/v1/user/you_updater')
              .send(update)
              .set('Authorization', `Bearer ${adminCred}`);
            expect(response.statusCode).toBe(403);
          }
        });
      });

      describe('Updating user permissions', () => {
        describe('Given valid info', () => {
          test('Responds with 200 status code', async () => {
            const data = [
              { admin: true },
              { admin: false }
            ];
            for (const update of data) {
              const response = await request(app)
                .put('/api/v1/user/you_updater')
                .send(update)
                .set('Authorization', `Bearer ${adminCred}`);
              expect(response.statusCode).toBe(200);
            }
          });

          test('Updated permission is saved', async () => {
            const data = [
              { admin: true },
              { admin: false }
            ];
            for (const update of data) {
              await request(app)
                .put('/api/v1/user/you_updater2')
                .send(update)
                .set('Authorization', `Bearer ${adminCred}`);
              const user = await User.findOne({ username: 'you_updater2' });
              expect(user.admin).toEqual(update.admin);
            }
          });
        });

        describe('Given invalid info', () => {
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

          test('Responds with json in content-type header', async () => {
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
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with error message', async () => {
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
              expect(response.body['errors']).toBeTruthy();
            }
          });
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put('/api/v1/user/you_updater');
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .put('/api/v1/user/doesnotexist')
        .set('Authorization', `Bearer ${adminCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('POST /user/:username', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      describe('Given valid info', () => {
        test('Responds with 201 status code', async () => {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(201);
        });

        test('Responds with json in content-type header', async () => {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
        });

        test('Responds with json object containing post id', async () => {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.body['post_id']).toBeDefined();
        });

        test('Post id is valid', async () => {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${posterCred}`);
          const post = await Post.findById(response.body['post_id']);
          expect(post).toBeTruthy();
        });

        test('Post is added to users posts', async () => {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${posterCred}`);
          const user = await User.findOne({ username: 'prolific' });
          const found = user.posts.filter(post => post == response.body['post_id']);
          expect(found.length > 0).toBeTruthy();
        });
      });

      describe('Given invalid info', () => {
        test('Responds with 400 status code', async () => {
          const data = [
            { title: '', content: 'Title cannot be blank, but content can' },
            { title: null, content: 'Title cannot be blank, but content can' },
            { content: 'Where is my title' },
            {}
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/user/prolific')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          const data = [
            { title: '', content: 'Title cannot be blank, but content can' },
            { title: null, content: 'Title cannot be blank, but content can' },
            { content: 'Where is my title' },
            {}
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/user/prolific')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with error message', async () => {
          const data = [
            { title: '', content: 'Title cannot be blank, but content can' },
            { title: null, content: 'Title cannot be blank, but content can' },
            { content: 'Where is my title' },
            {}
          ];
          for (const body of data) {
            const response = await request(app)
              .post('/api/v1/user/prolific')
              .send(body)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body['errors']).toBeTruthy();
          }
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        for (const cred of [badCred, adminCred]) {
          const response = await request(app)
            .post('/api/v1/user/prolific')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(403);
        }
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post('/api/v1/user/prolific')
          .send({ title: 'title', content: 'Content' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given credentials', () => {
      test('Responds with 403 status code', async () => {
        for (const cred of [posterCred, badCred, adminCred]) {
          const response = await request(app)
            .post('/api/v1/user/doesnotexist')
            .send({ title: 'title', content: 'Content' })
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(403);
        }
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post('/api/v1/user/doesnotexist')
          .send({ title: 'title', content: 'Content' });
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('GET /user/:username/:postid', () => {
  describe('Given valid user', () => {
    describe('Given valid post', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost}`);
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost}`);
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with json object containing user profile information', async () => {
        //Needed to fill profile information on page
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost}`);
        expect(response.body.user.username).toBeDefined();
        expect(response.body.user.post_score).toBeDefined();
        expect(response.body.user.comment_score).toBeDefined();
        expect(response.body.user.admin).toBeDefined();
        expect(response.body.user.moderator).toBeDefined();
      });

      test('User info is valid', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost}`);
        const user = await User.findOne({ username: 'prolific' });
        expect(response.body.user.username).toEqual(user.username);
        expect(response.body.user.post_score).toEqual(user.post_score);
        expect(response.body.user.comment_score).toEqual(user.comment_score);
        expect(response.body.user.admin).toEqual(user.admin);
        expect(response.body.user.moderator).toEqual(user.moderator);
      });

      test('Responds with json object containing post information', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost}`);
        expect(response.body.post.title).toBeDefined();
        expect(response.body.post.content).toBeDefined();
        expect(response.body.post.author).toBeDefined();
        expect(response.body.post.score).toBeDefined();
        expect(response.body.comments).toBeDefined();
        expect(response.body.post.date_posted).toBeDefined();
        expect(response.body.post.date_edited).toBeDefined();
      });

      test('Post info is valid', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost.toString()}`);
        const post = await Post.findById(stableUserPost);
        expect(response.body.post.title).toEqual(post.title);
        expect(response.body.post.content).toEqual(post.content);
        expect(response.body.post.author).toEqual(post.author.toString());
        expect(response.body.post.score).toEqual(post.score);
        expect(new Date(response.body.post.date_posted).valueOf()).toBe(post.date_posted.valueOf());
        expect(new Date(response.body.post.date_edited).valueOf()).toBe(post.date_edited.valueOf());
      });

      test('Post comments are valid', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/${stableUserPost.toString()}`);
        const comments = await Comment.find({ post_parent: stableUserPost });
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
      })
    });

    describe('Given invalid post', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .get(`/api/v1/user/prolific/badid`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given post that is posted by another user', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .get(`/api/v1/user/bad_cred/${stableUserPost}`);
        expect(response.statusCode).toBe(404);
      });
    })
  });

  describe('Given invalid user', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .get(`/api/v1/user/doesnotexist/${stableUserPost}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('PUT /user/:username/:postid', () => {
  describe('Given valid username', () => {
    describe('Given valid post', () => {
      describe('Given valid credentials', () => {
        describe('Given valid info', () => {
          test('Responds with 200 status code', async () => {
            for (const cred of [posterCred, adminCred]) {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${updateUserPost}`)
                .send({ content: 'Updated Content 1' })
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(200);
            }
          });

          test('Post content is successfully updated', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ content: 'Updated Content 2' })
              .set('Authorization', `Bearer ${posterCred}`);
            const post = await Post.findById(updateUserPost);
            expect(post.content).toEqual('Updated Content 2');
          });
        });

        describe('Given invalid info', () => {
          test('Responds with 400 status code', async () => {
            const data = [{}, { content: null }, { content: '' }];
            for (const body of data) {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${updateUserPost}`)
                .send(body)
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ content: '' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
          });

          test('Respond with correct error message', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ content: '' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body['errors']).toEqual([
              {
                "value": "",
                "msg": "Content is required",
                "param": "content",
                "location": "body"
              }
            ]);
          });
        });

        describe('Given valid vote info', () => {
          test('Responds with 200 status code', async () => {
            const data = [
              { vote: 'upvote' },
              { vote: 'downvote' }
            ]
            for (const body of data) {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${updateUserPost}`)
                .send(body)
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(200);
            }
          });

          test('Comment score is correctly changed', async () => {
            const data = [
              { body: { vote: 'upvote' }, score: 1 },
              { body: { vote: 'downvote' }, score: -1 }
            ]
            for (const info of data) {
              await request(app)
                .put(`/api/v1/user/prolific/${updateUserPost}`)
                .send(info.body)
                .set('Authorization', `Bearer ${posterCred}`);
              const post = await Post.findById(updateUserPost);
              expect(post.score).toBe(info.score);
            }
          });
        });

        describe('Given invalid vote info', () => {
          test('Responds with 400 status code', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ vote: 'pwned' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(400);
          });

          test('Responds with json in content-type header', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ vote: 'pwned' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          });

          test('Responds with error message', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${updateUserPost}`)
              .send({ vote: 'pwned' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body.errors).toBeTruthy();
          });
        });
      });

      describe('Given invalid user credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put(`/api/v1/user/prolific/${updateUserPost}`)
            .send({ content: 'You got pwnd' })
            .set('Authorization', `Bearer ${badCred}`);
          expect(response.statusCode).toBe(403);
        });
      });

      describe('Given no user credentials', () => {
        test('Responds with 403 status code', async () => {
          const response = await request(app)
            .put(`/api/v1/user/prolific/${updateUserPost}`)
            .send({ content: 'You got pwnd' });
          expect(response.statusCode).toBe(401);
        });
      });
    });

    describe('Given invalid post', () => {
      test('Reponds with 404 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/user/prolific/2`)
          .send({ content: 'You got pwnd' })
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 403 status code', async () => {
      const response = await request(app)
        .put(`/api/v1/user/doesnotexist/${updateUserPost}`)
        .send({ content: 'You got pwnd' })
        .set('Authorization', `Bearer ${badCred}`);
      expect(response.statusCode).toBe(403);
    })
  })
});

describe('DELETE user/:username/:postid', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      describe('Given valid post', () => {
        test('Responds with 200 status code with user request', async () => {
          const response = await request(app)
            .delete(`/api/v1/user/prolific/${deleteUserPost}`)
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(200);
        });

        test('Responds with 200 status code with admin request', async () => {
          const response = await request(app)
            .delete(`/api/v1/user/prolific/${removedUserPost}`)
            .set('Authorization', `Bearer ${adminCred}`);
          expect(response.statusCode).toBe(200);
        });

        test('Post data is deleted by user', async () => {
          // Post is not outright removed from the DB to maintain feature 
          // that allows users to still access and view comments on the post
          // However title, content, and poster data are removed and replaced
          await request(app)
            .delete(`/api/v1/user/prolific/${deleteUserPost}`)
            .set('Authorization', `Bearer ${posterCred}`);
          const post = await Post.findById(deleteUserPost);
          const user = await User.findOne({ username: 'prolific' });
          expect(post.title).toEqual('[Deleted by user]');
          expect(post.content).toEqual('[Deleted by user]');
          expect(post.author).toEqual('[Deleted]');
          expect(user.posts.filter(p =>
            p.toString() === deleteUserPost.toString()
          ).length).toBe(0);
        });

        test('Post data is removed by admins', async () => {
          await request(app)
            .delete(`/api/v1/user/prolific/${removedUserPost}`)
            .set('Authorization', `Bearer ${adminCred}`);
          const post = await Post.findById(removedUserPost);
          const user = await User.findOne({ username: 'prolific' });
          expect(post.title).toEqual('[Removed by admin]');
          expect(post.content).toEqual('[Removed by admin]');
          expect(post.author).toEqual('[Removed]');
          expect(user.posts.filter(p =>
            p.toString() === removedUserPost.toString()
          ).length).toBe(0);
        })
      });

      describe('Given invalid post', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .delete(`/api/v1/user/prolific/${doesNotExistPost}`)
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
          const response2 = await request(app)
            .delete(`/api/v1/user/prolific/25`)
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response2.statusCode).toBe(404);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/prolific/${deleteUserPost}`)
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/prolific/${deleteUserPost}`);
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/doesnotexist/${deleteUserPost}`)
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/doesnotexist/${deleteUserPost}`);
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('POST /user/:username/:postid', () => {
  describe('Given valid user', () => {
    describe('Given valid credentials', () => {
      describe('Given valid post', () => {
        describe('Given valid submission info', () => {
          test('Responds with 201 status code', async () => {
            const response = await request(app)
              .post(`/api/v1/user/prolific/${stableUserPost}`)
              .send({ content: 'I am a test comment' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(201);
          });

          /* test('Comment is added to post', async () => {
            await request(app)
              .post(`/api/v1/user/prolific/${stableUserPost}`)
              .send({ content: 'I am a unique test comment' })
              .set('Authorization', `Bearer ${posterCred}`);
            const post = await Post.findById(stableUserPost).populate('comments');
            expect(post.comments.filter(c =>
              c.content === 'I am a unique test comment'
            ).length).toBe(1);
          }); */

          test('Comment is added to authors comments', async () => {
            await request(app)
              .post(`/api/v1/user/prolific/${stableUserPost}`)
              .send({ content: 'I am just another test comment in the wall' })
              .set('Authorization', `Bearer ${updateCred}`);
            const user = await User.findOne({ username: 'you_updater' }).populate('comments');
            expect(user.comments.filter(c =>
              c.content === 'I am just another test comment in the wall'
            ).length).toBe(1);
          });
        });

        describe('Given invalid submission info', () => {
          test('Responds with 400 status code', async () => {
            const data = [
              {},
              { content: null },
              { content: '' }
            ];
            for (const body of data) {
              const response = await request(app)
                .post(`/api/v1/user/prolific/${stableUserPost}`)
                .send(body)
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with error message', async () => {
            const response = await request(app)
              .post(`/api/v1/user/prolific/${stableUserPost}`)
              .send({ content: '' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.body['errors']).toBeDefined();
          });
        });
      });

      describe('Given invalid post', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/user/prolific/${doesNotExistPost}`)
            .send({ content: 'blah' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/user/prolific/${stableUserPost}`)
          .send({ content: 'blah' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid user', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .post(`/api/v1/user/doesnotexist/${stableUserPost}`)
        .send({ content: 'blah' })
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('PUT /user/:username/:postid/:commentid', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      describe('Given valid post', () => {
        describe('Given valid comment', () => {
          describe('Given valid info', () => {
            test('Responds with 200 status code', async () => {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                .send({ content: 'Updated' })
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(200);
            });

            test('Comment content is successfully updated', async () => {
              await request(app)
                .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                .send({ content: 'I Have Been Updated' })
                .set('Authorization', `Bearer ${posterCred}`);
              const comment = await Comment.findById(updateUserPostComment);
              expect(comment.content).toEqual('I Have Been Updated');
              expect(comment.date_edited !== comment.date_posted).toBeTruthy();
            });
          });

          describe('Given invalid info', () => {
            test('Responds with 400 status code', async () => {
              const data = [{}, { content: '' }, { content: null }];
              for (const body of data) {
                const response = await request(app)
                  .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(400);
              }
            });
          });

          describe('Given valid vote info', () => {
            test('Responds with 200 status code', async () => {
              const data = [
                { vote: 'upvote' },
                { vote: 'downvote' }
              ]
              for (const body of data) {
                const response = await request(app)
                  .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                  .send(body)
                  .set('Authorization', `Bearer ${updateCred}`);
                expect(response.statusCode).toBe(200);
              }
            });

            test('Comment score is correctly changed', async () => {
              const data = [
                { body: { vote: 'upvote' }, score: 1 },
                { body: { vote: 'downvote' }, score: -1 }
              ]
              for (const info of data) {
                await request(app)
                  .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                  .send(info.body)
                  .set('Authorization', `Bearer ${updateCred}`);
                const comment = await Comment.findById(updateUserPostComment);
                expect(comment.score).toBe(info.score);
              }
            });
          });

          describe('Given invalid vote info', () => {
            test('Responds with 400 status code', async () => {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                .send({ vote: 'pwned' })
                .set('Authorization', `Bearer ${updateCred}`);
              expect(response.statusCode).toBe(400);
            });

            test('Responds with json in content-type header', async () => {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                .send({ vote: 'pwned' })
                .set('Authorization', `Bearer ${updateCred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            });

            test('Responds with error message', async () => {
              const response = await request(app)
                .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
                .send({ vote: 'pwned' })
                .set('Authorization', `Bearer ${updateCred}`);
              expect(response.body.errors).toBeTruthy();
            });
          });
        });

        describe('Given invalid comment', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .put(`/api/v1/user/prolific/${stableUserPost}/${doesNotExistPostComment}`)
              .send({ content: 'Updated' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Given invalid post', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .put(`/api/v1/user/prolific/${doesNotExistPost}/${stableUserPostComment}`)
            .send({ content: 'Updated' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
          .send({ content: 'Updated' })
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .put(`/api/v1/user/prolific/${stableUserPost}/${updateUserPostComment}`)
          .send({ content: 'Updated' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .put(`/api/v1/user/doesnotexist/${stableUserPost}/${updateUserPostComment}`)
        .send({ content: 'Updated' })
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('DELETE /user/:username/:postid/:commentid', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      describe('Given valid post', () => {
        describe('Given valid comment', () => {
          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${deleteUserPostComment}`)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(200);
            const response2 = await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${removeUserPostComment}`)
              .set('Authorization', `Bearer ${adminCred}`);
            expect(response2.statusCode).toBe(200);
          });

          test('Comment data is deleted by author', async () => {
            await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${deleteUserPostComment}`)
              .set('Authorization', `Bearer ${posterCred}`);
            const comment = await Comment.findById(deleteUserPostComment);
            const user = await User.findOne({ username: 'prolific' });
            expect(comment.content).toEqual('[Deleted]');
            expect(comment.author).toEqual('[Deleted]');
            expect(user.comments.filter(c =>
              c.toString() === deleteUserPostComment.toString()
            ).length).toBe(0);
          });

          test('Comment data is removed by admin', async () => {
            await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${removeUserPostComment}`)
              .set('Authorization', `Bearer ${adminCred}`);
            const comment = await Comment.findById(removeUserPostComment);
            const user = await User.findOne({ username: 'prolific' });
            expect(comment.content).toEqual('[Removed]');
            expect(comment.author).toEqual('[Removed]');
            expect(user.comments.filter(c =>
              c.toString() === removeUserPostComment.toString()
            ).length).toBe(0);
          });
        });

        describe('Given invalid comment', () => {
          test('Respond with 404 status code', async () => {
            const response = await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${doesNotExistPostComment}`)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
            const response3 = await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/2`)
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response3.statusCode).toBe(404);
            const response2 = await request(app)
              .delete(`/api/v1/user/prolific/${stableUserPost}/${doesNotExistPostComment}`)
              .set('Authorization', `Bearer ${adminCred}`);
            expect(response2.statusCode).toBe(404);
          });
        });
      });

      describe('Given invalid post', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .delete(`/api/v1/user/prolific/${doesNotExistPost}/${deleteUserPostComment}`)
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
          const response3 = await request(app)
            .delete(`/api/v1/user/prolific/2/${deleteUserPostComment}`)
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response3.statusCode).toBe(404);
          const response2 = await request(app)
            .delete(`/api/v1/user/prolific/${doesNotExistPost}/${doesNotExistPostComment}`)
            .set('Authorization', `Bearer ${adminCred}`);
          expect(response2.statusCode).toBe(404);
        });
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/prolific/${stableUserPost}/${deleteUserPostComment}`)
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete(`/api/v1/user/prolific/${stableUserPost}/${deleteUserPostComment}`);
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .delete(`/api/v1/user/doesnotexist/${stableUserPost}/${deleteUserPostComment}`)
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('POST /user/:username/:postid/:commentid', () => {
  describe('Given valid username', () => {
    describe('Given credentials', () => {
      describe('Given valid post', () => {
        describe('Given valid comment', () => {
          describe('Given valid submission info', () => {
            test('Responds with 201 status code', async () => {
              const response = await request(app)
                .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
                .send({ content: 'New child comment' })
                .set('Authorization', `Bearer ${posterCred}`);
              expect(response.statusCode).toBe(201);
            });

            /* test('Comment is added to comment chain', async () => {
              const response = await request(app)
                .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
                .send({ content: 'Here I am' })
                .set('Authorization', `Bearer ${posterCred}`);
              const comment = await Comment.findById(stableUserPostComment).populate('comments');
              expect(comment.comments.filter(c =>
                c.content === 'Here I am'
              ).length).toBe(1);
            }); */

            test('Comment is added to authors comments', async () => {
              await request(app)
                .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostCommentChild}`)
                .send({ content: 'Need additional test comments' })
                .set('Authorization', `Bearer ${updateCred}`);
              const user = await User.findOne({ username: 'you_updater' }).populate('comments');
              expect(user.comments.filter(c =>
                c.content === 'Need additional test comments'
              ).length).toBe(1);
            });
          });

          describe('Given invalid submission info', () => {
            test('Responds with 400 status code', async () => {
              const data = [{}, { content: null }, { content: '' }];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.statusCode).toBe(400);
              }
            });

            test('Responds with json in content-type header', async () => {
              const data = [{}, { content: null }, { content: '' }];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
              }
            });

            test('Responds with error message', async () => {
              const data = [{}, { content: null }, { content: '' }];
              for (const body of data) {
                const response = await request(app)
                  .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
                  .send(body)
                  .set('Authorization', `Bearer ${posterCred}`);
                expect(response.body['errors']).toBeDefined();
              }
            });
          });
        });

        describe('Given invalid comment', () => {
          test('Responds with 404 status code', async () => {
            const response = await request(app)
              .post(`/api/v1/user/prolific/${stableUserPost}/${doesNotExistPostComment}`)
              .send({ content: 'New child comment' })
              .set('Authorization', `Bearer ${posterCred}`);
            expect(response.statusCode).toBe(404);
          });
        });
      });

      describe('Given invalid post', () => {
        test('Responds with 404 status code', async () => {
          const response = await request(app)
            .post(`/api/v1/user/prolific/${doesNotExistPost}/${stableUserPostComment}`)
            .send({ content: 'New child comment' })
            .set('Authorization', `Bearer ${posterCred}`);
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/user/prolific/${stableUserPost}/${stableUserPostComment}`)
          .send({ content: 'New child comment' });
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 404 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/user/doesnotexist/${stableUserPost}/${stableUserPostComment}`)
          .send({ content: 'New child comment' })
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(404);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post(`/api/v1/user/doesnotexist/${stableUserPost}/${stableUserPostComment}`)
          .send({ content: 'New child comment' });
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('/user/:username/comments', () => {
  describe('Valid username', () => {
    test('Responds with 200 status code', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/comments');
      expect(response.statusCode).toBe(200);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/comments');
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('Responds with user information', async () => {
      const response = await request(app)
        .get('/api/v1/user/bad_cred/comments');
      expect(response.body.post_score).toBeDefined();
      expect(response.body.comment_score).toBeDefined();
      expect(response.body.admin).toBeDefined();
      expect(response.body.moderator).toBeDefined();
      expect(response.body.comments).toBeDefined();
    });

    test('User information is valid', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/comments');
      const user = await User.findOne({ username: 'prolific' }).populate('comments');
      user.comments = user.comments.sort((a, b) => a.date_posted <= b.date_posted);
      const comments = [];
      for (const comment of user.comments) {
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
        comments.push(copy);
      }
      const check = response.body.comments;
      for (const comment of check) {
        comment.date_posted = new Date(comment.date_posted).valueOf();
        comment.date_edited = new Date(comment.date_edited).valueOf();
      }
      expect(response.body.post_score).toEqual(user.post_score);
      expect(response.body.comment_score).toEqual(user.comment_score);
      expect(response.body.admin).toEqual(user.admin);
      expect(response.body.moderator).toEqual(user.moderator);
      expect(check).toEqual(comments);
    });
  });

  describe('Invalid username', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .get('/api/v1/user/doesnotexist/comments');
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('GET /user/:username/posts', () => {
  describe('Given valid username', () => {
    test('Responds with 200 status code', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/posts');
      expect(response.statusCode).toBe(200);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/posts');
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('Responds with user information', async () => {
      const response = await request(app)
        .get('/api/v1/user/bad_cred/posts');
      expect(response.body.post_score).toBeDefined();
      expect(response.body.comment_score).toBeDefined();
      expect(response.body.admin).toBeDefined();
      expect(response.body.moderator).toBeDefined();
      expect(response.body.posts).toBeDefined();
    });

    test('User information is valid', async () => {
      const response = await request(app)
        .get('/api/v1/user/prolific/posts');
      const user = await User.findOne({ username: 'prolific' }).populate('posts');
      user.posts = user.posts.sort((a, b) => a.date_posted <= b.date_posted);
      const posts = [];
      for (const post of user.posts) {
        const copy = {
          _id: post._id.toString(),
          title: post.title,
          author: post.author.toString(),
          score: post.score,
          user_post: post.user_post,
          date_posted: post.date_posted.valueOf(),
          date_edited: post.date_edited.valueOf(),
          __v: post.__v
        }
        if (post.content) copy.content = post.content;
        if (post.subreddit) copy.subreddit = post.subreddit;
        posts.push(copy);
      }
      const check = response.body.posts;
      for (const post of check) {
        post.date_posted = new Date(post.date_posted).valueOf();
        post.date_edited = new Date(post.date_edited).valueOf();
      }
      expect(response.body.post_score).toEqual(user.post_score);
      expect(response.body.comment_score).toEqual(user.comment_score);
      expect(response.body.admin).toEqual(user.admin);
      expect(response.body.moderator).toEqual(user.moderator);
      expect(check).toEqual(posts);
    });
  });

  describe('Given invalid username', () => {
    test('Responds with 404 status code', async () => {
      const response = await request(app)
        .get('/api/v1/user/doesnotexist/posts');
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('GET /user/:username/upvoted', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.header['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with user information', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.body.post_score).toBeDefined();
        expect(response.body.comment_score).toBeDefined();
        expect(response.body.admin).toBeDefined();
        expect(response.body.moderator).toBeDefined();
        expect(response.body.upvotedPosts).toBeDefined();
        expect(response.body.upvotedComments).toBeDefined();
      });

      test('User information is valid', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        const user = await User.findOne({ username: 'prolific' }).populate(['upvoted_posts', 'upvoted_comments']);
        user.upvoted_posts = user.upvoted_posts.sort((a, b) => a.date_posted <= b.date_posted);
        user.upvoted_comments = user.upvoted_comments.sort((a, b) => a.date_posted <= b.date_posted);
        const upvotedPosts = [];
        for (const post of user.upvoted_posts) {
          const copy = {
            _id: post._id.toString(),
            title: post.title,
            author: post.author.toString(),
            score: post.score,
            user_post: post.user_post,
            date_posted: post.date_posted.valueOf(),
            date_edited: post.date_edited.valueOf(),
            __v: post.__v
          }
          if (post.content) copy.content = post.content;
          if (post.subreddit) copy.subreddit = post.subreddit;
          upvotedPosts.push(copy);
        }
        const upvotedComments = [];
        for (const comment of user.upvoted_comments) {
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
          comments.push(copy);
        }
        const checkPosts = response.body.upvotedPosts;
        for (const post of checkPosts) {
          post.date_posted = new Date(post.date_posted).valueOf();
          post.date_edited = new Date(post.date_edited).valueOf();
        }
        const checkComments = response.body.upvotedComments;
        for (const comment of checkComments) {
          comment.date_posted = new Date(comment.date_posted).valueOf();
          comment.date_edited = new Date(comment.date_edited).valueOf();
        }
        expect(response.body.post_score).toEqual(user.post_score);
        expect(response.body.comment_score).toEqual(user.comment_score);
        expect(response.body.admin).toEqual(user.admin);
        expect(response.body.moderator).toEqual(user.moderator);
        expect(checkPosts).toEqual(upvotedPosts);
        expect(checkComments).toEqual(upvotedComments);
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted')
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/upvoted');
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/doesnotexist/upvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/doesnotexist/upvoted');
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('GET /user/:username/downvoted', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(200);
      });

      test('Responds with json in content-type header', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.header['content-type']).toEqual(expect.stringContaining('json'));
      });

      test('Responds with user information', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.body.post_score).toBeDefined();
        expect(response.body.comment_score).toBeDefined();
        expect(response.body.admin).toBeDefined();
        expect(response.body.moderator).toBeDefined();
        expect(response.body.downvotedPosts).toBeDefined();
        expect(response.body.downvotedComments).toBeDefined();
      });

      test('User information is valid', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        const user = await User.findOne({ username: 'prolific' }).populate(['downvoted_posts', 'downvoted_comments']);
        user.downvoted_posts = user.downvoted_posts.sort((a, b) => a.date_posted <= b.date_posted);
        user.downvoted_comments = user.downvoted_comments.sort((a, b) => a.date_posted <= b.date_posted);
        const downvotedPosts = [];
        for (const post of user.downvoted_posts) {
          const copy = {
            _id: post._id.toString(),
            title: post.title,
            author: post.author.toString(),
            score: post.score,
            user_post: post.user_post,
            date_posted: post.date_posted.valueOf(),
            date_edited: post.date_edited.valueOf(),
            __v: post.__v
          }
          if (post.content) copy.content = post.content;
          if (post.subreddit) copy.subreddit = post.subreddit;
          downvotedPosts.push(copy);
        }
        const downvotedComments = [];
        for (const comment of user.downvoted_comments) {
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
          comments.push(copy);
        }
        const checkPosts = response.body.downvotedPosts;
        for (const post of checkPosts) {
          post.date_posted = new Date(post.date_posted).valueOf();
          post.date_edited = new Date(post.date_edited).valueOf();
        }
        const checkComments = response.body.downvotedComments;
        for (const comment of checkComments) {
          comment.date_posted = new Date(comment.date_posted).valueOf();
          comment.date_edited = new Date(comment.date_edited).valueOf();
        }
        expect(response.body.post_score).toEqual(user.post_score);
        expect(response.body.comment_score).toEqual(user.comment_score);
        expect(response.body.admin).toEqual(user.admin);
        expect(response.body.moderator).toEqual(user.moderator);
        expect(checkPosts).toEqual(downvotedPosts);
        expect(checkComments).toEqual(downvotedComments);
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted')
          .set('Authorization', `Bearer ${badCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/prolific/downvoted');
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid username', () => {
    describe('Given credentials', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/doesnotexist/downvoted')
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .get('/api/v1/user/doesnotexist/downvoted');
        expect(response.statusCode).toBe(401);
      });
    });
  });
});

afterAll(async () => {
  await require('../mongoConfigTesting').closeServer();
});
