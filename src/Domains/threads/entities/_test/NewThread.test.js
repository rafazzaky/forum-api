const NewThread = require('../NewThread');

describe('a NewThread entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      title: 'title',
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      title: 'title',
      body: 1234,
      user_id: 'user-123',
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewThread entities correctly', () => {
    const payload = {
      title: 'title',
      body: 'body',
      user_id: 'user-123',
    };

    const newThread = new NewThread(payload);

    expect(newThread).toBeInstanceOf(NewThread);
    expect(newThread.title).toEqual(payload.title);
    expect(newThread.body).toEqual(payload.body);
    expect(newThread.user_id).toEqual(payload.user_id);
  });
});
