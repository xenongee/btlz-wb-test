import axios, { AxiosError } from 'axios';
import env from '#config/env/env.js';

export interface WarehouseList {
    boxDeliveryBase: string;
    boxDeliveryCoefExpr: string;
    boxDeliveryLiter: string;
    boxDeliveryMarketplaceBase: string;
    boxDeliveryMarketplaceCoefExpr: string;
    boxDeliveryMarketplaceLiter: string;
    boxStorageBase: string;
    boxStorageCoefExpr: string;
    boxStorageLiter: string;
    geoName: string;
    warehouseName: string;
}

interface TariffsBoxResponse {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: WarehouseList[];
        };
    };
}

export class WBService {
    private readonly baseUrl = 'https://common-api.wildberries.ru/api/v1';
    private readonly token: string;

    constructor() {
        if (!env.WB_TOKEN) {
            throw new Error(`'WB_TOKEN' is required. Check credentials in .env file`);
        }
        this.token = env.WB_TOKEN;
    }

    async getTariffsBox(date: string): Promise<WarehouseList[]> {
        try {
            const response = await axios.get<TariffsBoxResponse>(
                `${this.baseUrl}/tariffs/box`,
                {
                    params: { date },
                    headers: {
                        'Authorization': this.token,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 sec
                }
            );

            if (response.status === 200 && response.data?.response?.data?.warehouseList) {
                return response.data.response.data.warehouseList;
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response?.status === 400) {
                    throw new Error('400 Bad request: Invalid date format?');
                } else if (axiosError.response?.status === 401) {
                    throw new Error('401 Unauthorized: Invalid WB token?');
                } else if (axiosError.response?.status === 429) {
                    throw new Error('429 Rate limit exceeded');
                } else {
                    throw new Error(`WB API error: ${axiosError.message}`);
                }
            } else {
                throw new Error(`Network error: ${error}`);
            }
        }
    }
}
