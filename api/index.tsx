/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/middlewares'

interface HamUserData {
  balance: { ham: string };
  rank: number;
  totalTippedToday: string;
  casterToken: {
    totalVolume: number;
    user: {
      username: string;
      fid: number;
    };
  };
  hamScore: number;
  todaysAllocation: string;
  percentTipped: number;
}

interface FloatyBalance {
  balances: Array<{
    address: string;
    floatyHash: string;
    createdAt: string;
    total: number;
    updatedAt: string;
    emoji: string;
  }>;
}

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$HAM Token Tracker',
}).use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

const HAM_API_URL = 'https://farcaster.dep.dev/ham/user';
const FLOATY_API_URL = 'https://farcaster.dep.dev/floaties/balance/fid';

const backgroundImages = [
  "https://bafybeidoiml4oq4e3o4kwaa65xu3awkxhobholg7wzontmtmoxf5baxc4a.ipfs.w3s.link/check%20frame%2028.png",
  "https://bafybeic7lmq2w2ona2wzw473ogjv5zte42z36uwvi3oibu2cqf2c5eimge.ipfs.w3s.link/check%20frame%2030.png",
  "https://bafybeibhvagxrzv5wqof3zagro3yn4h4gyzjujibk5bbe7tn7e76ogyday.ipfs.w3s.link/check%20frame%2029.png"
];

const errorBackgroundImage = "https://bafybeiheknxnjt2zbnue4wrxed5igyxlntp6cc3jqkogqy7eggoestrh5i.ipfs.w3s.link/check%20frame%2027.png";

function getRandomBackgroundImage(): string {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  return backgroundImages[randomIndex];
}

function formatLargeNumber(strNumber: string): string {
  const number = Number(strNumber) / 1e18;
  return number.toFixed(2);
}

async function getHamUserData(fid: string): Promise<HamUserData> {
  try {
    const url = `${HAM_API_URL}/${fid}`;
    console.log('Fetching HAM user data from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received HAM user data:', data);
    return data;
  } catch (error) {
    console.error('Error in getHamUserData:', error);
    throw error;
  }
}

async function getFloatyBalance(fid: string): Promise<FloatyBalance> {
  try {
    const url = `${FLOATY_API_URL}/${fid}`;
    console.log('Fetching Floaty balance from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received Floaty balance:', data);
    return data;
  } catch (error) {
    console.error('Error in getFloatyBalance:', error);
    throw error;
  }
}

app.frame('/', () => {
  const gifUrl = 'https://bafybeihtvzswbyb6gdyh32tofvvw6z72f5qvqfnfei6ir3kqx5426xwo7q.ipfs.w3s.link/IMG_8059.GIF'
  const baseUrl = 'https://hamtipstats.vercel.app'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>$HAM Token Tracker</title>
      <meta property="fc:frame" content="vNext">
      <meta property="fc:frame:image" content="${gifUrl}">
      <meta property="fc:frame:button:1" content="Check $HAM stats">
      <meta property="fc:frame:button:1:action" content="post">
      <meta property="fc:frame:post_url" content="${baseUrl}/api/check">
    </head>
    <body>
      <h1>$HAM Token Tracker. Check your $HAM and Floaty balance by @goldie</h1>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
})

app.frame('/check', async (c) => {
  console.log('Entering /check frame');
  const { fid } = c.frameData ?? {};
  const { displayName } = c.var.interactor || {};

  if (!fid) {
    console.error('No FID provided');
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${errorBackgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          <div>Unable to retrieve user information: No FID provided</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  try {
    const [hamUserData, floatyBalance] = await Promise.all([
      getHamUserData(fid.toString()),
      getFloatyBalance(fid.toString())
    ]);
    console.log('HAM User Data:', hamUserData);
    console.log('Floaty Balance:', floatyBalance);

    const username = hamUserData?.casterToken?.user?.username || displayName || 'Unknown';
    const userFid = hamUserData?.casterToken?.user?.fid || fid;
    const rank = hamUserData?.rank || 'N/A';
    const totalHam = hamUserData?.balance?.ham ? formatLargeNumber(hamUserData.balance.ham) : 'N/A';
    const hamScore = hamUserData?.hamScore != null ? hamUserData.hamScore.toFixed(2) : 'N/A';
    const todaysAllocation = hamUserData?.todaysAllocation ? formatLargeNumber(hamUserData.todaysAllocation) : 'N/A';
    const totalTippedToday = hamUserData?.totalTippedToday ? formatLargeNumber(hamUserData.totalTippedToday) : 'N/A';
    const floatyBalanceValue = floatyBalance?.balances?.[0]?.total != null 
      ? `${floatyBalance.balances[0].total} ${floatyBalance.balances[0].emoji}`
      : 'N/A';
    const percentTipped = hamUserData?.percentTipped != null ? (hamUserData.percentTipped * 100).toFixed(2) : 'N/A';

    const randomBackgroundImage = getRandomBackgroundImage();

    const shareText = `I have ${totalHam} $HAM with a rank of ${rank}! My HAM Score is ${hamScore} and i've tipped ${percentTipped}% today. Check your /lp stats. Frame by @goldie`;
    const shareUrl = `https://hamtipstats.vercel.app/api/share?fid=${fid}&totalHam=${encodeURIComponent(totalHam)}&rank=${rank}&hamScore=${encodeURIComponent(hamScore)}&todaysAllocation=${encodeURIComponent(todaysAllocation)}&totalTippedToday=${encodeURIComponent(totalTippedToday)}&percentTipped=${percentTipped}&username=${encodeURIComponent(username)}&floatyBalance=${encodeURIComponent(floatyBalanceValue)}&backgroundImage=${encodeURIComponent(randomBackgroundImage)}`;
    const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;

    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${randomBackgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          color: 'white',
          fontWeight: 'bold',
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '80px',}}>@{username}</span>
              <span style={{fontSize: '30px',}}>FID: {userFid} | Rank: {rank}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '33px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Total $HAM:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalHam}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>HAM Score:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamScore}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Today's Allocation:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{todaysAllocation}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Total Tipped Today:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalTippedToday}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Floaty Balance:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{floatyBalanceValue}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Percent Tipped:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{percentTipped}%</span>
            </div>
          </div>
          
          <div style={{display: 'flex', fontSize: '24px', alignSelf: 'flex-end', marginTop: 'auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            $HAM Token Tracker
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Home</Button>,
        <Button action="/check">Refresh</Button>,
        <Button.Link href={farcasterShareURL}>Share</Button.Link>,
      ],
    });
  } catch (error) {
    console.error('Error in check frame:', error);
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${errorBackgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          <div>Error retrieving $HAM stats</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }
});

// The code stops here, just before the /share frame

app.frame('/share', async (c) => {
  const fid = c.req.query('fid');
  const totalHam = c.req.query('totalHam');
  const rank = c.req.query('rank');
  const hamScore = c.req.query('hamScore');
  const todaysAllocation = c.req.query('todaysAllocation');
  const totalTippedToday = c.req.query('totalTippedToday');
  const percentTipped = c.req.query('percentTipped');
  const username = c.req.query('username');
  const floatyBalance = c.req.query('floatyBalance');
  
  if (!fid || !totalHam || !rank || !hamScore || !todaysAllocation || !totalTippedToday || !percentTipped || !username || !floatyBalance) {
    return c.res({
      image: (
        <div style={{ 
          backgroundImage: `url(${errorBackgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Error: Incomplete data provided</h1>
        </div>
      ),
      intents: [
        <Button action="/check">Check Your Stats</Button>
      ]
    });
  }

  const userInfo = {
    username,
    fid,
    totalHam,
    rank,
    hamScore,
    todaysAllocation,
    totalTippedToday,
    percentTipped,
    floatyBalance
  };

  const shareText = `I have ${userInfo.totalHam} $HAM with a rank of ${userInfo.rank}! My HAM Score is ${userInfo.hamScore} and i've tipped ${userInfo.percentTipped}% today. Check your /lp stats. Frame by @goldie`;
  const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;

  return c.res({
    image: (
      <div style={{ 
        backgroundImage: `url(${backgroundImages})`,
        width: '1200px',
        height: '628px',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        color: 'white',
        fontWeight: 'bold',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '80px',}}>@{userInfo.username}</span>
            <span style={{fontSize: '30px',}}>FID: {userInfo.fid} | Rank: {userInfo.rank}</span>
          </div>
        </div>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '33px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>Total $HAM:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.totalHam}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>HAM Score:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.hamScore}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>Today's Allocation:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.todaysAllocation}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>Total Tipped Today:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.totalTippedToday}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>Floaty Balance:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.floatyBalance}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
            <span>Percent Tipped:</span>
            <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{userInfo.percentTipped}%</span>
          </div>
        </div>
        
        <div style={{display: 'flex', fontSize: '24px', alignSelf: 'flex-end', marginTop: 'auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
          $HAM Token Tracker
        </div>
      </div>
    ),
    intents: [
      <Button action="/check">Check Your Stats</Button>,
      <Button.Link href={farcasterShareURL}>Share</Button.Link>,
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);