import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
//import { pinata } from "frog/hubs";
import { handle } from "frog/vercel";
import { ethers } from "ethers";

const usdtAbi = [
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];
// Uncomment to use Edge Runtime.
//export const config = {
//runtime: "edge",
//};

const provider = new ethers.JsonRpcProvider("https://rpc-testnet.morphl2.io");
const pk = process.env.PK;
const wallet = new ethers.Wallet(pk, provider);
const usdtAddress = "0xB4A71512cf4F3A8f675D2aeC76198D6419D219C7"; //usdt on morph testnet
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);
const fa = wallet.address; // faucet address "0x8cFc0e8C1f8DFb3335e00de92D9Cb6556f841C04";
const usdt = ethers.parseUnits("0.1", 18);
const eth = ethers.parseEther("0.01");
var fau = {};

export const app = new Frog({
  assetsPath: "/public",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: "NEYNAR_FROG_FM" }),
  //hub: pinata(),
});

// XMTP support
app.use("/*", async (c: any, next: any) => {
  await next();
  const isFrame = c.res.headers.get("content-type")?.includes("html");
  if (isFrame) {
    let html = await c.res.text();
    const metaTag = '<meta property="of:accepts:xmtp" content="vNext" />';
    html = html.replace(/(<head>)/i, `$1${metaTag}`);
    c.res = new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  }
});

app.frame("/", (c) => {
  return c.res({
    action: "/main",
    image: (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "black",
        }}
      >
        <img
          style={{ margin: "auto", width: "50%" }}
          src="https://i.postimg.cc/rsg3yJTc/logo.gif"
        />
      </div>
    ),
    intents: [<Button action="/main">Getting Started</Button>,
              <Button.Link href="https://www.morphl2.io/">About</Button.Link>,
             ],
  });
});

app.frame("/main", (c) => {
  return c.res({
    image: (
      <div
        style={{
          with: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "black",
        }}
      >
        <img
          style={{ margin: "auto", width: "50%" }}
          src="https://i.postimg.cc/rsg3yJTc/logo.gif"
        />
      </div>
    ),
    intents: [
      <Button.Link href="https://bridge-testnet.morphl2.io/">Bridge</Button.Link>,
      <Button action="/setup">Setup Wallet</Button>,
      <Button action="/faucet">Faucet</Button>,
    ],
  });
});

app.frame("/setup", (c) => {
  const url = "https://chainlist.org/chain/2710";
  return c.res({
    image: (
      <div
        style={{
          with: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "black",
        }}
      >
        <img
          style={{ margin: "auto", width: "100%" }}
          src="https://i.postimg.cc/RVHZF68f/setup.gif"
        />
      </div>
    ),
    intents: [
      <Button action="/main">Back</Button>,
      <Button.Link href={url}>ChainList</Button.Link>,
    ],
  });
});

app.frame("/faucet", async (c) => {
  const baleth = await provider.getBalance(fa);
  const ethbal = ethers.formatEther(baleth);
  const balusd = await usdtContract.balanceOf(fa);
  const usdbal = ethers.formatUnits(balusd, 18);

  return c.res({
    image: (
      <div
        style={{
          height: "100%",
          width: "100%",
          backgroundSize: "100%, 100%",
          color: "white",
          fontSize: 60,
          marginTop: 30,
          lineHeight: 1.8,
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          flexWrap: "nowrap",
          backgroundColor: "black",
        }}
      >
        FAUCET BALANCE
        <div style={{ display: "flex", color: "lime" }}>
          ETH: {Math.round(ethbal * 1e4) / 1e4}
        </div>
        <div style={{ display: "flex", color: "violet" }}>
          USDT: {Math.round(usdbal * 1e2) / 1e2}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter Wallet Address 0x..." />,
      <Button action="/main">Back</Button>,
      <Button action="/tx">0.01 ETH</Button>,
      <Button action="/tx">0.1 USDT</Button>,
    ],
  });
});

app.frame("/tx", async (c) => {
  const { inputText, buttonIndex } = c;
  const now = Date.now();
  try {
    if (ethers.resolveAddress(inputText)) {
      if (fau[inputText]) {
        if (
          fau[inputText][buttonIndex] &&
         (now - fau[inputText][buttonIndex]) < 3600000
        ) {
          throw "once every 24h";
        }
      } else fau[inputText] = {};

      var stx;
      buttonIndex == 2
        ? (stx = await wallet.sendTransaction({ to: inputText, value: eth }))
        : (stx = await usdtContract.transfer(inputText, usdt));
      const url = "https://explorer-testnet.morphl2.io/tx/" + stx.hash;
      fau[inputText][buttonIndex] = now;
      //console.log(fau);
      return c.res({
        image: (
          <div
            style={{
              with: "100%",
              height: "100%",
              display: "flex",
              backgroundColor: "black",
            }}
          >
            <img
              style={{ margin: "auto", width: "50%" }}
              src="https://i.postimg.cc/5t6xhXw6/success.gif"
            />
          </div>
        ),
        intents: [
          <Button action="/faucet">Back</Button>,
          <Button.Link href={url}>View Tx</Button.Link>,
        ],
      });
    }
  } catch (e) {
    console.log(e.shortMessage || e);
    return c.res({
      image: (
        <div
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            backgroundColor: "black",
            display: "flex",
            color: "green",
            fontSize: 35,
            margin: "auto",
            textAlign: "center",
          }}
        >
          {`Check wallet address or faucet balance. Get ${buttonIndex == 2 ? "ETH" : "USDT"} once every 24h.`}
          <div
            style={{ display: "flex", fontSize: 30, color: "pink" }}
          >{`Reason: ${e.shortMessage || e}`}</div>
        </div>
      ),
      intents: [
        <Button action="/faucet">Back</Button>,
        <Button action="/">Restart</Button>,
      ],
    });
  }
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";

devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
