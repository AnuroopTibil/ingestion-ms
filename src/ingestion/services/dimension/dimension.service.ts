import {Injectable} from '@nestjs/common';
import {IngestionDatasetQuery} from '../../query/ingestionQuery';
import {DatabaseService} from '../../../database/database.service';
import {GenericFunction} from '../generic-function';
import {Dimension} from '../../interfaces/Ingestion-data'

@Injectable()
export class DimensionService {
    constructor(private DatabaseService: DatabaseService, private service: GenericFunction) {
    }

    async createDimension(inputData: Dimension) {
        try {
            if (inputData.dimension_name) {
                const dimensionName = inputData.dimension_name;
                const queryStr = await IngestionDatasetQuery.getDimension(dimensionName);
                const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                if (queryResult?.length === 1) {
                    const isValidSchema: any = await this.service.ajvValidator(queryResult[0].dimension_data.input, inputData);
                    if (isValidSchema.errors) {
                        return {
                            code: 400,
                            error: isValidSchema.errors
                        }
                    } else {
                        await this.service.writeToCSVFile(dimensionName + '_dimension', inputData.dimension);
                        return {
                            code: 200,
                            message: "Dimension added successfully"
                        }
                    }
                } else {
                    return {
                        code: 400,
                        error: "No dimension found"
                    }
                }
            } else {
                return {
                    code: 400,
                    error: "Dimension name is missing"
                }
            }
        } catch (e) {
            console.error('create-dimension-impl.executeQueryAndReturnResults:', e.message);
            throw new Error(e);
        }
    }
}
