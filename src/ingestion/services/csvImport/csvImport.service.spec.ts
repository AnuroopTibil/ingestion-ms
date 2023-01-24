import {Test, TestingModule} from '@nestjs/testing';
import {GenericFunction} from '../generic-function';
import {CsvImportService} from './csvImport.service';
import {HttpCustomService} from "../HttpCustomService";
import * as fs from 'fs';


const mockFilePath = './files/list.csv';

describe('csvImportService', () => {
    let service: CsvImportService;

    const mockHttpservice = {
        post: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HttpCustomService, GenericFunction, CsvImportService,
                {
                    provide: HttpCustomService,
                    useValue: mockHttpservice
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                },
                {
                    provide: CsvImportService,
                    useClass: CsvImportService
                }],
        }).compile();
        service = module.get<CsvImportService>(CsvImportService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('Validation Error', async () => {
        const inputData = {
            "ingestion_type": "test",
            "ingestion_name": "student_attendance"
        };
        let resultOutput = {
            code: 400,
            error: [
                {
                    instancePath: '/ingestion_type',
                    schemaPath: '#/properties/ingestion_type/enum',
                    keyword: 'enum',
                    params: {
                        allowedValues: [
                            "event",
                            "dataset",
                            "dimension"
                        ]
                    },
                    message: 'must be equal to one of the allowed values'
                }
            ]
        };
        try {
            await service.readAndParseFile(inputData, mockFilePath);
        } catch (e) {
            expect(e).toEqual(resultOutput);
        }
    });

    it('Valid large Input', async () => {
        const filePath = createNumberOfLineCSVFile(['school_id','grade','count'],1003,'list_valid_large.csv');

        const inputData = {
            "ingestion_type": "event",
            "ingestion_name": "student_attendance"
        };
        let resultOutput = {code: 200, message: 'CSV Uploaded Successfully'};
        expect(await service.readAndParseFile(inputData, filePath)).toStrictEqual(resultOutput);
    });

    it('valid small input',async()=>{
        const filePath = createNumberOfLineCSVFile(['school_id','grade','count'],100,'list_valid_small.csv');

        const inputData = {
            "ingestion_type": "event",
            "ingestion_name": "student_attendance"
        };
        let resultOutput = {code: 200, message: 'CSV Uploaded Successfully'};
        expect(await service.readAndParseFile(inputData, filePath)).toStrictEqual(resultOutput);
    });

    it('invalid less  csv format for api', async () => {
        const filePath = createNumberOfLineCSVFile(['school_id','grade'],100,'list_error_small.csv');
        await errorCSVTest(service,filePath)

    });

    it('invalid large  csv format for api', async () => {
        const filePath = createNumberOfLineCSVFile(['school_id','grade'],1001,'list_error_large.csv');
        await errorCSVTest(service,filePath)
    });

});

async function errorCSVTest(service,filePath){
    const errorResponse = {
        response: {
            data: {
                "message": [
                    {
                        "instancePath": "/event/0",
                        "schemaPath": "#/properties/event/items/required",
                        "keyword": "required",
                        "params": {
                            "missingProperty": "date"
                        },
                        "message": "must have required property 'date'"
                    }
                ]
            }
        }
    };
    const mockHttpservice = {
        post: jest.fn().mockImplementation(() => {
            throw errorResponse;
        })
    };
    const localModule: TestingModule = await Test.createTestingModule({
        providers: [HttpCustomService, GenericFunction, CsvImportService,
            {
                provide: HttpCustomService,
                useValue: mockHttpservice
            },
            {
                provide: GenericFunction,
                useClass: GenericFunction
            },
            {
                provide: CsvImportService,
                useClass: CsvImportService
            }],
    }).compile();
    service = localModule.get<CsvImportService>(CsvImportService);

    const inputData = {
        "ingestion_type": "event",
        "ingestion_name": "student_attendance"
    };
    let resultOutput = {code: 400, error: errorResponse.response.data.message};
    try {
        // promise reject is an error to be catched
        await service.readAndParseFile(inputData, filePath);
    } catch (someErr) {
        expect(someErr).toStrictEqual(resultOutput);
    }
}

// dynamically create csv file on specified number of line
function createNumberOfLineCSVFile(columns,csvNumberOfLine,fileName){
    let csvFileData = columns.join(',')+'\n';
    const columnLength = columns.length;
    let individualLine = [];
    for(let i=0;i<csvNumberOfLine;i++){
        individualLine=[];
        for(let j=1;j<=columnLength;j++){
            individualLine.push((i+j).toString());
        }
        csvFileData+=`${individualLine.join(',')}\n`
    }
    const dirName = './files/';
    createFile(dirName, fileName, csvFileData);
    return dirName+fileName;
}

const createFile = (
    path: string,
    fileName: string,
    data: string,
): void => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    fs.writeFileSync(`${path}/${fileName}`, data, 'utf8');

};