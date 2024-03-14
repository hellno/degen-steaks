import { BetRegistryContract_MarketCreated_loader } from "../src/Handlers.gen";


BetRegistryContract_MarketCreated_loader(({ event, context }) => {
  context.Market.load(event.params.id.toString(), {});
  context.User.load(event.params.creator);
});

