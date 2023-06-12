const UserTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadTableTestHelper.cleanTable();
    await UserTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      await UserTableTestHelper.addUser({
        username: 'dicoding',
        password: 'secret_password',
      });
      const newThread = new NewThread({
        title: 'Dicoding Indonesia',
        body: 'Dicoding Indonesia adalah platform belajar pemrograman online terbaik di Indonesia',
        user_id: 'user-123',
      });

      const fakeIdGenerator = () => 'test';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const threads = await ThreadTableTestHelper.findThreadsById('thread-test');
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-test',
          title: 'Dicoding Indonesia',
          user_id: 'user-123',
        }),
      );
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      await UserTableTestHelper.addUser({
        username: 'dicoding',
        password: 'secret_password',
      });
      const newThreadPayload = {
        title: 'Dicoding Indonesia',
        body: 'Dicoding Indonesia adalah platform belajar pemrograman online terbaik di Indonesia',
        user_id: 'user-123',
      };
      const newThread = new NewThread(newThreadPayload);

      const fakeIdGenerator = () => 'test';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-test',
          title: 'Dicoding Indonesia',
          user_id: 'user-123',
        }),
      );
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById('falseId')).rejects.toThrowError(NotFoundError);
    });

    it('should return thread correctly', async () => {
      // Arrange
      await UserTableTestHelper.addUser({
        username: 'dicoding',
        password: 'secret_password',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
      await ThreadTableTestHelper.addThread({
        id: 'thread-test',
      });

      // Action
      const thread = await threadRepositoryPostgres.getThreadById('thread-test');

      // Assert
      expect(thread).toEqual(
        expect.objectContaining({
          id: 'thread-test',
          title: 'test title',
          body: 'test body',
          username: 'dicoding',
        }),
      );
      expect(thread.date).toBeInstanceOf(Date);
    });
  });

  describe('verifyAvailableThread function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableThread('falseId')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread found', async () => {
      // Arrange
      await UserTableTestHelper.addUser({
        username: 'dicoding',
        password: 'secret_password',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
      await ThreadTableTestHelper.addThread({ id: 'thread-test' });

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableThread('thread-test')).resolves.not.toThrowError(NotFoundError);
    });
  });
});
