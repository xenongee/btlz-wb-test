import knex from '#postgres/knex.js';
import env from '#config/env/env.js';
import { WBService } from './wbService.js';
import { GoogleSheetsService } from './googleSheetsService.js';

export class TariffBoxService {
    private wbService: WBService | null = null;
    private googleSheetsService: GoogleSheetsService | null = null;

    constructor() {
        try {
            this.wbService = new WBService();
        } catch (error) {
            console.warn('WBService init failed:', error instanceof Error ? error.message : String(error));
        }

        try {
            this.googleSheetsService = new GoogleSheetsService();
        } catch (error) {
            console.warn('GoogleSheetsService init failed:', error instanceof Error ? error.message : String(error));
        }
    }

    async fetchAndSaveTariffs(date: string): Promise<void> {
        if (!this.wbService) {
            throw new Error('WBService not init. Check credentials in .env file');
        }

        try {
            const tariffs = await this.wbService.getTariffsBox(date);

            // remove all tariffs for this date
            await knex('tariffs').where('date', date).del();

            const dataToInsert = tariffs.map(tariff => ({
                date,
                warehouse_name: tariff.warehouseName,
                geo_name: tariff.geoName,
                box_delivery_base: tariff.boxDeliveryBase === '-' ? null : parseFloat(tariff.boxDeliveryBase.replace(',', '.')),
                box_delivery_coef_expr: tariff.boxDeliveryCoefExpr === '-' ? null : parseInt(tariff.boxDeliveryCoefExpr),
                box_delivery_liter: tariff.boxDeliveryLiter === '-' ? null : parseFloat(tariff.boxDeliveryLiter.replace(',', '.')),
                box_delivery_marketplace_base: tariff.boxDeliveryMarketplaceBase === '-' ? null : parseFloat(tariff.boxDeliveryMarketplaceBase.replace(',', '.')),
                box_delivery_marketplace_coef_expr: tariff.boxDeliveryMarketplaceCoefExpr === '-' ? null : parseInt(tariff.boxDeliveryMarketplaceCoefExpr),
                box_delivery_marketplace_liter: tariff.boxDeliveryMarketplaceLiter === '-' ? null : parseFloat(tariff.boxDeliveryMarketplaceLiter.replace(',', '.')),
                box_storage_base: tariff.boxStorageBase === '-' ? null : parseFloat(tariff.boxStorageBase.replace(',', '.')),
                box_storage_coef_expr: tariff.boxStorageCoefExpr === '-' ? null : parseInt(tariff.boxStorageCoefExpr),
                box_storage_liter: tariff.boxStorageLiter === '-' ? null : parseFloat(tariff.boxStorageLiter.replace(',', '.')),
            }));

            if (dataToInsert.length > 0) {
                await knex('tariffs').insert(dataToInsert);
                console.log(`Saved ${dataToInsert.length} tariff records for date: ${date}`);

                // export to gsheets after saving
                await this.exportToSheets(date);
            } else {
                console.log(`No tariff data to save for date: ${date}`);
            }
        } catch (error) {
            console.error(`Error fetching/saving tariffs for date ${date}:`, error);
            throw error;
        }
    }

    async getTariffsForDate(date: string): Promise<any[]> {
        return await knex('tariffs')
            .where('date', date)
            .orderBy('box_delivery_coef_expr', 'asc'); // sort by box_delivery_coef_expr
    }

    async getAllSpreadsheets(): Promise<string[]> {
        if (!env.GOOGLE_SPREADSHEET_ID) {
            return [];
        }

        // Support multiple spreadsheet IDs separated by commas
        return env.GOOGLE_SPREADSHEET_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
    }

    async exportToSheets(date: string): Promise<void> {
        if (!this.googleSheetsService) {
            console.warn('GoogleSheetsService not init, export skipped. Check credentials in .env file');
            return;
        }

        try {
            const tariffs = await this.getTariffsForDate(date);
            const spreadsheetIds = await this.getAllSpreadsheets();

            for (const spreadsheetId of spreadsheetIds) {
                const dateTime = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
                await this.googleSheetsService.updateSheet(spreadsheetId, dateTime, tariffs);
            }

            console.log(`Exported tariffs for date '${date}' to ${spreadsheetIds.length} Google Sheets`);
        } catch (error) {
            console.error(`Error exporting tariffs to Google Sheets for date ${date}:`, error);
            throw error;
        }
    }
}
