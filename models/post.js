const mongoose = require('mongoose');

const PostSchema = mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      maxLength: 300
    },
    content: {
      type: String,
      maxLength: 10000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    user_post: {
      type: Boolean,
      require: true
    },
    subreddit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subreddit'
    },
    date_posted: {
      type: Date,
      default: Date.now
    },
    date_edited: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model('Post', PostSchema);
