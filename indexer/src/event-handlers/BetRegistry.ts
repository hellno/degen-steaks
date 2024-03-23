import {
  BetRegistryContract_BetCashedOut_handler,
  BetRegistryContract_BetCashedOut_loader,
  BetRegistryContract_BetPlaced_handler,
  BetRegistryContract_BetPlaced_loader,
  BetRegistryContract_MarketCreated_handler,
  BetRegistryContract_MarketCreated_loader,
  BetRegistryContract_MarketResolved_handler,
  BetRegistryContract_MarketResolved_loader,
  BetRegistryContract_MarketSlashed_handler,
  BetRegistryContract_MarketSlashed_loader,
} from "../../generated/src/Handlers.gen";

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
      totalDegenWon: 0n,
      totalDegenBet: 0n,
      totalSlashFee: 0n,
    };
    context.User.set(user);
  }

  const market = {
    id: event.params.id.toString(),
    creator_id: user.id,
    startTime: event.blockTimestamp,
    targetPrice: event.params.targetPrice,
    endTime: event.params.endTime,
    totalSharesHigher: 0n,
    totalSharesLower: 0n,
    totalSteakedDegen: 0n,
    degenCollected: 0n,
    betCount: 0,
    isResolved: false,
    totalDegen: undefined,
    endPrice: undefined,
    creatorFee: undefined,
    highWon: undefined,
    slashTransaction: undefined,
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
      totalDegenWon: 0n,
      totalDegenBet: 0n,
      totalSlashFee: 0n,
    };
  }
  user = {
    ...user,
    totalDegenBet: user.totalDegenBet + event.params.degen,
  };
  context.User.set(user);

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
      cashedOut: false,
      cashedOutDegen: undefined,
      cashOutTransaction: undefined,
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
    context.log.info('event params', JSON.stringify(event.params));
    // BetDirection is HIGHER
    market = {
      ...market,
      totalSharesHigher: market.totalSharesHigher + event.params.betShares,
    };

    bet = {
      ...bet,
      sharesHigher: bet.sharesHigher + event.params.betShares,
    };
  } else {
    // BetDirection is LOWER
    market = {
      ...market,
      totalSharesLower: market.totalSharesLower + event.params.betShares,
    };

    bet = {
      ...bet,
      sharesLower: bet.sharesLower + event.params.betShares,
    };
  }

  context.Market.set(market);
  context.Bet.set(bet);

  const placedBet = {
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
    transaction: event.transactionHash,
  };

  context.PlacedBet.set(placedBet);
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
    highWon: event.params.endPrice > market.targetPrice,
  };
  context.Market.set(market);
});

BetRegistryContract_BetCashedOut_loader(({ event, context }) => {
  context.Bet.load(
    event.params.marketId.toString() + "-" + event.params.user,
    {}
  );
  context.User.load(event.params.user);
  context.Market.load(event.params.marketId.toString(), {});
});

BetRegistryContract_BetCashedOut_handler(({ event, context }) => {
  let market = context.Market.get(event.params.marketId.toString());
  if (market === undefined) {
    context.log.error(
      "BetRegistry::BetCashedOut: Market not found: " +
        event.params.marketId.toString()
    );
    return;
  }

  let user = context.User.get(event.params.user);
  if (user === undefined) {
    context.log.error(
      "BetRegistry::BetCashedOut: User not found: " + event.params.user
    );
    return;
  }

  let bet = context.Bet.get(
    event.params.marketId.toString() + "-" + event.params.user
  );
  if (bet === undefined) {
    context.log.error(
      "BetRegistry::BetCashedOut: Bet not found: " +
        event.params.marketId.toString() +
        "-" +
        event.params.user
    );
    return;
  }

  if (market.highWon) {
    market = {
      ...market,
      totalSharesHigher: market.totalSharesHigher - event.params.marketShares,
    };
  } else {
    market = {
      ...market,
      totalSharesLower: market.totalSharesLower - event.params.marketShares,
    };
  }

  market = {
    ...market,
    totalDegen: market.totalDegen! - event.params.degen,
  };

  bet = {
    ...bet,
    cashedOut: true,
    cashedOutDegen: event.params.degen,
    cashOutTransaction: event.transactionHash,
  };

  user = {
    ...user,
    totalDegenWon: user.totalDegenWon + event.params.degen,
  };

  context.Market.set(market);
  context.Bet.set(bet);
  context.User.set(user);
});

BetRegistryContract_MarketSlashed_loader(({ event, context }) => {
  context.Market.load(event.params.marketId.toString(), {
    loaders: { loadCreator: true },
  });
  context.User.load(event.params.slasher);
  context.Dao.load("1");
});

BetRegistryContract_MarketSlashed_handler(({ event, context }) => {
  let market = context.Market.get(event.params.marketId.toString());
  if (market === undefined) {
    context.log.error(
      "BetRegistry::MarketSlashed: Market not found: " +
        event.params.marketId.toString()
    );
    return;
  }

  market = {
    ...market,
    totalDegen: 0n,
    slashTransaction: event.transactionHash,
  };
  context.Market.set(market);

  let user = context.Market.getCreator(market);
  if (user === undefined) {
    context.log.error(
      "BetRegistry::MarketSlashed: User not found: " + market.creator_id
    );
    return;
  }

  user = {
    ...user,
    creatorFeeReceived: user.creatorFeeReceived + event.params.creatorFee,
  };
  context.User.set(user);

  let slasher = context.User.get(event.params.slasher);
  if (slasher === undefined) {
    slasher = {
      id: event.params.slasher,
      creatorFeeReceived: 0n,
      totalDegenWon: 0n,
      totalDegenBet: 0n,
      totalSlashFee: 0n,
    };
  }
  slasher = {
    ...slasher,
    totalSlashFee: slasher.totalSlashFee + event.params.slashFee,
  };
  context.User.set(slasher);

  let dao = context.Dao.get("1");
  if (dao === undefined) {
    dao = {
      id: "1",
      totalDegenFee: 0n,
    };
  }
  dao = {
    ...dao,
    totalDegenFee: dao.totalDegenFee + event.params.daoFee,
  };
  context.Dao.set(dao);
});
