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

const backgroundImage = "https://bafybeig4hhgqrxpa2vlp3qmmiq6pc5si4b44jtl4mhryrbyqagu5ujdplu.ipfs.w3s.link/check%20frame%2025.png";
const errorBackgroundImage = "https://bafybeiajbch2tb6veul2ydzqmzc62arz5vtpbycei3fcyehase5amv62we.ipfs.w3s.link/Frame%2059%20(5).png";

function formatLargeNumber(strNumber: string): string {
  const number = Number(strNumber) / 1e18;
  return number.toFixed(2);
}

function calculateUsersTipped(totalTipped: number): number {
  // This is a placeholder calculation. You should replace this with the actual logic
  // to determine the number of users tipped based on your data.
  // For now, we'll just divide the total tipped by 10 (assuming 10 $HAM per tip on average)
  return Math.min(Math.floor(totalTipped / 10), 10);
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
      <h1>$HAM Token Tracker. Check your $HAM and Floaty balance!</h1>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
})

app.frame('/check', async (c) => {
  const { fid } = c.frameData ?? {};

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
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
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

    const username = hamUserData?.casterToken?.user?.username || 'Unknown';
    const userFid = hamUserData?.casterToken?.user?.fid || fid;
    const rank = hamUserData?.rank || 'N/A';
    const totalHam = hamUserData?.balance?.ham ? formatLargeNumber(hamUserData.balance.ham) : 'N/A';
    const hamScore = hamUserData?.hamScore != null ? hamUserData.hamScore.toFixed(2) : 'N/A';
    const todaysAllocation = hamUserData?.todaysAllocation ? formatLargeNumber(hamUserData.todaysAllocation) : 'N/A';
    const totalTippedToday = hamUserData?.totalTippedToday ? formatLargeNumber(hamUserData.totalTippedToday) : 'N/A';
    const floatyBalanceValue = floatyBalance?.balances?.[0]?.total != null 
      ? `${floatyBalance.balances[0].total} ${floatyBalance.balances[0].emoji}`
      : 'N/A';

    // Calculate users tipped
    const totalTipped = Number(hamUserData.totalTippedToday) / 1e18;
    const usersTipped = calculateUsersTipped(totalTipped);

    // Create HAM level indicator
    const hamLevelIndicator = Array(10).fill('🍖').map((ham, index) => 
      index < usersTipped ? '🔥' : ham
    ).join('');

    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${backgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          color: 'white',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '80px', textShadow: '3px 3px 6px rgba(0,0,0,0.5)'}}>@{username}</span>
              <span style={{fontSize: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>FID: {userFid} | Rank: {rank}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '33px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total $HAM:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalHam}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>HAM Score:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamScore}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Today's Allocation:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{todaysAllocation}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total Tipped Today:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalTippedToday}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Floaty Balance:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{floatyBalanceValue}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '20px'}}>
              <span>Users Tipped Today:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{usersTipped}</span>
            </div>
            <div style={{fontSize: '40px', marginTop: '10px'}}>{hamLevelIndicator}</div>
          </div>
          
          <div style={{display: 'flex', fontSize: '24px', alignSelf: 'flex-end', marginTop: 'auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            $HAM Token Tracker
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Home</Button>,
        <Button action="/check">Refresh</Button>,
        <Button action="/share">Share</Button>,
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
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
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
  const { fid } = c.frameData ?? {};

  if (!fid) {
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
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          <div>Unable to retrieve user information: No FID provided</div>
        </div>
      ),
      intents: [<Button action="/">Back to Home</Button>],
    });
  }

  try {
    const [hamUserData, floatyBalance] = await Promise.all([
      getHamUserData(fid.toString()),
      getFloatyBalance(fid.toString())
    ]);

    const shareBackgroundImage = "https://bafybeig4hhgqrxpa2vlp3qmmiq6pc5si4b44jtl4mhryrbyqagu5ujdplu.ipfs.w3s.link/check%20frame%2025.png";

    const totalHam = formatLargeNumber(hamUserData.balance.ham);
    const hamScore = hamUserData?.hamScore != null ? hamUserData.hamScore.toFixed(2) : 'N/A';
    const todaysAllocation = formatLargeNumber(hamUserData.todaysAllocation);
    const totalTippedToday = formatLargeNumber(hamUserData.totalTippedToday);
    const floatyBalanceValue = floatyBalance?.balances?.[0]?.total != null 
      ? `${floatyBalance.balances[0].total} ${floatyBalance.balances[0].emoji}`
      : 'N/A';

    // Calculate users tipped
    const totalTipped = Number(hamUserData.totalTippedToday) / 1e18;
    const usersTipped = calculateUsersTipped(totalTipped);

    // Create HAM level indicator
    const hamLevelIndicator = Array(10).fill('🍖').map((ham, index) => 
      index < usersTipped ? '🔥' : ham
    ).join('');

    const shareText = `My $HAM stats: Total $HAM: ${totalHam}, Rank: ${hamUserData.rank}, Users Tipped Today: ${usersTipped}. Check yours with the $HAM Token Tracker!`;
    const shareUrl = `https://hamtipstats.vercel.app/api`;
    const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;

    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${shareBackgroundImage})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          color: 'white',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>
              $HAM Stats for @{hamUserData.casterToken.user.username}
            </div>
            <div style={{fontSize: '24px', marginBottom: '20px'}}>
              FID: {hamUserData.casterToken.user.fid} | Rank: {hamUserData.rank}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '36px',
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>Total $HAM:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalHam}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>HAM Score:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamScore}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>Today's Allocation:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{todaysAllocation}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>Total Tipped Today:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{totalTippedToday}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>Floaty Balance:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{floatyBalanceValue}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span>Users Tipped Today:</span>
                <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{usersTipped}</span>
              </div>
            </div>
            <div style={{fontSize: '40px', marginTop: '10px', textAlign: 'center'}}>{hamLevelIndicator}</div>
            <div style={{fontSize: '24px', marginTop: 'auto', textAlign: 'center'}}>
              Check your $HAM stats with the $HAM Token Tracker!
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Check Your Stats</Button>,
        <Button.Link href={farcasterShareURL}>Share Your Stats</Button.Link>,
      ],
    });
  } catch (error) {
    console.error('Error in share frame:', error);
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
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          <div>Error fetching data. Please try again later.</div>
        </div>
      ),
      intents: [<Button action="/">Back to Home</Button>],
    });
  }
});

export const GET = handle(app);
export const POST = handle(app);