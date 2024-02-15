const pool = require('../../database/postgres/pool');
const container = require('../../container');
const createServer = require('../createServer');
const LoginHelper = require('../../../../tests/LoginHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

describe('end point add comment', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({});
  });
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 404 when thread not found', async () => {
      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });

      await ThreadTableTestHelper.addThread({ user_id: userId });

      const response = await server.inject({
        method: 'POST',
        url: '/threads/xxx/comments',
        payload: {
          content: 'somekind of comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 401 when request not contain access token', async () => {
      const server = await createServer(container);
      const threadId = 'thread-123';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: 'user-123' });

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'somekind of comment',
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });
      const threadId = 'thread-123';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: '',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual(
        'tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 201 and persisted thread', async () => {
      const requestPayload = {
        content: 'somekind of comment',
      };

      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });
      const threadId = 'thread-123';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data).toBeDefined();
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.id).toBeDefined();
      expect(responseJson.data.addedComment.content).toBeDefined();
      expect(responseJson.data.addedComment.owner).toBeDefined();
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 401 when request not contain access token', async () => {
      const server = await createServer(container);
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const { userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, user_id: 'user-123' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, user_id: userId });

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/thread-not-found/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Komentar pada thread ini tidak ditemukan');
    });

    it('should response 403 when user is not owner', async () => {
      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const userId2 = 'user-1234';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });
      await UsersTableTestHelper.addUser({ id: userId2, username: 'test-user' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, user_id: userId2 });

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Anda tidak berhak mengakses resource ini');
    });

    it('should response 200 and delete comment', async () => {
      const server = await createServer(container);

      const { accessToken, userId } = await LoginHelper
        .getAccessTokenAndUserIdHelper({ server });
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      await ThreadTableTestHelper.addThread({ id: threadId, user_id: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, user_id: userId });

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
