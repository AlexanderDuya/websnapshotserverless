const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Ensure the URL includes the protocol (http:// or https://)
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    // Launch a headless Chromium browser
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });

    // Open a new page and navigate to the URL
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.goto(formattedUrl, { waitUntil: 'networkidle2' });

    // Scroll through the page to trigger animations
    await page.evaluate(async () => {
      const distance = 100; 
      const delay = 100;
      const totalHeight = document.body.scrollHeight;

      for (let i = 0; i < totalHeight; i += distance) {
        window.scrollBy(0, distance);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Capture the screenshot as a buffer
    const screenshotBuffer = await page.screenshot({ fullPage: true });

    // Close the browser
    await browser.close();

    // Set the response headers to return the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename=screenshot.png');

    // Send the screenshot buffer as the response
    return res.send(screenshotBuffer);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
