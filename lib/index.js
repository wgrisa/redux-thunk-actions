'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createActionThunk = createActionThunk;

var _reduxActions = require('redux-actions');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Creates an async action creator
 *
 * @param {String} type the type of the action
 * @param {Function} asyncFunction the function to be called async
 * @return {Function} the action creator
 */
function createActionThunk(type, asyncFunction) {
  var _actionCreators;

  var TYPE_STARTED = type + '_STARTED';
  var TYPE_SUCCEEDED = type + '_SUCCEEDED';
  var TYPE_FAILED = type + '_FAILED';
  var TYPE_ENDED = type + '_ENDED';

  var actionCreators = (_actionCreators = {}, _defineProperty(_actionCreators, TYPE_STARTED, (0, _reduxActions.createAction)(TYPE_STARTED)), _defineProperty(_actionCreators, TYPE_SUCCEEDED, (0, _reduxActions.createAction)(TYPE_SUCCEEDED)), _defineProperty(_actionCreators, TYPE_FAILED, (0, _reduxActions.createAction)(TYPE_FAILED)), _defineProperty(_actionCreators, TYPE_ENDED, (0, _reduxActions.createAction)(TYPE_ENDED)), _actionCreators);

  var successActionWithMeta = (0, _reduxActions.createAction)(TYPE_SUCCEEDED, function (_ref) {
    var payload = _ref.payload;
    return payload;
  }, function (_ref2) {
    var meta = _ref2.meta;
    return meta;
  });

  var factory = function factory() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return function (dispatch, getState, extra) {
      var result = void 0;
      var startedAt = new Date().getTime();

      dispatch(actionCreators[TYPE_STARTED](args));

      var succeeded = function succeeded(data) {
        var successAction = data && data.payload ? successActionWithMeta(data) : actionCreators[TYPE_SUCCEEDED](data);

        dispatch(successAction);

        var endedAt = new Date().getTime();
        dispatch(actionCreators[TYPE_ENDED]({
          elapsed: endedAt - startedAt
        }));
        return data;
      };

      var failed = function failed(error) {
        var endedAt = new Date().getTime();

        dispatch(actionCreators[TYPE_FAILED](error.response ? error.response.data : error));

        dispatch(actionCreators[TYPE_ENDED]({
          elapsed: endedAt - startedAt
        }));
      };

      try {
        result = asyncFunction.apply(undefined, args.concat([{ getState: getState, dispatch: dispatch, extra: extra }]));
      } catch (error) {
        failed(error);
      }

      if (isPromise(result)) {
        return result.then(succeeded, failed);
      }

      return succeeded(result);
    };
  };

  factory.NAME = type;
  factory.STARTED = actionCreators[TYPE_STARTED].toString();
  factory.SUCCEEDED = actionCreators[TYPE_SUCCEEDED].toString();
  factory.FAILED = actionCreators[TYPE_FAILED].toString();
  factory.ENDED = actionCreators[TYPE_ENDED].toString();

  return factory;
}

function isPromise(object) {
  return object && object.then && object.catch;
}