import { QuoteCommandSource } from "#src/apps/quotes/commands";
import { TheOfficeSource } from "#src/apps/quotes/sources/impl/the-office.source";
import { QuoteSource } from "#src/apps/quotes/sources/quote-source";
import { loggerFactory } from "#src/core/clients/logger";
import { AppError } from "#src/core/errors/app.error";

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
