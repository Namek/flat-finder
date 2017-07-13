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
    'space-before-function-paren': ['error', 'always'],
    'no-underscore-dangle': 'off',
    'no-script-url': 'off',
    'semi': ['error', 'always'],
    'brace-style': ['error', '1tbs'],
    'object-shorthand': 'off',

    // ESLint doesn't like Meteor imports not being in package.json - let's turn it off
    // See: https://github.com/clayne11/eslint-import-resolver-meteor/issues/11#issuecomment-238267628
    'import/no-extraneous-dependencies': 'off',
    // It also cries about imports like meteor/meteor not having an extension
    'import/extensions': ['off', 'never']
  },
  settings: {
    'import/resolver': ['meteor'],
  },
  globals: {
    'AppServices': true,
  },
};
