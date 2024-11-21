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
  imageOptions: {
    width: 1200,
    height: 628,
    fonts: [
      {
        name: 'Finger Paint',
        source: 'google',
        weight: 400,
      },
    ],
  },
  title: '$HAM Token Tracker',
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": "103ba30da492d4a7e89e7026a6d3a234e", // Your Airstack API key
      }
    }
  }
}).use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

const HAM_API_URL = 'https://farcaster.dep.dev/ham/user';
const FLOATY_API_URL = 'https://farcaster.dep.dev/floaties/balance/fid';

const backgroundImages = [
  "https://bafybeic7lmq2w2ona2wzw473ogjv5zte42z36uwvi3oibu2cqf2c5eimge.ipfs.w3s.link/check%20frame%2030.png",
  "https://bafybeibhvagxrzv5wqof3zagro3yn4h4gyzjujibk5bbe7tn7e76ogyday.ipfs.w3s.link/check%20frame%2029.png",
  "https://bafybeia2z53efo36qcof5v6kxwdgerp6wbbaiflz4hb6fyscxjemr5fqv4.ipfs.w3s.link/check%20frame%2035.png",
  "https://bafybeibmobgfnfcbnhfg6uxjotrwfewgmrrrxf3f5xik3gp6bvnlwmst4q.ipfs.w3s.link/check%20frame%2037.png",
  "https://bafybeignjyl4q6hl74liofccrkgmgpus5gtqq5kux2vfbtulsotgtnp75y.ipfs.w3s.link/check%20frame%2034.png",
  "https://bafybeihvjzzmjdjfickrzly3u4rzvgpjop4qi67g3d7wwnop7rzmbeb2je.ipfs.w3s.link/check%20frame%2032.png",
  "https://bafybeidoiml4oq4e3o4kwaa65xu3awkxhobholg7wzontmtmoxf5baxc4a.ipfs.w3s.link/check%20frame%2028.png",
];

const errorBackgroundImage = "https://bafybeiheknxnjt2zbnue4wrxed5igyxlntp6cc3jqkogqy7eggoestrh5i.ipfs.w3s.link/check%20frame%2027.png";

function getRandomBackground(): string {
  return backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
}

function formatLargeNumber(strNumber: string): string {
  const number = Number(strNumber) / 1e18;
  return number.toFixed(2);
}

async function getAirstackUserDetails(fid: string) {
  const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
  const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';

  const query = `
    query GetFarcasterUserDetails {
      Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum, limit: 1}) {
        Social {
          profileName
        }
      }
    }
  `;

  try {
    const response = await fetch(AIRSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AIRSTACK_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Airstack API request failed');
    }

    const data = await response.json();
    return data.data.Socials.Social[0]?.profileName || null;
  } catch (error) {
    console.error('Error fetching Airstack user details:', error);
    return null;
  }
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
    
    // If the username is not available in HAM data, fetch it from Airstack
    if (!data.casterToken?.user?.username) {
      const airstackUsername = await getAirstackUserDetails(fid);
      if (airstackUsername) {
        data.casterToken = data.casterToken || {};
        data.casterToken.user = data.casterToken.user || {};
        data.casterToken.user.username = airstackUsername;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in getHamUserData:', error);
    throw error;
  }
}

async function getFloatyBalance(fid: string): Promise<FloatyBalance | null> {
  try {
    const url = `${FLOATY_API_URL}/${fid}`;
    console.log('Fetching Floaty balance from:', url);
    const response = await fetch(url);
    if (response.status === 404) {
      console.log('No Floaty balance found for user');
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received Floaty balance:', data);
    return data;
  } catch (error) {
    console.error('Error in getFloatyBalance:', error);
    return null;
  }
}

// First, let's ensure background validation is consistent
const validateBackground = (bg: string): string => {
  const validBackgrounds = [...backgroundImages, errorBackgroundImage];
  return validBackgrounds.includes(bg) ? bg : backgroundImages[0];
};

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
          fontFamily: '"Finger Paint", cursive',
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

    const username = hamUserData?.casterToken?.user?.username || await getAirstackUserDetails(fid.toString()) || displayName || 'Unknown';
    const userFid = hamUserData?.casterToken?.user?.fid || fid;
    const rank = hamUserData?.rank ?? 'N/A';
    const totalHam = hamUserData?.balance?.ham ? formatLargeNumber(hamUserData.balance.ham) : '0.00';
    const hamScore = hamUserData?.hamScore != null ? hamUserData.hamScore.toFixed(2) : '0.00';
    const todaysAllocation = hamUserData?.todaysAllocation ? formatLargeNumber(hamUserData.todaysAllocation) : '0.00';
    const totalTippedToday = hamUserData?.totalTippedToday ? formatLargeNumber(hamUserData.totalTippedToday) : '0.00';
    const floatyBalanceValue = floatyBalance?.balances?.[0]?.total != null 
      ? `${floatyBalance.balances[0].total} 🦄`
      : '0 🦄';
    const percentTipped = hamUserData?.percentTipped != null ? (hamUserData.percentTipped * 100).toFixed(2) : '0.00';

    const shareText = `I have ${totalHam} $HAM with a rank of ${rank}! My HAM Score is ${hamScore} and I've tipped ${percentTipped}% today. Check your /lp stats 🍖 . Frame by @goldie`;
    const backgroundImage = getRandomBackground();
    const validatedBackground = validateBackground(backgroundImage);
    
    // Construct the share URL with all necessary data
    const shareUrl = new URL('https://hamtipstats.vercel.app/api/share');
    shareUrl.searchParams.append('fid', fid.toString());
    shareUrl.searchParams.append('bg', encodeURIComponent(validatedBackground));
    shareUrl.searchParams.append('username', username);
    shareUrl.searchParams.append('rank', rank.toString());
    shareUrl.searchParams.append('totalHam', totalHam);
    shareUrl.searchParams.append('hamScore', hamScore);
    shareUrl.searchParams.append('todaysAllocation', todaysAllocation);
    shareUrl.searchParams.append('totalTippedToday', totalTippedToday);
    shareUrl.searchParams.append('floatyBalance', floatyBalanceValue);
    shareUrl.searchParams.append('percentTipped', percentTipped);
    
    const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl.toString())}`;

    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${validatedBackground})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          color: 'white',
          fontWeight: 'bold',
          fontFamily: '"Finger Paint", cursive',
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '76px',}}>@{username}</span>
              <span style={{fontSize: '38px',}}>FID: {userFid} | Rank: {rank}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '38px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Total $HAM:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{totalHam}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>HAM Score:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{hamScore}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Today's Allocation:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{todaysAllocation}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Total Tipped Today:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{totalTippedToday}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Floaty Balance:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{floatyBalanceValue}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Percent Tipped:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{percentTipped}%</span>
            </div>
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
    console.error('Error fetching data:', error);
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
          fontFamily: '"Finger Paint", cursive',
        }}>
          <div>Stats temporarily unavailable. Please try again later.</div>
        </div>
      ),
      intents: [
        <Button action="/check">Try Again</Button>
      ],
    });
  }
});

app.frame('/share', async (c) => {
  const fid = c.req.query('fid');
  const backgroundImage = validateBackground(decodeURIComponent(c.req.query('bg') || ''));
  
  console.log('Share Route Debug:', {
    fid,
    backgroundImage,
    params: Object.fromEntries(new URL(c.req.url).searchParams)
  });

  try {
    const cleanFid = fid?.toString().trim();
    if (!cleanFid) {
      throw new Error('No FID provided');
    }

    // Use passed parameters first, fall back to API data if needed
    const username = c.req.query('username') || await getAirstackUserDetails(cleanFid) || 'Unknown';
    const rank = c.req.query('rank') || 'N/A';
    const totalHam = c.req.query('totalHam') || '0.00';
    const hamScore = c.req.query('hamScore') || '0.00';
    const todaysAllocation = c.req.query('todaysAllocation') || '0.00';
    const totalTippedToday = c.req.query('totalTippedToday') || '0.00';
    const floatyBalanceValue = c.req.query('floatyBalance') || '0 🦄';
    const percentTipped = c.req.query('percentTipped') || '0.00';

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
          fontFamily: '"Finger Paint", cursive',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 1,
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontSize: '76px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>@{username}</span>
                <span style={{fontSize: '38px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>FID: {cleanFid} | Rank: {rank}</span>
              </div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '38px'}}>
              {[
                ['Total $HAM:', totalHam],
                ['HAM Score:', hamScore],
                ['Today\'s Allocation:', todaysAllocation],
                ['Total Tipped Today:', totalTippedToday],
                ['Floaty Balance:', floatyBalanceValue],
                ['Percent Tipped:', `${percentTipped}%`],
              ].map(([label, value]) => (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: '10px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}>
                  <span>{label}</span>
                  <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button action="/check">Check Your Stats</Button>
      ]
    });
  } catch (error) {
    console.error('Share Route Error:', error);
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
          fontFamily: '"Finger Paint", cursive',
        }}>
          <div>Error loading stats. Please try again.</div>
        </div>
      ),
      intents: [
        <Button action="/check">Try Again</Button>
      ]
    });
  }
});

// Export the handlers
export const HEAD = handle(app);
export const GET = handle(app);
export const POST = handle(app);