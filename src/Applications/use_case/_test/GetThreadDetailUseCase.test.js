/* eslint-disable max-len */
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const GetThreadUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
    };

    const expectedThread = {
      id: 'thread-123',
      title: 'ini adalah judul thread',
      body: 'ini adalah isi thread',
      date: '2022',
      username: 'dicoding',
    };

    const expectedComments = [
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2022',
        content: 'ini adalah isi komentar',
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(
        {
          id: 'thread-123',
          title: 'ini adalah judul thread',
          body: 'ini adalah isi thread',
          date: '2022',
          username: 'dicoding',
        },
      ));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(
        [
          {
            id: 'comment-123',
            username: 'dicoding',
            date: '2022',
            content: 'ini adalah isi komentar',
          },
        ],
      ));

    const mockGetThreadUseCase = new GetThreadUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    const theThread = await mockGetThreadUseCase.execute(useCasePayload.threadId);

    expect(theThread).toStrictEqual({
      ...expectedThread,
      comments: expectedComments,
    });
    expect(mockThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId);
  });

  it('should not display deleted comment', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
    };

    const expectedThread = {
      id: 'thread-123',
      title: 'ini adalah judul thread',
      body: 'ini adalah isi thread',
      date: '2022',
      username: 'dicoding',
    };

    const expectedComments = [
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2022',
        content: '**komentar telah dihapus**',
        is_deleted: true,
      },
    ];

    const mappedComments = expectedComments.map(({ is_deleted: deletedComment, ...otherProperties }) => otherProperties);
    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedComments));

    const mockGetThreadUseCase = new GetThreadUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const theThread = await mockGetThreadUseCase.execute(useCasePayload.threadId);

    // Assert
    expect(theThread).toStrictEqual({
      ...expectedThread,
      comments: mappedComments,
    });
    expect(mockThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId);
  });
});
