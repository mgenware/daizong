module.exports = {
  clean: {
    cmd: ['del-cli dist', 'del-cli dist_tests'],
  },
  lint: {
    cmd: 'eslint --max-warnings 0 --ext .ts src/ tests/',
  },
  dev: {
    cmd: ['#clean', 'tsc -b tests -w'],
  },
  t: {
    cmd: 'mocha --require source-map-support/register dist_tests/**/*.test.js',
  },
};
