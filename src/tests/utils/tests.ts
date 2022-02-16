import { suite as uvuSuite, Test } from "uvu";

export const suite = (message: string, fn: (test: Test) => void) => {
  const innerSuite = uvuSuite(message);

  fn(innerSuite);

  return innerSuite;
};
