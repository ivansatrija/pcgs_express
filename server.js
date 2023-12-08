const express = require('express');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use the stealth plugin
puppeteerExtra.use(StealthPlugin());

const app = express();
const port = 3000;

app.get('/coins/:coin_certificate_number', async (req, res) => {
    const { coin_certificate_number } = req.params;

    try {
        const browser = await puppeteerExtra.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(`https://www.pcgs.com/cert/${coin_certificate_number}`);
        await page.waitForTimeout(2000);

        const data = await page.evaluate(() => {
            let price = null;
            let pop_higher_text = null;  // Declare variable to store 'pop_higher' data
            let variety_text = '';
            let variety = '';
            let denomination_text = '';
            let denomination = '';

            const rows = document.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = Array.from(row.getElementsByTagName('td'));
                const priceGuideCell = cells.find(cell => cell.textContent.includes('PCGS Price Guide'));
                const pop_higherCell = cells.find(cell => cell.textContent.includes('Pop Higher'));
                const varietyCell = cells.find(cell => cell.textContent.includes('Variety'));
                const denominationCell = cells.find(cell => cell.textContent.includes('Denomination'));


                if (priceGuideCell) {
                    const priceCell = priceGuideCell.nextElementSibling;
                    const priceLink = priceCell ? priceCell.querySelector('a') : null;
                    if (priceLink) {
                        price = priceLink.textContent.trim().replace('$', '');
                    }
                }

                if (pop_higherCell) {
                    const pop_higherValueCell = pop_higherCell.nextElementSibling;
                    if (pop_higherValueCell) {
                        pop_higher_text = pop_higherValueCell.textContent.trim();
                    }
                }
                if (varietyCell) {
                    const varietyValueCell = varietyCell.nextElementSibling;
                    if (varietyValueCell) {
                        variety_text = varietyValueCell.textContent.trim();
                    }
                }
                if (denominationCell) {
                    const denominationValueCell = denominationCell.nextElementSibling;
                    if (denominationValueCell) {
                        denomination_text = denominationValueCell.textContent.trim();
                        denomination = denomination_text
                    }
                }
            });

            return { price, pop_higher: pop_higher_text, variety, denomination };  // Return both values
        });

        await browser.close();

        res.json({ status: true, coinData: data });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
