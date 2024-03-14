import {
  BetRegistryContract_BetPlaced_handler,
  BetRegistryContract_BetPlaced_loader,
  BetRegistryContract_MarketCreated_handler,
  BetRegistryContract_MarketCreated_loader,
  BetRegistryContract_MarketResolved_handler,
  BetRegistryContract_MarketResolved_loader,
} from "../src/Handlers.gen";

BetRegistryContract_MarketCreated_loader(({ event, context }) => {
  context.Market.load(event.params.id.toString(), {});
  context.User.load(event.params.creator);
});

BetRegistryContract_MarketCreated_handler(({ event, context }) => {
  let user = context.User.get(event.params.creator);
  if (user === undefined) {
    user = {
      id: event.params.creator,
      creatorFeeReceived: 0n,
    };
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
    degenCollected: 0n,
    betCount: 0,
    isResolved: false,
    totalDegen: undefined,
    endPrice: undefined,
    creatorFee: undefined,
  };
  context.Market.set(market);
});

BetRegistryContract_BetPlaced_loader(({ event, context }) => {
  context.Market.load(event.params.marketId.toString(), {});
  context.User.load(event.params.user);
  context.Bet.load(
    event.params.marketId.toString() + "-" + event.params.user,
    {}
  );
});

BetRegistryContract_BetPlaced_handler(({ event, context }) => {
  let user = context.User.get(event.params.user);
  if (user === undefined) {
    user = {
      id: event.params.user,
      creatorFeeReceived: 0n,
    };
    context.User.set(user);
  }

  let market = context.Market.get(event.params.marketId.toString());
  if (market === undefined) {
    context.log.error(
      "BetRegistry::BetPlaced: Market not found: " +
        event.params.marketId.toString()
    );
    return;
  }

  let bet = context.Bet.get(
    event.params.marketId.toString() + "-" + event.params.user
  );
  if (bet === undefined) {
    bet = {
      id: event.params.marketId.toString() + "-" + event.params.user,
      market_id: event.params.marketId.toString(),
      user_id: user.id,
      sharesHigher: 0n,
      sharesLower: 0n,
    };
  }

  market = {
    ...market,
    totalSteakedDegen:
      market.totalSteakedDegen + event.params.steaks + event.params.feeSteaks,
    betCount: market.betCount + 1,
    degenCollected: market.degenCollected + event.params.degen,
  };

  if (event.params.direction === 0n) {
    // BetDirection is HIGHER
    market = {
      ...market,
      totalHigher: market.totalHigher + event.params.betShares,
    };

    bet = {
      ...bet,
      sharesHigher: bet.sharesHigher + event.params.betShares,
    };
  } else {
    // BetDirection is LOWER
    market = {
      ...market,
      totalLower: market.totalLower + event.params.betShares,
    };

    bet = {
      ...bet,
      sharesLower: bet.sharesLower + event.params.betShares,
    };
  }

  context.Market.set(market);
  context.Bet.set(bet);

  const PlacedBet = {
    id:
      event.params.marketId.toString() +
      "-" +
      event.params.user +
      "-" +
      event.transactionHash,
    user_id: user.id,
    bet_id: bet.id,
    market_id: market.id,
    betShares: event.params.betShares,
    direction: event.params.direction,
    degen: event.params.degen,
    steaks: event.params.steaks,
    feeSteaks: event.params.feeSteaks,
  };

  context.PlacedBet.set(PlacedBet);
});

BetRegistryContract_MarketResolved_loader(({ event, context }) => {
  context.Market.load(event.params.marketId.toString(), {
    loaders: { loadCreator: true },
  });
});

BetRegistryContract_MarketResolved_handler(({ event, context }) => {
  let market = context.Market.get(event.params.marketId.toString());
  if (market === undefined) {
    context.log.error(
      "BetRegistry::MarketResolved: Market not found: " +
        event.params.marketId.toString()
    );
    return;
  }

  let user = context.Market.getCreator(market);
  if (user === undefined) {
    context.log.error(
      "BetRegistry::MarketResolved: User not found: " + market.creator_id
    );
    return;
  }

  user = {
    ...user,
    creatorFeeReceived: user.creatorFeeReceived + event.params.creatorFee,
  };
  context.User.set(user);

  market = {
    ...market,
    endPrice: event.params.endPrice,
    totalDegen: event.params.totalDegen,
    creatorFee: event.params.creatorFee,
    isResolved: true,
  };
  context.Market.set(market);
});
