import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // iPhone 13 Pro viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/');

  // Inject local storage to bypass auth
  console.log('Injecting auth state...');
  await page.evaluate(() => {
    localStorage.setItem('TRUEFIT_USERS', JSON.stringify({
      "8618455816": {
        "pass": "123",
        "name": "Divya"
      }
    }));
    localStorage.setItem('TRUEFIT_SETTINGS', JSON.stringify({
      theme: 'light',
      brand: 'candy',
      account: '8618455816',
      signedIn: true
    }));
  });

  // Reload to apply auth state
  await page.reload({ waitUntil: 'networkidle0' });

  const artifactDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\57588ef9-95d0-4be5-8bd6-6e00e2a42b45';

  // Wait for home screen
  await page.waitForSelector('#screen-home');
  console.log('Capturing home screen...');
  await page.screenshot({ path: `${artifactDir}\\mobile_home.png` });

  // Click Clients tab
  console.log('Capturing clients screen...');
  await page.evaluate(() => document.querySelector('.tabbar .tab-btn[data-tab="clients"]').click());
  await new Promise(r => setTimeout(r, 500)); // Wait for transition
  await page.screenshot({ path: `${artifactDir}\\mobile_clients.png` });

  // Click Settings tab
  console.log('Capturing settings screen...');
  await page.evaluate(() => document.querySelector('.tabbar .tab-btn[data-tab="settings"]').click());
  await new Promise(r => setTimeout(r, 500)); // Wait for transition
  await page.screenshot({ path: `${artifactDir}\\mobile_settings.png` });

  await browser.close();
  console.log('Done!');
})();
