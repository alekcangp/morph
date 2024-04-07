import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/vercel";
//import { usdtAbi } from "./abi";
import { ethers } from "ethers";


// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const provider = new ethers.JsonRpcProvider("https://rpc-testnet.morphl2.io");
//const signer = provider.getSigner();
const pk = process.env.PK;
const wallet = new ethers.Wallet(pk,provider)
//const usdtAddress = "0xB4A71512cf4F3A8f675D2aeC76198D6419D219C7" //usdt on morph testnet
//const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, provider);
const fa = wallet.address//"0x8cFc0e8C1f8DFb3335e00de92D9Cb6556f841C04";
//const usdtWithSigner = contract.connect(signer);
//const usdt = ethers.utils.parseUnits("0.01", 18);
var feth = {};


export const app = new Frog({
  assetsPath: "/",
  basePath: "/",
  browserLocation: '/html'
  
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
  //console.log(c)
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
  //console.log(ethbal);
 // const balusdt = await usdtContract.balanceOf(fa);
  //const usdtbal = ethers.utils.formatUnits(balusdt, 18)

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
       <div style={{ display: 'flex',color: 'violet'}}>USDT:</div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter Wallet Address 0x..." />,
      <Button action="/main">Back</Button>,
      <Button action="/eth" >0.001 ETH</Button>,
      <Button action="/usdt" >0.01 USDT</Button>,
    ],
  });
});

app.frame("/eth", async (c) => {
  try {
  const { inputText } = c;
  //const v = ethers.isAddress(inputText);
  if (ethers.resolveAddress(inputText)) {
   // const tx = signer.sendTransaction({
    //  to: inputText,
    //  value: ethers.utils.parseEther("0.001")
 // });
 
  if (feth[inputText] && (Date.now() - feth[inputText]) < 3600000 ) throw new Error("Wait...");
  
  const tx = {
    to: inputText,
    value: ethers.parseEther("0.0001")
  }
  
  //const stx = await wallet.sendTransaction(stx)
  const url = "https://explorer-testnet.morphl2.io/tx/" //+ stx.hash
  feth[inputText]=Date.now();
  return c.res({
    image: (<img style={{ margin:'auto', width:'50%' }} src="/logo.png"/>),
    intents: [
      <Button action="/faucet">Back</Button>,
      <Button.Link href={url}>View Tx</Button.Link>,
      //status === "response" && <Button.Reset>Reset</Button.Reset>,
    ],
  });
  }
  } catch(e) {
   
    return c.res({
      image: (
        <div style={{backgroundColor:'black', display: 'flex',color: 'green',fontSize:30, margin:'auto'}}>
         Check wallet address or faucet balance. Get ETH every 24h.
        </div>
        ),
      intents: [
        <Button action="/faucet">Back</Button>,
      ],
    });

  }
});

/*
app.frame("/usdt", (c) => {
  const { inputText } = c;
  if (inputText ) {
    const tx = usdtWithSigner.transfer(inputText, usdt);
  }
  return c.res({
    image: (<img style={{ margin:'auto', width:'50%' }} src="/logo.png"/>),
    intents: [
      <TextInput placeholder="Enter Wallet Address" />,
      <Button action="/faucet">Back</Button>,
      <Button.Transaction target="/send-ether">Send Ether</Button.Transaction>,
      <Button>Request 0.001 ETH</Button>,
      
    ],
  });
});



*/
// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
