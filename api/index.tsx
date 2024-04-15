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
const ethl2 = "0x4200000000000000000000000000000000000010";
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);
const fa = wallet.address; // faucet address "0x8cFc0e8C1f8DFb3335e00de92D9Cb6556f841C04";
const usdt = ethers.parseUnits("1", 18);
const eth = ethers.parseEther("0.01");
var fau = {};

export const app = new Frog({
  assetsPath: "/public",
  basePath: "/api",
  browserLocation: "/:basePath/dev",
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
    headers: {
      "cache-control": "max-age=0",
    },
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
    intents: [
      <Button action="/main">Getting Started</Button>,
      <Button.Link href="https://www.morphl2.io/">About</Button.Link>,
    ],
    title: "Morph Frame",
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
      <Button.Link href="https://bridge-testnet.morphl2.io/">
        Bridge
      </Button.Link>,
      <Button action="/setup">Setup⚙️</Button>,
      <Button action="/faucet">Faucet🪙</Button>,
    ],
  });
});

app.frame("/setup", (c) => {
  const url = "https://chainlist.org/chain/2710";
  return c.res({
    image: (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "black",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white",
          fontSize: 60,
        }}
      >
        Network Configuration
        <img
          style={{ width: "100%" }}
          src="https://i.postimg.cc/RVHZF68f/setup.gif"
        />
      </div>
    ),
    intents: [
      <Button action="/main">&laquo; Back</Button>,
      <Button.Link href={url}>ChainList</Button.Link>,
    ],
  });
});

// fetch farcaster username by address
async function alia(addr, ad) {
  try {
  const val = await fetch("https://searchcaster.xyz/api/profiles?connected_address=" + addr );
  let ob = await val.json();
  return ob.length > 0 ? ob[0].body.displayName : ad;
  } catch {return ad}
}

app.frame("/contribute", async (c) => {
  const url = "https://explorer-testnet.morphl2.io/address/" + fa;
  const rtok = await fetch("https://explorer-api-testnet.morphl2.io/api/v2/addresses/" +  fa + "/token-transfers?token=" + usdtAddress );
  const tok = await rtok.json();
  const rcoi = await fetch("https://explorer-api-testnet.morphl2.io/api/v2/addresses/" +  fa + "/transactions");
  const coi = await rcoi.json();
  const txs = tok.items.concat(coi.items).sort((a, b) => {
    return new Date(b.timestamp).valueOf() - new Date(a.timestamp).valueOf();
  });
  
  const arr = [];
  var ii = 0;

  for (let i = 0; i < txs.length; i++) {
    if (ii > 4) break;
    const addr = txs[i].from.hash;
    const tim = txs[i].timestamp.substring(0, 10);
    var match = addr.match(/^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/);
    var ad = match[1] + " 🙂 🙂 🙂 " + match[2];

    if (txs[i].to.hash == fa && addr != fa && addr != ethl2) {
      if (txs[i]["method"] === null) {
        ii += 1;
        arr.push({
          addr: alia(addr, ad),
          amt: ethers.formatEther(txs[i]["value"]),
          f: "ETH",
          c: "lime",
          t: tim,
        });
      }
      if (txs[i]["method"] == "transfer") {
        ii += 1;
        arr.push({
          addr: alia(addr, ad),
          amt: ethers.formatUnits(txs[i]["total"]["value"], 18),
          f: "USDT",
          c: "pink",
          t: tim,
        });
      }
    }
  }
  return c.res({
    image: (
      <div
        style={{
          height: "100%",
          width: "100%",
          backgroundSize: "100%, 100%",
          color: "white",
          fontSize: 60,
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          flexWrap: "nowrap",
          backgroundColor: "black",
        }}
      >
        CONTRIBUTORS
        <div
          style={{
            display: "flex",
            fontSize: 30,
            flexDirection: "column",
          }}
        >
          <p style={{ color: `${arr[0].c}` }}>
            {arr[0].t} 🕓 {arr[0].addr} ✅ {Math.round(arr[0].amt * 1e3) / 1e3}&nbsp; 
            {arr[0].f}
          </p>
          <p style={{ color: `${arr[1].c}` }}>
            {arr[1].t} 🕓 {arr[1].addr} ✅ {Math.round(arr[1].amt * 1e3) / 1e3}&nbsp; 
            {arr[1].f}
          </p>
          <p style={{ color: `${arr[2].c}` }}>
            {arr[2].t} 🕓 {arr[2].addr} ✅ {Math.round(arr[2].amt * 1e3) / 1e3}&nbsp; 
            {arr[2].f}
          </p>
          <p style={{ color: `${arr[3].c}` }}>
            {arr[3].t} 🕓 {arr[3].addr} ✅ {Math.round(arr[3].amt * 1e3) / 1e3}&nbsp; 
            {arr[3].f}
          </p>
          <p style={{ color: `${arr[4].c}` }}>
            {arr[4].t} 🕓 {arr[4].addr} ✅ {Math.round(arr[4].amt * 1e3) / 1e3}&nbsp; 
            {arr[4].f}
          </p>
        </div>
      </div>
    ),
    intents: [
      <Button action="/faucet">&laquo; Back</Button>,
      <Button.Link href={url}>Faucet Address</Button.Link>,
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
      <TextInput placeholder="Wallet address or Farcaster name" />,
      <Button action="/main">&laquo; Back</Button>,
      <Button action="/tx">0.01 ETH</Button>,
      <Button action="/tx">1 USDT</Button>,
       <Button action="/contribute">Contribute✔️</Button>,
    ],
  });
});

app.frame("/tx", async (c) => {
  const { inputText, buttonIndex } = c;
  const now = Date.now();
  var addr = inputText.match(/[^@\s]+/g)[0];
  try {
    if (addr.substring(0, 2) != "0x") {
      const res = await fetch("https://nemes.farcaster.xyz:2281/v1/userNameProofByName?name=" + addr);
      let data = await res.json();
      addr = data.owner;
    }
    //console.log(addr);
    if (ethers.resolveAddress(addr)) {
      if (fau[addr]) {
        if (fau[addr][buttonIndex] && now - fau[addr][buttonIndex] < 3600000) {
          throw "once every 24h";
        }
      } else fau[addr] = {};

      var stx;
       buttonIndex == 2
         ? (stx = await wallet.sendTransaction({ to: addr, value: eth }))
         : (stx = await usdtContract.transfer(addr, usdt));
      const url = "https://explorer-testnet.morphl2.io/tx/" + stx.hash;
      fau[addr][buttonIndex] = now;
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
          <Button action="/faucet">&laquo; Back</Button>,
          <Button.Link href={url}>View Tx</Button.Link>,
        ],
      });
    }
  } catch (e) {
    //console.log(e.shortMessage || e);
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
        <Button action="/faucet">&laquo; Back</Button>,
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
