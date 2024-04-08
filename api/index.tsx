import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/vercel";
import { ethers } from "ethers";

const usdtAbi =  [
   "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)"
]
// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const provider = new ethers.JsonRpcProvider("https://rpc-testnet.morphl2.io");
const pk = process.env.PK;
const wallet = new ethers.Wallet(pk,provider)
const usdtAddress = "0xB4A71512cf4F3A8f675D2aeC76198D6419D219C7" //usdt on morph testnet
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);
const fa = wallet.address// faucet address "0x8cFc0e8C1f8DFb3335e00de92D9Cb6556f841C04";
const usdt = ethers.parseUnits("0.1", 18);
const  eth = ethers.parseEther("0.001");
var fau = {}; 

export const app = new Frog({
  assetsPath: "/",
  basePath: "/",
  //browserLocation: '/html'
  
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.frame("/", (c) => {
  return c.res({
    action: '/main',
    image: (<img style={{ margin:'auto', width:'50%' }} src="/logo.png"/>),
    intents: [
      <Button>Getting Started</Button>,
    ],
  });
});

app.frame("/main", (c) => {
  return c.res({
    image: (<img style={{ margin:'auto', width:'50%' }} src="/logo.png"/>),
    intents: [
      <Button.Link href="https://www.morphl2.io/">About</Button.Link>,
      <Button action="/setup" >Setup Wallet</Button>,
      <Button action="/faucet" >Faucet</Button>,
    ],
  });
});

app.frame("/setup", (c) => {
const url = "https://chainlist.org/chain/2710"
    return c.res({
    image: (<img style={{ margin:'auto', width:'100%' }} src="/setup.png"/>),
    intents: [
      <Button action="/main">Back</Button>,
      <Button.Link href={url}>ChainList</Button.Link>,
      
    ],
  });
});


app.frame("/faucet", async (c) => {
  const {status} = c;
  const baleth = await provider.getBalance(fa);
  const ethbal = ethers.formatEther(baleth);
  const balusd = await usdtContract.balanceOf(fa);
  const usdbal = ethers.formatUnits(balusd, 18)

  return c.res({
    image: (
      <div style={{height: '100%',
      width: '100%',
      color: 'white',
      fontSize: 60,
      marginTop: 30,
      lineHeight: 1.8,
      display: 'flex',
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      backgroundColor: 'black',
      
      }}>
        FAUCET BALANCE
        <div style={{ display: 'flex',color: 'lime'}}>ETH: {Math.round(ethbal * 1e4) / 1e4}</div>
       <div style={{ display: 'flex',color: 'violet'}}>USDT: {Math.round(usdbal * 1e2) / 1e2}</div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter Wallet Address 0x..." />,
      <Button action="/main">Back</Button>,
      <Button value="eth" action="/tx" >0.001 ETH</Button>,
      <Button value="usdt" action="/tx" >0.1 USDT</Button>,
    ],
  });
});

app.frame("/tx", async (c) => {
  const { inputText, buttonValue } = c;
  try {
  if (ethers.resolveAddress(inputText)) {
    if (fau[inputText]) {
     if (fau[inputText][buttonValue] && (Date.now() - fau[inputText][buttonValue]) < 3600000 ) { throw "once every 24h"} 
  } else fau[inputText] = {};

  var stx;
  (buttonValue == 'eth') ?
   stx = await wallet.sendTransaction({to: inputText,value: eth }) :
   stx = await usdtContract.transfer(inputText,usdt);
  const url = "https://explorer-testnet.morphl2.io/tx/" + stx.hash
  fau[inputText][buttonValue] = Date.now();
  console.log(fau);
  return c.res({
    image: (<img style={{ margin:'auto', width:'50%' }} src="/logo.png"/>),
    intents: [
      <Button action="/faucet">Back</Button>,
      <Button.Link href={url}>View Tx</Button.Link>,
    ],
  });
  }
  } catch(e) {
   console.log(e.shortMessage || e)
    return c.res({
      image: (
        <div style={{ alignItems: 'center',
        flexDirection: 'column',
        backgroundColor:'black',  display: 'flex',color: 'green',fontSize:30, margin:'auto'}}>
         {`Check wallet address or faucet balance. Get ${buttonValue.toUpperCase()} once every 24h.`}
        <div style={{display:'flex',fontSize:25,color: 'pink',}}>{`Reason: ${e.shortMessage || e}`}</div>
        </div>
        ),
      intents: [
        <Button action="/faucet">Back</Button>,
        <Button.Reset>Reset</Button.Reset>,
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
