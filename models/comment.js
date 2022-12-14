const mongoose = require('mongoose');

const CommentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      maxLength: 10000
    },
    author: {
      type: String,
      require: true
    },
    score: {
      type: Number,
      default: 0
    },
    post_parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    comment_parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
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

module.exports = mongoose.model('Comment', CommentSchema);
