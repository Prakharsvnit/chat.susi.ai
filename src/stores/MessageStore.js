import ChatAppDispatcher from '../dispatcher/ChatAppDispatcher';
import ChatConstants from '../constants/ChatConstants';
import * as ChatMessageUtils from '../utils/ChatMessageUtils';
import { EventEmitter } from 'events';
import ThreadStore from '../stores/ThreadStore';

let ActionTypes = ChatConstants.ActionTypes;
let CHANGE_EVENT = 'change';

let _messages = {};

function _addMessages(rawMessages) {
  rawMessages.forEach(message => {
    if (!_messages[message.id]) {
      _messages[message.id] = ChatMessageUtils.convertRawMessage(
        message,
        ThreadStore.getCurrentID()
      );
    }
  });
}

function _markAllInThreadRead(threadID) {
  for (let id in _messages) {
    if (_messages[id].threadID === threadID) {
      _messages[id].isRead = true;
    }
  }
}

let MessageStore = {
  ...EventEmitter.prototype,

  emitChange() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get(id) {
    return _messages[id];
  },

  getAll() {
    return _messages;

  },

  /**
   * @param {string} threadID
   */
  getAllForThread(threadID) {
    let threadMessages = [];
    for (let id in _messages) {
      if (_messages[id].threadID === threadID) {
        threadMessages.push(_messages[id]);
      }
    }
    threadMessages.sort((a, b) => {
      if (a.date < b.date) {
        return -1;
      } else if (a.date > b.date) {
        return 1;
      }
      return 0;
    });
    return threadMessages;
  },

  getAllForCurrentThread() {
    return this.getAllForThread(ThreadStore.getCurrentID());
  }

};

MessageStore.dispatchToken = ChatAppDispatcher.register(action => {

  switch(action.type) {

    case ActionTypes.CLICK_THREAD:
      ChatAppDispatcher.waitFor([ThreadStore.dispatchToken]);
      _markAllInThreadRead(ThreadStore.getCurrentID());
      MessageStore.emitChange();
      break;

    case ActionTypes.CREATE_MESSAGE: {
      let message = action.message;
      _messages[message.id] = message;
      MessageStore.emitChange();
      break;
    }

    case ActionTypes.RECEIVE_RAW_CREATED_MESSAGE: {
      let { rawMessage, tempMessageID } = action;
      delete _messages[tempMessageID];
      let message = ChatMessageUtils.convertRawMessage(rawMessage);
      console.log(message);
      _messages[message.id] = message;
      MessageStore.emitChange();
      break;
    }
    case ActionTypes.CREATE_SUSI_MESSAGE: {
      let message = action.message;
      _messages[message.id] = message;
      MessageStore.emitChange();
      break;
    }

    case ActionTypes.RECEIVE_SUSI_MESSAGE: {
      let { rawMessage, tempMessageID } = action;
      delete _messages[tempMessageID];
      let message = rawMessage;
      console.log(message);
      _messages[message.id] = message;
      MessageStore.emitChange();
      break;
    }
    default:
      // do nothing
  }

});

export default MessageStore;
