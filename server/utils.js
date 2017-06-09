import { Meteor } from 'meteor/meteor'
import { Memo } from '../imports/api/index.js'

function memoizedHttpGet(url) {
  let memoized = Memo.findOne({key: url})
  if (memoized) {
    return memoized.value
  }
  let content = Meteor.http.get(url).content
  Memo.insert({ key: url, value: content })

  return content
}

export { memoizedHttpGet }