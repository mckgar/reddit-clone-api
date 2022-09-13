const request = require('supertest');
const User = require('../models/user');
const Subreddit = require('../models/subreddit');
const Post = require('../models/post');
const jwt = require('jsonwebtoken');

const app = require('../app');

let userCred;

beforeAll(async () => {
  try {
    await new User(
      {
        username: 'tester1',
        password: 'password'
      }
    ).save();
    userCred = jwt.sign({ username: 'tester1' }, process.env.JWT_SECRET);
    await User.findOneAndUpdate(
      { username: 'tester1' },
      { $push: { subscriptions: ['sub1', 'sub2'] } }
    );
    await User.findOneAndUpdate(
      { username: 'tester1' },
      { $push: { following: 'other' } }
    );

    await new User(
      {
        username: 'prolific',
        password: 'password'
      }
    ).save();

    await new User(
      {
        username: 'other',
        password: 'password'
      }
    ).save();

    // Create subreddits
    await new Subreddit(
      {
        name: 'sub1',
        creator: 'powermod',
        description: 'This is the first subreddit'
      }
    ).save();

    await new Subreddit(
      {
        name: 'sub2',
        creator: 'powermod',
        description: 'This is the second subreddit'
      }
    ).save();

    await new Subreddit(
      {
        name: 'sub3',
        creator: 'powermod',
        description: 'This is the third subreddit'
      }
    ).save();

    // Creating posts
    const post1 = await new Post(
      {
        title: 'First Post',
        content: 'First post content',
        author: 'prolific',
        subreddit: 'sub1',
        user_post: false,
        score: -17
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub1' },
      { $push: { posts: post1._id } }
    );

    const post2 = await new Post(
      {
        title: 'Second Post',
        content: 'Second post content',
        author: 'prolific',
        subreddit: 'sub1',
        user_post: false,
        date_posted: new Date(Date.now() - 3605000),
        score: 25843
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub1' },
      { $push: { posts: post2._id } }
    );

    const post3 = await new Post(
      {
        title: 'Third Post',
        content: 'Third post content',
        author: 'prolific',
        subreddit: 'sub1',
        user_post: false,
        date_posted: new Date(Date.now() - 86405000),
        score: 9718
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub1' },
      { $push: { posts: post3._id } }
    );

    const post4 = await new Post(
      {
        title: 'Fourth Post',
        content: 'Fourth post content',
        author: 'prolific',
        subreddit: 'sub2',
        user_post: false,
        date_posted: new Date(Date.now() - 604805000),
        score: 25403
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub2' },
      { $push: { posts: post4._id } }
    );

    const post5 = await new Post(
      {
        title: 'Fifth Post',
        content: 'Fifth post content',
        author: 'prolific',
        subreddit: 'sub2',
        user_post: false,
        date_posted: new Date(Date.now() - 2678405000),
        score: 802
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub2' },
      { $push: { posts: post5._id } }
    );

    const post6 = await new Post(
      {
        title: 'Sixth Post',
        content: 'I see deleted users',
        author: 'prolific',
        subreddit: 'sub2',
        user_post: false,
        date_posted: new Date(Date.now() - 31557605000),
        score: 1999
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub2' },
      { $push: { posts: post6._id } }
    );

    const post7 = await new Post(
      {
        title: 'Seventh Post',
        content: 'Logged into bungie',
        author: 'prolific',
        subreddit: 'sub3',
        user_post: false,
        date_posted: new Date('July 7 2007'),
        score: 117
      }
    ).save();
    await Subreddit.findOneAndUpdate(
      { name: 'sub3' },
      { $push: { posts: post7._id } }
    );

    const post8 = await new Post(
      {
        title: 'Eighth Post',
        content: 'No subs on sub3',
        author: 'other',
        user_post: true,
        score: 23
      }
    ).save();
    await User.findOneAndUpdate(
      { username: 'other' },
      { $push: { posts: post8._id } }
    );
  } catch (err) {
    console.log(err);
  }
});

describe('GET /', () => {
  describe('User is logged in', () => {
    test('Responds with 200 status code', async () => {
      const response = await request(app)
        .get('/api/v1?order=new')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.statusCode).toBe(200);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.headers['content-type'])
        .toEqual(expect.stringContaining('json'));
    });

    test('Responds with posts', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.body.posts).toBeDefined();
    });

    test('Responds only with posts from subscriptions and followings', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.body.posts.length).toBe(7);
      for (const post of response.body.posts) {
        if (!post.user_post) {
          expect(post.subreddit !== 'sub3').toBeTruthy();
        } else {
          expect(post.author === 'other')
        }
      }
    });

    test('Hot sorts posts correctly', async () => {
      const response = await request(app)
        .get('/api/v1')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.body.posts[0].title).toEqual('Eighth Post');
      expect(response.body.posts[1].title).toEqual('Second Post');
      expect(response.body.posts[2].title).toEqual('Third Post');
      expect(response.body.posts[3].title).toEqual('Fourth Post');
      expect(response.body.posts[4].title).toEqual('Fifth Post');
      expect(response.body.posts[5].title).toEqual('Sixth Post');
      expect(response.body.posts[6].title).toEqual('First Post');
    });

    test('New sorts posts correctly', async () => {
      const response = await request(app)
        .get('/api/v1?order=new')
        .set('Authorization', `Bearer ${userCred}`);
      expect(response.body.posts[0].title).toEqual('Eighth Post');
      expect(response.body.posts[1].title).toEqual('First Post');
      expect(response.body.posts[2].title).toEqual('Second Post');
      expect(response.body.posts[3].title).toEqual('Third Post');
      expect(response.body.posts[4].title).toEqual('Fourth Post');
      expect(response.body.posts[5].title).toEqual('Fifth Post');
      expect(response.body.posts[6].title).toEqual('Sixth Post');
    });

    test('Top sorts posts correctly', async () => {
      const data = [
        { uri: '/api/v1?order=top&time=hour', size: 2 },
        { uri: '/api/v1?order=top&time=day', size: 3 },
        { uri: '/api/v1?order=top&time=week', size: 4 },
        { uri: '/api/v1?order=top&time=month', size: 5 },
        { uri: '/api/v1?order=top&time=year', size: 6 },
        { uri: '/api/v1?order=top', size: 7 },
      ];
      for (const info of data) {
        const response = await request(app)
          .get(info.uri)
          .set('Authorization', `Bearer ${userCred}`);
        expect(response.body.posts.length).toBe(info.size);
        for (let i = 0; i < response.body.posts - 1; i++) {
          expect(response.body.posts[i].score >= response.body.posts[i + 1].score).toBeTruthy();
        }
      }
    });
  });

  describe('User is not logged in', () => {
    test('Responds with 302 status code', async () => {
      const response = await request(app)
        .get('/api/v1');
      expect(response.statusCode).toBe(302);
    });
  });
});

describe('GET /all', () => {
  test('Responds with 200 status code', async () => {
    const response = await request(app)
      .get('/api/v1/all');
    expect(response.statusCode).toBe(200);
  });

  test('Responds with json in content-type header', async () => {
    const response = await request(app)
      .get('/api/v1/all');
    expect(response.headers['content-type'])
      .toEqual(expect.stringContaining('json'));
  });

  test('Responds with posts', async () => {
    const response = await request(app)
      .get('/api/v1/all')
    expect(response.body.posts).toBeDefined();
  });

  test('Responds only with subreddit posts', async () => {
    const response = await request(app)
      .get('/api/v1/all');
    expect(response.body.posts.length).toBe(7);
    for (const post of response.body.posts) {
      expect(post.user_post).toBeFalsy();
    }
  });

  test('Hot sorts posts correctly', async () => {
    const response = await request(app)
      .get('/api/v1/all');
    expect(response.body.posts[0].title).toEqual('Second Post');
    expect(response.body.posts[1].title).toEqual('Third Post');
    expect(response.body.posts[2].title).toEqual('Fourth Post');
    expect(response.body.posts[3].title).toEqual('Fifth Post');
    expect(response.body.posts[4].title).toEqual('Sixth Post');
    expect(response.body.posts[5].title).toEqual('Seventh Post');
    expect(response.body.posts[6].title).toEqual('First Post');
  });

  test('New sorts posts correctly', async () => {
    const response = await request(app)
      .get('/api/v1/all?order=new');
    expect(response.body.posts[0].title).toEqual('First Post');
    expect(response.body.posts[1].title).toEqual('Second Post');
    expect(response.body.posts[2].title).toEqual('Third Post');
    expect(response.body.posts[3].title).toEqual('Fourth Post');
    expect(response.body.posts[4].title).toEqual('Fifth Post');
    expect(response.body.posts[5].title).toEqual('Sixth Post');
    expect(response.body.posts[6].title).toEqual('Seventh Post');
  });

  test('Top sorts posts correctly', async () => {
    const data = [
      { uri: '/api/v1/all?order=top&time=hour', size: 1 },
      { uri: '/api/v1/all?order=top&time=day', size: 2 },
      { uri: '/api/v1/all?order=top&time=week', size: 3 },
      { uri: '/api/v1/all?order=top&time=month', size: 4 },
      { uri: '/api/v1/all?order=top&time=year', size: 5 },
      { uri: '/api/v1/all?order=top', size: 7 },
    ];
    for (const info of data) {
      const response = await request(app)
        .get(info.uri);
      expect(response.body.posts.length).toBe(info.size);
      for (let i = 0; i < response.body.posts - 1; i++) {
        expect(response.body.posts[i].score >= response.body.posts[i + 1].score).toBeTruthy();
      }
    }
  });
})

afterAll(async () => {
  await require('../mongoConfigTesting').closeServer();
});
