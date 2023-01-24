import {Injectable} from "@nestjs/common";
import {HttpCustomService} from "../HttpCustomService";
import {Result} from "../../interfaces/Ingestion-data";
import {GenericFunction} from "../generic-function";
import {ReadStream} from "fs";

const fs = require('fs');
const {parse} = require('@fast-csv/parse');

let csvImportSchema = {
    "type": "object",
    "properties": {
        "ingestion_type": {
            "type": "string",
            "enum": [
                "event",
                "dataset",
                "dimension"
            ]
        },
        "ingestion_name": {
            "type": "string",
            "shouldnotnull": true
        }
    },
    "required": [
        "ingestion_type",
        "ingestion_name"
    ]
};

interface CSVInputBodyInterface {
    ingestion_type: string;
    ingestion_name: string;
}

@Injectable()
export class CsvImportService {
    constructor(private http: HttpCustomService, private service: GenericFunction) {
    }

    async readAndParseFile(inputBody: CSVInputBodyInterface, fileCompletePath: string): Promise<Result> {
        return new Promise(async (resolve, reject) => {
            const isValidSchema: any = await this.service.ajvValidator(csvImportSchema, inputBody);
            if (isValidSchema.errors) {
                reject({code: 400, error: isValidSchema.errors});
            } else {
                const ingestionType = inputBody.ingestion_type, ingestionName = inputBody.ingestion_name;

                const batchLimit: number = 100000;
                let batchCounter: number = 0,
                    ingestionTypeBodyArray: any = [];
                const csvReadStream = fs.createReadStream(fileCompletePath)
                    .pipe(parse({headers: true}))
                    .on('data', (csvrow) => {

                        let numberChecking: number;
                        for (let key in csvrow) {
                            numberChecking = Number(csvrow[key]);
                            if (!isNaN(numberChecking)) {
                                csvrow[key] = numberChecking;
                            }
                        }
                        batchCounter++;
                        ingestionTypeBodyArray.push({...csvrow});
                        if (batchCounter > batchLimit) {
                            batchCounter = 0;
                            csvReadStream.pause();
                            this.resetAndMakeAPICall(ingestionType, ingestionName, ingestionTypeBodyArray, csvReadStream);
                            ingestionTypeBodyArray = []
                        }
                    })
                    .on('error', (err) => {
                        console.error('Steam error -> : ', err);
                        // delete the file
                        fs.unlinkSync(fileCompletePath);
                        reject({code: 400, error: err.message});

                    })
                    .on('end', async () => {
                        try {
                            // flush the remaining csv data to API
                            if (ingestionTypeBodyArray.length > 0) {
                                batchCounter = 0;
                                await this.resetAndMakeAPICall(ingestionType, ingestionName, ingestionTypeBodyArray, csvReadStream, true);
                                ingestionTypeBodyArray = undefined
                            }
                        } catch (apiErr) {
                            let apiErrorData: any = {};
                            apiErrorData = JSON.parse(apiErr.message);
                            reject({code: 400, error: apiErrorData.message});
                        }
                        // delete the file
                        fs.unlinkSync(fileCompletePath);
                        resolve({code: 200, message: 'CSV Uploaded Successfully'});
                    });
            }
        });
    }

    async resetAndMakeAPICall(ingestionType: string, ingestionName: string, ingestionTypeBodyArray: any[],
                              csvReadStream: ReadStream, isEnd = false) {
        let postBody: any = {};
        const url: string = process.env.URL + `/ingestion/${ingestionType}`;
        const mainKey = ingestionType + '_name';
        postBody[mainKey] = ingestionName;
        if (ingestionType === 'dataset') {
            postBody[ingestionType] = {
                "items": [...ingestionTypeBodyArray]
            }
        } else {
            postBody[ingestionType] = [...ingestionTypeBodyArray];
        }
        try {
            await this.http.post(url, postBody);
            if (!isEnd) {
                csvReadStream.resume();
            }
        } catch (apiErr) {
            if (isEnd) {
                throw new Error(JSON.stringify(apiErr.response?.data || apiErr.message))
            } else {
                csvReadStream.destroy(apiErr.response?.data || apiErr.message);
            }
            return;
        }
    }
}