class NewComment {
  constructor(payload) {
    this._verifyPayload(payload);
    const { content, threadId, user_id } = payload;
    this.content = content;
    this.threadId = threadId;
    this.user_id = user_id;
  }

  _verifyPayload(payload) {
    const { content, threadId, user_id } = payload;
    if (!content || !threadId || !user_id) {
      throw new Error('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }
    if (
      typeof content !== 'string'
          || typeof threadId !== 'string'
          || typeof user_id !== 'string'
    ) {
      throw new Error('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = NewComment;
