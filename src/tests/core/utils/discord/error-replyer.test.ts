import * as assert from "uvu/assert";
import { errorReplyer } from "#src/core/utils/discord.js";
import { suite } from "#src/tests/utils/tests.js";
import { AppError } from "#src/core/errors/app.error.js";

suite("errorReplyer()", (test) => {
  test("should `reply` to interaction if not replyed", async () => {
    const argsReply = [];
    const argsEditReply = [];

    await errorReplyer(
      {
        replied: false,
        reply: (payload: any) => {
          argsReply.push(payload);
        },
        editReply: (payload: any) => {
          argsEditReply.push(payload);
        },
      } as any,
      new Error("foo"),
    );

    assert.is(argsReply.length, 1);
    assert.is(argsEditReply.length, 0);
    assert.equal(argsReply[0], {
      content: `💥 Someting went wrong.`,
      ephemeral: true,
    });
  });

  test("should `editReply` to interaction if replyed already", async () => {
    const argsReply = [];
    const argsEditReply = [];

    await errorReplyer(
      {
        replied: true,
        reply: (payload: any) => {
          argsReply.push(payload);
        },
        editReply: (payload: any) => {
          argsEditReply.push(payload);
        },
      } as any,
      new Error("foo"),
    );

    assert.is(argsReply.length, 0);
    assert.is(argsEditReply.length, 1);
    assert.equal(argsEditReply[0], {
      content: `💥 Someting went wrong.`,
      ephemeral: true,
    });
  });

  test("should send error to user if interaction cannot be replyed", async () => {
    const args = [];

    await errorReplyer(
      {
        user: {
          send: (payload) => {
            args.push(payload);
          },
        },
      } as any,
      new Error("foo"),
    );

    assert.is(args.length, 1);
    assert.equal(args[0], { content: `💥 Someting went wrong.` });
  });

  test("should send the error message if error is instance of `AppError`", async () => {
    const argsReply = [];

    await errorReplyer(
      {
        replied: false,
        reply: (payload: any) => {
          argsReply.push(payload);
        },
      } as any,
      new AppError("foo"),
    );

    assert.is(argsReply.length, 1);
    assert.equal(argsReply[0], {
      content: `💥 foo`,
      ephemeral: true,
    });
  });

  test("should send defaulr error message if error is not a instance of `AppError`", async () => {
    const argsReply = [];

    await errorReplyer(
      {
        replied: false,
        reply: (payload: any) => {
          argsReply.push(payload);
        },
      } as any,
      new Error("foo"),
    );

    assert.is(argsReply.length, 1);
    assert.equal(argsReply[0], {
      content: `💥 Someting went wrong.`,
      ephemeral: true,
    });
  });
}).run();
