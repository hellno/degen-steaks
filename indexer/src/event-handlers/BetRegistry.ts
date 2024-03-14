import { BetRegistryContract_MarketCreated_handler, BetRegistryContract_MarketCreated_loader } from "../src/Handlers.gen";


BetRegistryContract_MarketCreated_loader(({ event, context }) => {
  context.Market.load(event.params.id.toString(), {});
  context.User.load(event.params.creator);
});


BetRegistryContract_MarketCreated_handler(({ event, context }) => {
  let user = context.User.get(event.params.creator);
  if (user === undefined) {
    user = {
      id: event.params.creator,
    }
    context.User.set(user);
  }

  const market = {
    id: event.params.id.toString(),
    creator_id: user.id,
    startTime: event.blockTimestamp,
    targetPrice: event.params.targetPrice,
    endTime: event.params.endTime,
    totalHigher: 0n,
    totalLower: 0n,
    totalSteakedDegen: 0n,
    totalDegen: undefined,
    endPrice: undefined,

  }
  context.Market.set(market);
})