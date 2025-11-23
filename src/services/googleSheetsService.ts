import { google, sheets_v4 } from 'googleapis';
import env from '#config/env/env.js';

interface Tariff {
    warehouse_name: string;
    geo_name?: string;
    box_delivery_base?: string | number;
    box_delivery_coef_expr?: string;
    box_delivery_liter?: string | number;
    box_delivery_marketplace_base?: string | number;
    box_delivery_marketplace_coef_expr?: string;
    box_delivery_marketplace_liter?: string | number;
    box_storage_base?: string | number;
    box_storage_coef_expr?: string;
    box_storage_liter?: string | number;
}

export class GoogleSheetsService {
    private sheets: sheets_v4.Sheets;

    constructor() {
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SPREADSHEET_ID) {
            throw new Error(`'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY' and 'GOOGLE_SPREADSHEET_ID' are required. Check credentials in .env file`);
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // replace escaped newlines
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    async updateSheet(spreadsheetId: string, date: string, tariffs: Tariff[]): Promise<void> {
        try {
            // prepare data for gsheets
            const headers = [
                'Warehouse Name',
                'Geo Name',
                'Delivery Base',
                'Delivery Coef',
                'Delivery Liter',
                'Marketplace Delivery Base',
                'Marketplace Delivery Coef',
                'Marketplace Delivery Liter',
                'Storage Base',
                'Storage Coef',
                'Storage Liter'
            ];

            const values = tariffs.map(tariff => [
                tariff.warehouse_name,
                tariff.geo_name || '',
                tariff.box_delivery_base || '',
                tariff.box_delivery_coef_expr || '',
                tariff.box_delivery_liter || '',
                tariff.box_delivery_marketplace_base || '',
                tariff.box_delivery_marketplace_coef_expr || '',
                tariff.box_delivery_marketplace_liter || '',
                tariff.box_storage_base || '',
                tariff.box_storage_coef_expr || '',
                tariff.box_storage_liter || '',
            ]);

            // clear existing data in sheet
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: 'stocks_coefs!A:Z',
            });

            // update with new data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'stocks_coefs!A1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[date], headers, ...values],
                },
            });

            console.log(`Updated Google Sheet '${spreadsheetId}' with '${tariffs.length}' tariff records`);
        } catch (error) {
            console.error(`Error updating Google Sheet '${spreadsheetId}':`, error);
            throw error;
        }
    }
}
