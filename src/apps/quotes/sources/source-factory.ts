import { QuoteCommandSource } from "#src/apps/quotes/commands.js";
import { TheOfficeSource } from "#src/apps/quotes/sources/impl/the-office.source.js";
import { QuoteSource } from "#src/apps/quotes/sources/quote-source.js";
import { loggerFactory } from "#src/core/clients/logger.js";
import { AppError } from "#src/core/errors/app.error.js";

const logger = loggerFactory("quote-source-factory");

export const sourceFactory = async (
  source: QuoteCommandSource,
): Promise<QuoteSource> => {
  logger.info({ source }, "Resolving source");

  switch (source) {
    case QuoteCommandSource.THE_OFFICE: {
      const toSource = new TheOfficeSource();
      await toSource.init();

      return toSource;
    }

    default: {
      throw new AppError(`Invalid quote source: "${source as string}"`);
    }
  }
};
