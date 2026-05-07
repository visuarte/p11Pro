const { sum } = require('./sum');

describe('sum', () => {
  test('adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
