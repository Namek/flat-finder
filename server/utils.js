import { Meteor } from 'meteor/meteor';
import { Memo } from '../imports/api/index.js';

function memoizedHttpGet(url) {
  const memoized = Memo.findOne({ key: url });
  if (memoized) {
    return memoized.value;
  }
  const content = Meteor.http.get(url).content;
  Memo.insert({ key: url, value: content });

  return content;
}

export { memoizedHttpGet };
