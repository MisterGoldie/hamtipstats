/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/middlewares'

interface HamUserData {
  username: string;
  fid: number;
  totalTips: number;
  totalTipped: number;
  totalHam: number;
  rank: number;
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
  const gifUrl = 'https://example.com/ham-token.gif' // Replace with actual GIF URL
  const baseUrl = 'https://your-app-url.com' // Replace with your app's base URL

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
      <meta property="fc:frame:post_url" content="${baseUrl}/api/check-ham-stats">
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

app.frame('/check-ham-stats', async (c) => {
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

    // Create the share text
    const shareText = `Check out my $HAM stats! Total $HAM: ${hamUserData.totalHam}, Rank: ${hamUserData.rank}. Check yours with the $HAM Token Tracker!`;

    // Create the share URL (this should point to your frame's entry point)
    const shareUrl = `https://your-app-url.com/api`;

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
              <span style={{fontSize: '80px', textShadow: '3px 3px 6px rgba(0,0,0,0.5)'}}>@{hamUserData.username}</span>
              <span style={{fontSize: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>FID: {hamUserData.fid} | Rank: {hamUserData.rank}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '33px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total $HAM:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamUserData.totalHam}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total Tips Received:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamUserData.totalTips}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Total Tipped:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{hamUserData.totalTipped}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <span>Floaty Balance:</span>
              <span style={{fontWeight: '900', minWidth: '150px', textAlign: 'right'}}>{floatyBalance.balance}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', fontSize: '24px', alignSelf: 'flex-end', marginTop: 'auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            $HAM Token Tracker
          </div>
        </div>
      ),
      intents: [
        <Button action="/">Home</Button>,
        <Button action="/check-ham-stats">Refresh</Button>,
        <Button.Link href={farcasterShareURL}>Share</Button.Link>,
      ],
    });
  } catch (error) {
    console.error('Error in check-ham-stats frame:', error);
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

export const GET = handle(app);
export const POST = handle(app);