import {Test, TestingModule} from '@nestjs/testing';
import {DatasetService} from './dataset.service';
import {GenericFunction} from '../generic-function';
import {DatabaseService} from '../../../database/database.service';

describe('DatasetService', () => {
    let service: DatasetService;
    const data = {
        "input": {
            "type": "object",
            "required": [
                "dataset_name",
                "dataset"
            ],
            "properties": {
                "dataset": {
                    "type": "object",
                    "required": [
                        "items"
                    ],
                    "properties": {
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": [
                                    "school_id",
                                    "grade"
                                ],
                                "properties": {

                                    "grade": {
                                        "type": "string"
                                    },
                                    "school_id": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "groupBy": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": [
                                    "date",
                                    "school_id",
                                    "grade"
                                ],
                                "properties": {
                                    "date": {
                                        "type": "string"
                                    },
                                    "grade": {
                                        "type": "string"
                                    },
                                    "school_id": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "aggregate": {
                            "type": "object",
                            "required": [
                                "function",
                                "targetTable",
                                "columns"
                            ],
                            "properties": {
                                "columns": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "column": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "total_students": {
                                                            "type": "string"
                                                        },
                                                        "students_attendance_marked": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "function": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "sum": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                },
                                "updateCols": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "sum": {
                                                "type": "number"
                                            },
                                            "count": {
                                                "type": "number"
                                            },
                                            "percentage": {
                                                "type": "number"
                                            }
                                        }
                                    }
                                },
                                "targetTable": {
                                    "type": "object",
                                    "properties": {
                                        "ingestion.student_attendance_by_class": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "dimensions": {
                    "type": "object",
                    "properties": {
                        "table": {
                            "type": "object",
                            "properties": {
                                "ingestion.student_attendance": {
                                    "type": "string"
                                }
                            }
                        },
                        "column": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "school_id": {
                                        "type": "string"
                                    },
                                    "cluster_id": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "merge_On_Col": {
                            "type": "object",
                            "properties": {
                                "school_id": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "dataset_name": {
                    "type": "string"
                }
            }
        },
        "dataset_name": "student_attendance_by_class",
        "ingestion_type": "dataset"
    };

    const mockDatabaseService = {
        executeQuery: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce([{dataset_data: data}]).mockReturnValueOnce([{dataset_data: data}])
            .mockReturnValueOnce([{dataset_data: data}]).mockImplementation(() => {
                throw new Error()
            })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, DatasetService, GenericFunction,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService
                },
                {
                    provide: DatasetService,
                    useClass: DatasetService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ],
        }).compile();
        service = module.get<DatasetService>(DatasetService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('No Dataset Found', async () => {
        const Datasetdto = {
            "dataset_name": "student_attendance_by",
            "dataset": {
                "items": [{
                    "school_id": "6677",
                    "grade": "t"
                }]
            }
        };

        let resultOutput =
            {code: 400, error: "No dataset found"};

        expect(await service.createDataset(Datasetdto)).toStrictEqual(resultOutput);

    });

    it('Validation Error', async () => {
        const Datasetdto = {
            "dataset_name": "student_attendance_by",
            "dataset": {
                "items": [{
                    "school_id": 6677,
                    "grade": "t"
                }]
            }
        };

        let resultOutput =
            {
                code: 400, error: [
                    {
                        "instancePath": "/dataset/items/0/school_id",
                        "schemaPath": "#/properties/dataset/properties/items/items/properties/school_id/type",
                        "keyword": "type",
                        "params": {
                            "type": "string"
                        },
                        "message": "must be string"
                    }
                ]
            };

        expect(await service.createDataset(Datasetdto)).toStrictEqual(resultOutput);

    });

    it('Dataset Added Successfully', async () => {
        const Datasetdto = {
            "dataset_name": "student_attendance_by_class",
            "dataset": {
                "items": [{
                    "school_id": "6677",
                    "grade": "t"
                }]
            }
        };

        let resultOutput =
            {code: 200, message: "Dataset added successfully"};

        expect(await service.createDataset(Datasetdto)).toStrictEqual(resultOutput);

    });

    it('Dataset Name is Missing', async () => {
        const Datasetdto = {
            "dataset_name": "",
            "dataset": {
                "items": [{
                    "school_id": "6677",
                    "grade": "t"
                }]
            }
        };

        let resultOutput =
            {code: 400, error: "Dataset name is missing"};

        expect(await service.createDataset(Datasetdto)).toStrictEqual(resultOutput);

    });

    it('Exception', async () => {

        const mockError = {
            executeQuery: jest.fn().mockImplementation(() => {
                    throw Error("exception test")
                })
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, DatasetService, GenericFunction,
                {
                    provide: DatabaseService,
                    useValue: mockError
                },
                {
                    provide: DatasetService,
                    useClass: DatasetService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ],
        }).compile();
        let localService:DatasetService = module.get<DatasetService>(DatasetService);
        const Datasetdto = {
            "dataset_name": "student_attendance_by_classss",
            "dataset": {
                "items": [{
                    "school_id": "6677",
                    "grade": "t"
                }]
            }
        };

        let resultOutput = "Error: exception test";

        try {
            await localService.createDataset(Datasetdto);
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });
});
