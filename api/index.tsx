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
  balance: number;
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

const backgroundImage = "https://bafybeiayzxthtwanqccqgk7bod2bclor5sdy7govxfummtyhf3eyp2vrx4.ipfs.w3s.link/check%20frame%2015.png";
const errorBackgroundImage = "https://example.com/error-background.png"; // Replace with actual error background

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
  const gifUrl = 'https://bafybeidqeedevvjn5iv6h2ivreya3axvuuzkobkhjdfpo3hvrz235o2ria.ipfs.w3s.link/IMG_8044.GIF' // Replace with actual GIF URL
  const baseUrl = 'https://hamtipstats.vercel.app' // Update this to your actual URL

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
        <div
          style={{
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
          }}
        >
          <div style={{ display: 'flex' }}>Unable to retrieve user information: No FID provided</div>
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

    // Create the share text
    const shareText = `Check out my $HAM stats! Total $HAM: ${formatLargeNumber(hamUserData.balance.ham)}, Rank: ${hamUserData.rank}. Check yours with the $HAM Token Tracker!`;

    // Create the share URL (this should point to your frame's entry point)
    const shareUrl = `https://hamtipstats.vercel.app/api`;

    // Create the Farcaster share URL
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
              <span style={{fontSize: '80px', textShadow: '3px 3px 6px rgba(0,0,0,0.5)'}}>@{hamUserData.casterToken.user.username}</span>
              <span style={{fontSize: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>FID: {hamUserData.casterToken.user.fid} | Rank: {hamUserData.rank}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '33px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total $HAM:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{formatLargeNumber(hamUserData.balance.ham)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>HAM Score:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamUserData.hamScore.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Today's Allocation:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{formatLargeNumber(hamUserData.todaysAllocation)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total Tipped Today:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{formatLargeNumber(hamUserData.totalTippedToday)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Floaty Balance:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{floatyBalance.balance.toFixed(2)}</span>
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
        <div
          style={{
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
          }}
        >
          <div style={{ display: 'flex' }}>Error retrieving $HAM stats</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }
});

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
    const hamUserData = await getHamUserData(fid.toString());

    const shareBackgroundImage = "https://bafybeidhdqc3vwqfgzharotwqbsvgd5wuhyltpjywy2hvyqhtm7laovihm.ipfs.w3s.link/check%20frame%204.png";

    const shareText = `My $HAM stats: Total $HAM: ${formatLargeNumber(hamUserData.balance.ham)}, Rank: ${hamUserData.rank}. Check yours with the $HAM Token Tracker!`;
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
            <div style={{fontSize: '36px', marginBottom: '10px'}}>
              Total $HAM: {formatLargeNumber(hamUserData.balance.ham)}
            </div>
            <div style={{fontSize: '36px', marginBottom: '10px'}}>
              Rank: {hamUserData.rank}
            </div>
            <div style={{fontSize: '36px', marginBottom: '10px'}}>
              HAM Score: {hamUserData.hamScore.toFixed(2)}
            </div>
            <div style={{fontSize: '36px', marginBottom: '10px'}}>
              Today's Allocation: {formatLargeNumber(hamUserData.todaysAllocation)}
            </div>
            <div style={{fontSize: '24px', marginTop: 'auto'}}>
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