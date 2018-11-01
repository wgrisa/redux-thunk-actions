import { createAction } from 'redux-actions'

/**
 * Creates an async action creator
 *
 * @param {String} type the type of the action
 * @param {Function} asyncFunction the function to be called async
 * @return {Function} the action creator
 */
export function createActionThunk(type, asyncFunction) {
  const TYPE_START = `${type}_STARTED`
  const TYPE_SUCCEEDED = `${type}_SUCCEEDED`
  const TYPE_FAILED = `${type}_FAILED`
  const TYPE_ENDED = `${type}_ENDED`

  const actionCreators = {
    [TYPE_START]: createAction(TYPE_START),
    [TYPE_SUCCEEDED]: createAction(TYPE_SUCCEEDED),
    [TYPE_FAILED]: createAction(TYPE_FAILED),
    [TYPE_ENDED]: createAction(TYPE_ENDED),
  }

  const successActionWithMeta = createAction(TYPE_SUCCEEDED, ({ payload }) => payload, ({ meta }) => meta)

  const factory = (...args) => (dispatch, getState, extra) => {
    let result
    let startedAt = new Date().getTime()

    dispatch(actionCreators[TYPE_START](args))

    const succeeded = (data) => {
      const successAction = data && data.payload ? successActionWithMeta(data) : actionCreators[TYPE_SUCCEEDED](data)

      dispatch(successAction)

      let endedAt = new Date().getTime()
      dispatch(
        actionCreators[TYPE_ENDED]({
          elapsed: endedAt - startedAt,
        }),
      )
      return data
    }

    const failed = (error) => {
      let endedAt = new Date().getTime()

      dispatch(actionCreators[TYPE_FAILED](error.response ? error.response.data : error))

      dispatch(
        actionCreators[TYPE_ENDED]({
          elapsed: endedAt - startedAt,
        }),
      )
    }

    try {
      result = asyncFunction(...args, { getState, dispatch, extra })
    } catch (error) {
      failed(error)
    }

    if (isPromise(result)) {
      return result.then(succeeded, failed)
    }

    return succeeded(result)
  }

  factory.NAME = type
  factory.START = actionCreators[TYPE_START].toString()
  factory.SUCCEEDED = actionCreators[TYPE_SUCCEEDED].toString()
  factory.FAILED = actionCreators[TYPE_FAILED].toString()
  factory.ENDED = actionCreators[TYPE_ENDED].toString()

  return factory
}

function isPromise(object) {
  return object && object.then && object.catch
}
