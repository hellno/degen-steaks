# degen steaks 🥩 frontend

## Quickstart
1. Install dependencies `yarn install`

2. Run the dev server `yarn dev`

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

4. Visit [http://localhost:3000/debug](http://localhost:3000/debug) to debug your frame.

5. Debug with Warpcast Frame validator
    - Run app locally and ```cloudflared tunnel --url http://localhost:3000```
    - Set xyz.trycloudflare.com as `NEXT_PUBLIC_HOST` in `.env` file
    - Visit `https://warpcast.com/~/developers/frames`
