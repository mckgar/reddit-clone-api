const request = require('supertest');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
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

    const prolific = await new User(
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        author: prolific._id,
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
        const response = await request(app)
          .put('/api/v1/user/you_updater')
          .set('Authorization', `Bearer ${updateCred}`);
        expect(response.statusCode).toBe(200);
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

describe('POST /user/:username', () => {
  describe('Given valid input and user credentials', () => {
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
    })
  });

  describe('Given invalid input', () => {
    test('Responds with 400 status code', async () => {
      const data = [
        { title: '', content: 'Title cannot be blank, but content can' },
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

    test('Responds with correct error message', async () => {
      const data = [
        { title: '', content: 'Title cannot be blank, but content can' },
        { content: 'Where is my title' },
        {}
      ];
      for (const body of data) {
        const response = await request(app)
          .post('/api/v1/user/prolific')
          .send(body)
          .set('Authorization', `Bearer ${posterCred}`);
        expect(response.body['errors']).toEqual([
          {
            "value": `${body.title ? body.title : ''}`,
            "msg": "Title is required",
            "param": "title",
            "location": "body"
          }
        ]);
      }
    });
  });

  describe('Given invalid credentials', () => {
    describe('Credentials belong to a different user', () => {
      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .post('/api/v1/user/prolific')
          .send({ title: 'title', content: 'Content' })
          .set('Authorization', `Bearer ${badCred}`);
        const response2 = await request(app)
          .post('/api/v1/user/prolific')
          .send({ title: 'title', content: 'Content' })
          .set('Authorization', `Bearer ${adminCred}`);
        expect(response.statusCode).toBe(403);
        expect(response2.statusCode).toBe(403);
      });
    });

    describe('Credentials are not supplied', () => {
      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .post('/api/v1/user/prolific')
          .send({ title: 'title', content: 'Content' });
        expect(response.statusCode).toBe(401);
      })
    })
  })

  describe('Given invalid user', () => {
    // Give 404 because the user doesn't exist
    // or give 401/403 for not having permission for that route
    // Went with 403 since it automatically gives 401 if no cred
    test('Responds with 403 status code', async () => {
      const response = await request(app)
        .post('/api/v1/user/doesnotexist')
        .set('Authorization', `Bearer ${posterCred}`);
      expect(response.statusCode).toBe(403);
    })
  })
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
          expect(post.author).toBeFalsy();
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
          expect(post.author).toBeFalsy();
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
            expect(comment.author).toBeFalsy();
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
            expect(comment.author).toBeFalsy();
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
