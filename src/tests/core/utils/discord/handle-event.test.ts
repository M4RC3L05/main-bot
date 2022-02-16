import * as assert from "uvu/assert";
import { suite } from "#src/tests/utils/tests.js";
import { handleEvent } from "#src/core/utils/discord.js";
import { AppError } from "#src/core/errors/app.error.js";

suite("handleEvent()", (test) => {
  test("should throw a `AppError` if it cannot find a suitable handler", async () => {
    try {
      await handleEvent()();
      assert.unreachable("Should have thrown");
    } catch (error: unknown) {
      assert.instance(error, AppError);
    }
  });

  test("should break on the first matching handler", async () => {
    const args = [];

    await handleEvent(
      {
        type: "foo",
        handle: async () => {
          args.push("foo");

          return Promise.resolve();
        },
      },
      {
        type: "foo",
        handle: async () => {
          args.push("bar");

          return Promise.resolve(true);
        },
      },
      {
        type: "foo",
        handle: async () => {
          args.push("biz");

          return Promise.resolve(true);
        },
      },
    )();

    assert.is(args.length, 2);
    assert.is(args[0], "foo");
    assert.is(args[1], "bar");
  });
}).run();
