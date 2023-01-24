import {HttpStatus, Injectable, Res} from '@nestjs/common';
import {IngestionDatasetQuery} from '../../query/ingestionQuery';
import {DatabaseService} from '../../../database/database.service';
import {GenericFunction} from '../generic-function';
import {Dataset} from '../../interfaces/Ingestion-data'

@Injectable()
export class DatasetService {
    constructor(private DatabaseService: DatabaseService, private service: GenericFunction) {
    }

    async createDataset(inputData: Dataset) {
        try {
            if (inputData.dataset_name) {
                const datasetName = inputData.dataset_name;
                const queryStr = await IngestionDatasetQuery.getDataset(datasetName);
                const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                if (queryResult?.length === 1) {
                    const isValidSchema: any = await this.service.ajvValidator(queryResult[0].dataset_data.input, inputData);
                    if (isValidSchema.errors) {
                        return {
                            
                            code: 400,
                            error: isValidSchema.errors
                        }
                    } else {
                        await this.service.writeToCSVFile(datasetName, inputData.dataset["items"]);
                        return {
                            code: 200,
                            message: "Dataset added successfully"
                        }
                    }
                }
                else {
                    return {
                        code: 400,
                        error: "No dataset found"
                    }
                }
            } else {
                return {
                    code: 400,
                    error: "Dataset name is missing"
                }
            }
        } catch (e) {
            console.error('create-dataset executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }
    }
}
