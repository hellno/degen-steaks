import clsx from "clsx";

export const getProgressBar = ({ a, b }: { a: number; b: number }) => {
    if (!a && !b) return null;

    const aPercentage = (a / (a + b)) * 100;
    const bPercentage = (b / (a + b)) * 100;
    return (
      <div tw="flex justify-center px-12">
        <div tw="flex h-24 rounded-lg">
          <div
            tw={clsx(
              b ? "rounded-l-full" : "rounded-full",
              "flex border-gray-500 w-full bg-green-400"
            )}
            style={{ width: `${a + b > 0 ? (a / (a + b)) * 100 : 0}%` }}
          >
            {a ? (
              <div tw="flex justify-center items-center w-full font-bold text-gray-100">
                {aPercentage.toFixed(2)}%
              </div>
            ) : null}
          </div>
          <div
            tw={clsx(
              a ? "rounded-r-full" : "rounded-full",
              "flex w-full bg-red-500"
            )}
            style={{ width: `${a + b > 0 ? (b / (a + b)) * 100 : 0}%` }}
          >
            {b ? (
              <div tw="flex justify-center items-center w-full font-bold text-gray-100">
                {bPercentage.toFixed(2)}%
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };