// RuleTester wired to node:test (ADR 0015). Import `RuleTester` from here in rule specs.
import { RuleTester } from '@typescript-eslint/rule-tester';
import { after, describe, it } from 'node:test';

// node:test's describe() and it() return promises that its runner awaits; RuleTester expects void.
RuleTester.afterAll = after;
RuleTester.describe = (name, callback) => {
  void describe(name, callback);
};
RuleTester.it = (name, callback) => {
  void it(name, callback);
};
RuleTester.itOnly = (name, callback) => {
  void it.only(name, callback);
};

export { RuleTester };
