import knex, { migrate, seed } from "#postgres/knex.js";
import cron from 'node-cron';
import { TariffBoxService } from './services/tariffBoxService.js';

await migrate.latest();

try {
    await seed.run();
} catch (error) {
    console.log('Seeds skipped...');
}

console.log("All migrations and seeds have been run");

// init services
const tariffService = new TariffBoxService();

const getCurrentDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

// check services
const hasWBAccess = tariffService['wbService'] !== null;
const hasGoogleAccess = tariffService['googleSheetsService'] !== null;

console.log('Services status:');
console.log(`- WB API: ${hasWBAccess ? 'OK' : 'WB_TOKEN missing?'}`);
console.log(`- Google Sheets: ${hasGoogleAccess ? 'OK' : 'Google credentials missing?'}`);

if (hasWBAccess) {
    // schedule to run every hour
    const date = getCurrentDate();
    cron.schedule('0 * * * *', async () => {
        try {
            console.log(`Tariff fetch for date: ${date}`, new Date().toLocaleTimeString());
            await tariffService.fetchAndSaveTariffs(date);
        } catch (error) {
            console.error('Error in tariff fetch:', error);
        }
    });
    // initial fetch
    try {
        console.log(`Initial tariff fetch for date: ${date}`);
        await tariffService.fetchAndSaveTariffs(date);
    } catch (error) {
        console.error('Error in Initial tariff fetch:', error);
    }

    console.log("Tariff fetching scheduled every hour");
}
