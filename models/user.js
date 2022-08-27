const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      maxLength: 20
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    post_score: {
      type: Number,
      default: 0
    },
    comment_score: {
      type: Number,
      default: 0
    },
    date_joined: {
      type: Date,
      default: Date.now
    },
    admin: {
      type: Boolean,
      default: false
    },
    moderator: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subreddit'
    }],
    subscriptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subreddit'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    blocked: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    upvoted_posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    upvoted_comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    downvoted_posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    downvoted_comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    chats: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }]
  }
);

module.exports = mongoose.model('User', UserSchema);
