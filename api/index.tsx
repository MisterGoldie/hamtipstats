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

const backgroundImage = "https://bafybeigyivd6xymrgnzhxuvbeemrt74dev7y5qkog3rvpt5xb3ljdpe5fi.ipfs.w3s.link/check%20frame%2026.png";
const errorBackgroundImage = "https://bafybeiheknxnjt2zbnue4wrxed5igyxlntp6cc3jqkogqy7eggoestrh5i.ipfs.w3s.link/check%20frame%2027.png";

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
    const percentTipped = hamUserData?.percentTipped != null ? (hamUserData.percentTipped * 100).toFixed(2) : 'N/A';

    // Add sharing constants
    const shareText = `Check out my $HAM stats! Total $HAM: ${totalHam}, Rank: ${rank}, Percent Tipped: ${percentTipped}%. See yours with the $HAM Token Tracker!`;
    const shareUrl = `https://hamtipstats.vercel.app/api/share?fid=${fid}&totalHam=${encodeURIComponent(totalHam)}&rank=${rank}&hamScore=${encodeURIComponent(hamScore)}&todaysAllocation=${encodeURIComponent(todaysAllocation)}&totalTippedToday=${encodeURIComponent(totalTippedToday)}&percentTipped=${percentTipped}&username=${encodeURIComponent(username)}`;
    const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;

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

app.frame('/share', async (c) => {
  const fid = c.req.query('fid');
  const totalHam = c.req.query('totalHam');
  const rank = c.req.query('rank');
  const hamScore = c.req.query('hamScore');
  const todaysAllocation = c.req.query('todaysAllocation');
  const totalTippedToday = c.req.query('totalTippedToday');
  const percentTipped = c.req.query('percentTipped');
  const username = c.req.query('username');

  if (!fid || !totalHam || !rank || !hamScore || !todaysAllocation || !totalTippedToday || !percentTipped || !username) {
    return c.res({
      image: (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#f0e6fa',
          color: 'black',
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

  const imageUrl = `https://hamtipstats.vercel.app/api/share/image?fid=${fid}&totalHam=${encodeURIComponent(totalHam)}&rank=${rank}&hamScore=${encodeURIComponent(hamScore)}&todaysAllocation=${encodeURIComponent(todaysAllocation)}&totalTippedToday=${encodeURIComponent(totalTippedToday)}&percentTipped=${percentTipped}&username=${encodeURIComponent(username)}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>$HAM Token Tracker - Shared Stats</title>
      <meta property="fc:frame" content="vNext">
      <meta property="fc:frame:image" content="${imageUrl}">
      <meta property="fc:frame:button:1" content="Check Your Stats">
      <meta property="fc:frame:button:1:action" content="post">
      <meta property="fc:frame:post_url" content="https://hamtipstats.vercel.app/api/check">
    </head>
    <body>
      <h1>$HAM Token Tracker - Shared Stats</h1>
      <p>View the shared $HAM stats in the Farcaster app.</p>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
});

// Separate endpoint to generate the image for sharing
app.frame('/share/image', (c) => {
  const fid = c.req.query('fid');
  const totalHam = c.req.query('totalHam');
  const rank = c.req.query('rank');
  const hamScore = c.req.query('hamScore');
  const todaysAllocation = c.req.query('todaysAllocation');
  const totalTippedToday = c.req.query('totalTippedToday');
  const percentTipped = c.req.query('percentTipped');
  const username = c.req.query('username');

  if (!fid || !totalHam || !rank || !hamScore || !todaysAllocation || !totalTippedToday || !percentTipped || !username) {
    return c.res({
      image: (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#f0e6fa',
          color: 'black',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Error: Incomplete data provided</h1>
        </div>
      ),
    });
  }

  const userInfo = {
    username,
    totalHam: Number(totalHam),
    rank: Number(rank),
    hamScore: Number(hamScore),
    todaysAllocation: Number(todaysAllocation),
    totalTippedToday: Number(totalTippedToday),
    percentTipped: Number(percentTipped)
  };

  const backgroundImageUrl = 'https://bafybeig4hhgqrxpa2vlp3qmmiq6pc5si4b44jtl4mhryrbyqagu5ujdplu.ipfs.w3s.link/check%20frame%2025.png';

  return c.res({
    image: (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        height: '100%', 
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ 
              fontSize: '72px', 
              color: 'white', 
              margin: '0 0 10px 0',
              fontWeight: 'bold'
            }}>
              @{userInfo.username}
            </p>
            <p style={{ 
              fontSize: '24px', 
              color: 'white', 
              margin: '0',
              fontWeight: 'bold'
            }}>
              FID: {fid} | Rank: {userInfo.rank}
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          position: 'absolute', 
          top: '35%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%' 
        }}>
          <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <p style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              marginBottom: '10px'
            }}>
              Total $HAM
            </p>
            <p style={{ 
              fontSize: '46px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
            }}>
              {userInfo.totalHam.toFixed(2)}
            </p>
          </div>
          <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <p style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              marginBottom: '10px'
            }}>
              HAM Score
            </p>
            <p style={{ 
              fontSize: '46px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
            }}>
              {userInfo.hamScore.toFixed(2)}
            </p>
          </div>
          <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <p style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              marginBottom: '10px'
            }}>
              Today's Allocation
            </p>
            <p style={{ 
              fontSize: '46px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
            }}>
              {userInfo.todaysAllocation.toFixed(2)}
            </p>
          </div>
          <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
            <p style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              marginBottom: '10px'
            }}>
              Total Tipped Today
            </p>
            <p style={{ 
              fontSize: '46px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
            }}>
              {userInfo.totalTippedToday.toFixed(2)}
            </p>
          </div>
          <div style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <p style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              marginBottom: '10px'
            }}>
              Percent Tipped Today
            </p>
            <p style={{ 
              fontSize: '46px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
            }}>
              {userInfo.percentTipped.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '24px',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          width: '100%'
        }}>
          $HAM Token Tracker
        </div>
      </div>
    ),
  });
});

export const GET = handle(app);
export const POST = handle(app);