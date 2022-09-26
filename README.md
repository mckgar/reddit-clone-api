<h1>Reddit Clone API</h1>

RESTful api for the server side of a reddit clone

Express, MongoDB

Written using TDD

# api/v1/ (Home Path)
If supplied with credentials, responds with 20 posts that match the specified
ordering from the users subscribbed subreddits and the users they
are following.

If no valid credentials are given, redirects to /all

## GET
`GET http://localhost:3000/api/v1/?start={start}&order={order}&time={time}`

### Parameters
`start` (optional) Number of posts to offset. If posts 21 - 40 are desired then
start should be set to `20`. Defaults to `0`.

`order` (optional) Desired sorting order for returned posts. `hot`, `new`, and 
`top` orderings are available. Defaults to `hot`.

`time` (optional) Only used with `order=top`. Specifies what time period for 
top posts to be gathered from. `all`, `year`, `month`, `week`, `day`, and `hour`
time periods are available. Defaults to `all`.

### Example
`http://localhost:3000/api/v1/?start=21&order=top&time=week`

`
{
  posts: [
    {
      _id: 8965432181981651,
      title: 'This is a sample post',
      author: 'xX_EpIc_GaMeR_Xx',
      score: 2718,
      user_post: false,
      subreddit: 'samplesub',
      date_posted: 2022-09-05T22:23:10.217Z
    },
    {
      _id: 5121618156,
      title: 'This is a user post',
      author: 'random_user',
      score: 1337,
      user_post: true,
      date_posted: 2022-09-05T22:23:10.217Z
    }
  ]
}
`

# api/v1/all

Responds with 20 posts that match the specified ordering from all subreddits.

See home path for API call

# api/v1/login

If supplied with valid username and password it will respond with JWT to be used
in Authorization header.

## POST

`POST http://localhost:3000/api/v1/login`

### Body

`username` (required) Account username

`password` (required) Account password

### Example Response

`
{
  token: [insert_token_here]
}
`

# api/v1/User

## POST

`POST http://localhost:3000/api/v1/user`

Used for creating a new user profile

### Body

`username` (required) Account username

`password` (required) Account password

# api/v1/user/:username

## GET

`GET http://localhost:3000/api/v1/user/:username`

Used to retrieve user profile information and the users posts and comments.

### Parameters

`username` (required) Username

### Response example

`GET http://localhost:3000/api/v1/user/test_user`

`{
  username: 'test_user',
  post_score: 200,
  comment_score: 100,
  admin: false,
  moderator: ['test_sub', 'another_sub'],
  posts: [
    {
      _id: {insert_post_id_here},
      title: 'Test Post',
      content: 'Test post content',
      author: 'test_user',
      score: 200,
      user_post: false,
      subreddit: 'test_sub',
      date_posted: 2022-09-05T22:23:10.217Z,
      date_edited: 2022-09-05T22:23:10.217Z
    }
  ],
  comments: [
    {
      _id: {insert_comment_id_here},
      content: 'test comment content',
      author: 'test_user',
      score: 100,
      post_parent: {insert_post_id_here},
      date_posted: 2022-09-05T22:23:10.217Z,
      date_edited: 2022-09-05T22:23:10.217Z
    }
  ]
}`

## PUT

`PUT http://localhost:3000/api/v1/user/test_user`

Updates user profile information.

Requires authorization from either the user or an admin.

Responds with 200 status code if successful.

### Body

`email` (optional) Add or changes email linked to account. Requires users authorization.

`password` (optional) Change users password. Requires users authorization.

`admin` (optional) Changes admin privleges. Requires admin authorization to change.

`subscribe` (optional) Adds subreddit to users subscriptions. Requires users authorization.

`follow` (optional) Adds user to users following. Requires users authorization.

## DELETE

`DELETE http://localhost:3000/api/v1/user/test_user`

Deletes users profile information. Only the username will remain to prevent username from being taken by another user.

Requires authorization from the user or admin. 

Responds with 200 status code if successful.

## POST

`POST http://localhost:3000/api/v1/user/test_user`

Posts a user post to the users profile.

Requires authorization from the user.

Responds with 201 status code and post_id if successful.

### Body

`title` (required) Title for post. Max length of 300 characters.

`content` (optional) Post content. Max length of 10000 characters.

# api/v1/user/:username/:postid

## GET

`GET http://localhost:3000/api/v1/user/test_user/{post_id}`

Retrieves post that was posted to users profile along with its comments. Also returns user profile information.

Not available if user has been deleted/banned.

### Example

`GET http://localhost:3000/api/v1/user/test_user/{post_id}`

`
{
  user: {
    username: 'test_user',
    post_score: 200,
    comment_score: 100,
    admin: false,
    moderator: ['test_sub', 'another_sub']
  },
  post: {
    title: 'Test Post',
    content: 'Test post content',
    author: 'test_user',
    score: 200,
    user_post: false,
    subreddit: 'test_sub',
    date_posted: 2022-09-05T22:23:10.217Z,
    date_edited: 2022-09-05T22:23:10.217Z
  },
  comments: [
    {
      _id: {insert_comment_id_here},
      content: 'test comment content',
      author: 'test_user',
      score: 100,
      post_parent: {insert_post_id_here},
      date_posted: 2022-09-05T22:23:10.217Z,
      date_edited: 2022-09-05T22:23:10.217Z
    }
  ]
}
`

## POST

`POST http://localhost:3000/api/v1/user/test_user/{post_id}`

Add comment to post.

Any users authorization required.

Responds with 201 status code if successful

### Body

`content` (required) Comment content. Max length 10000 characters

## PUT

`PUT http://localhost:3000/api/v1/user/test_user/{post_id}`

Can update post content. User or admin authorization required.

Can upvote or downvote post. Any user authorization required.

Responds with 200 status code if successful.

### Body

`content` (optional) New content for post.

`vote` (optional) Can take values `upvote` and `downvote`.

## DELETE

`DELETE http://localhost:3000/api/v1/user/test_user/{post_id}`

Deletes post information. Requires user (original poster) or admin authorization.

If user deletes post, title and content are replaced by '[Deleted by user]', author is replaced by '[Deleted]'.

If admin deletes post, title and content are replaced by '[Removed by admin]', author is replaced by '[Removed]'.

Responds with 200 status code if successful.

# api/v1/user/:username/:postid/:commentid

## POST

`POST http://localhost:3000/api/v1/user/test_user/{post_id}/{comment_id}`

Adds comment to post as the child of another comment.

Responds with 201 status code if successful.

## Body

See POST api/v1/user/:username/:postid

## PUT

`PUT http://localhost:3000/api/v1/user/test_user/{post_id}/{comment_id}`

Can update comment content. Requires original commenters or admins authorization.

Can vote on comment. Requires any user authorization.

## Body

`content` (optional) New content for comment. Max length 10000 characters

`vote` (optional) Can take value `upvote` and `downvote`

## DELETE

`DELETE http://localhost:3000/api/v1/user/test_user/{post_id}/{comment_id}`

Deletes comment information. Requires orignal commenters, the user whose profile is commented on, or admins authorization.

If done by original commenter, content and author are replaced by '[Deleted]'.

Otherwise content and author are replaced by '[Removed]'.

Responds with 200 status code if successful.

# api/v1/r

## POST

`POST http://localhost:3000/api/v1/r`

Creates new subreddit.

Requires any users authorization.

Responds 201 status code if successful.

### Body

`subreddit` (required) Name for subreddit. Must be unique. Max length 20 characters

# api/v1/r/:subreddit

## GET

`GET http://localhost:3000/api/v1/r/test_sub`

Responds with subreddit info and the subreddits posts.

If the subreddit has been banned then it only returns the ban date and tag confirming it has been banned.

### Example (not banned)

`GET http://localhost:3000/api/v1/r/test_sub`

Response:

`
{
  info: {
    banned: false,
    description: 'This is the subreddit description',
    creator: 'Test_User',
    date_created: 2022-09-05T22:23:10.217Z,
    subscribers: 18,
    moderators: ['test_user']
  },
  posts: [
    {
      _id: 87954321,
      title: 'Test post',
      content: 'Test content',
      author: 'some_user',
      score: 23,
      user_post: false,
      subreddit: test_sub,
      date_posted: 2022-09-05T22:23:10.217Z,
      date_edited: 2022-09-05T22:23:10.217Z
    }
  ]
}
`

### Example (banned)

`GET http://localhost:3000/api/v1/r/banned_sub`

`
{
  info: {
    banned: true,
    date_banned: 2022-09-05T22:23:10.217Z
  }
}
`

## POST

`POST http://localhost:3000/api/v1/r/test_sub`

Creates a new post in the subreddit. Requires any users authorization that has not been banned by the subreddit.

Responds with 201 status code and post_id if successful.

### Body

See POST /api/v1/user/:username

## PUT

`PUT http://localhost:3000/api/v1/r/test_sub`

Can update subreddit information or add/remove moderators.

Requires moderator or admin credentials.

Responds with 200 status code if successful.

### Body

`description` (optional) Subreddit description. Max length 10000 characters

`addModerator` (optional) Adds moderator to subreddit. Requires valid username.

`removeModerator` (optional) Removes moderator from subreddit. Requires valid username.

`ban` (optional) Bans or unbans the subreddit. Requires admin credentials.

# api/v1/r/:subreddit/:postid

## GET

`GET http://localhost:3000/api/v1/r/test_sub/{post_id}`

Responds with post from the subreddit and subreddit info.

See `GET /api/v1/user/:username/:postid` for more.

## POST

`POST http://localhost:3000/api/v1/r/test_sub/{post_id}`

Creates a comment for a post.

Requires any (unbanned) users credentials.

Responds with 201 status code if successful.

See `POST /api/v1/user/:username/:postid` for more.

## PUT

`PUT http://localhost:3000/api/v1/r/test_sub/{post_id}`

Can update post info or vote on post.

See `PUT /api/v1/user/:username/:postid` for more.

## DELETE

`Delete http://localhost:3000/api/v1/r/test_sub/{post_id}`

Deletes post info.

Requires original posters, admins, or moderators authorization.

See `DELETE /api/v1/user/:username/:postid` for more.

# api/v1/r/:subreddit/:postid/:commentid

## POST

See `POST /api/v1/user/:username/:postid/:commentid` for more.

## PUT

See `PUT /api/v1/user/:username/:postid/:commentid` for more.

## DELETE

Requires original commentors, admins, or moderators authorization.

See `DELETE /api/v1/user/:username/:postid/:commentid` for more.