import {
  SteakedDegenContract_DaoFeePaid_handler,
  SteakedDegenContract_DaoFeePaid_loader,
} from "../../generated/src/Handlers.gen";

SteakedDegenContract_DaoFeePaid_loader(({ event, context }) => {
  context.Dao.load("1");
});

SteakedDegenContract_DaoFeePaid_handler(({ event, context }) => {
  let dao = context.Dao.get("1");
  if (dao === undefined) {
    dao = {
      id: "1",
      totalDegenFee: 0n,
    };
    context.Dao.set(dao);
  }
  dao = {
    ...dao,
    totalDegenFee: dao.totalDegenFee + event.params.amount,
  };
  context.Dao.set(dao);
});
