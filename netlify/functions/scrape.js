const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {
  const urlParam = event.queryStringParameters?.url;
  if (!urlParam) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'url' query parameter" }),
    };
  }

  try {
    const browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(urlParam, { waitUntil: "networkidle2", timeout: 30000 });

    const content = await page.evaluate(() => {
      document.querySelectorAll("script, style").forEach(el => el.remove());
      return document.body.innerText.replace(/\s+/g, " ").trim();
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ url: urlParam, content }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Scraping failed", details: err.message }),
    };
  }
};
