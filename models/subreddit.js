const mongoose = require('mongoose');

const SubredditSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      maxLength: 20
    },
    description: {
      type: String,
      maxLength: 10000
    },
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    creator: {
      type: String,
      maxLength: 20
    },
    date_created: {
      type: Date,
      default: Date.now
    },
    date_banned: {
      type: Date
    },
    subscribers: [{
      type: String,
      maxLength: 20
    }],
    moderators: [{
      type: String,
      maxLength: 20
    }],
    banned_users: [{
      type: String,
      maxLength: 20
    }],
    banned: {
      type: Boolean,
      default: false
    }
  }
);

module.exports = mongoose.model('Subreddit', SubredditSchema);
