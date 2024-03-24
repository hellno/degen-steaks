const DEX_SCREENER_API_ENDPOINT = ' https://api.dexscreener.com/latest/dex/pairs/base/0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa';

export const getDegenUsdPrice = async () => {
    const apiEndpoint = DEX_SCREENER_API_ENDPOINT;
    try {
        const data = await (await fetch(apiEndpoint)).json();
        if (!data.pairs) {
            return;
        }

        return data.pairs[0].priceUsd;
    } catch (e) {
        console.error('Error fetching Degen price', e);
        return;
    }
}