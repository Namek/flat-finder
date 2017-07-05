module.exports = {
  plugins: ['meteor'],
  extends: ['airbnb-base', 'plugin:meteor/recommended'],
  env: {
    browser: true,
    meteor: true,
    es6: true,
  },
  rules: {
    'import/prefer-default-export': 'off',

    // ESLint doesn't like Meteor imports not being in package.json - let's turn it off
    // See: https://github.com/clayne11/eslint-import-resolver-meteor/issues/11#issuecomment-238267628
    'import/no-extraneous-dependencies': 'off',
    // It also cries about imports like meteor/meteor not having an extension
    'import/extensions': ['off', 'never']
  },
  settings: {
    'import/resolver': ['meteor'],
  },
};
