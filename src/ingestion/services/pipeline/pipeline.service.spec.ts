import {Test, TestingModule} from '@nestjs/testing';
import {PipelineService} from './pipeline.service';
import {GenericFunction} from '../generic-function';
import {DatabaseService} from '../../../database/database.service';
import {DatasetService} from "../dataset/dataset.service";
import {HttpCustomService} from './../HttpCustomService';

describe('PipelineService', () => {
    let service: PipelineService;

    const mockHttpservice = {
        post: jest.fn().mockReturnValueOnce({data: {component: {id: 2}}}).mockReturnValue('response'),
        put: jest.fn(),
        get: jest.fn().mockReturnValueOnce({data: {component: {id: 1}}}).mockReturnValueOnce({
            data: {
                processGroupFlow: {
                    flow: {
                        processGroups: [{
                            component: {
                                id: 123,
                                name: "asd"
                            }
                        }]
                    }
                }
            }
        }).mockReturnValueOnce({data: {component: {id: 1}}}).mockReturnValueOnce({
            data: {
                processGroupFlow: {
                    flow: {
                        processGroups: [{
                            component: {
                                id: 123,
                                name: "abc"
                            }
                        }]
                    }
                }
            }
        }).mockReturnValueOnce({data: {component: {id: 3}}}).mockReturnValueOnce({data: {processGroupFlow: {id: 4}}}).mockReturnValueOnce({data: {processGroupFlow: {id: 5}}})
            .mockReturnValueOnce({data: {processGroupFlow: {id: 6}}}).mockReturnValueOnce({data: {processGroupFlow: {id: 7}}})
            .mockReturnValueOnce({
                data: {
                    processGroupFlow: {
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                }
                            }, {component: {name: "pythonCode", id: 2}},
                                {component: {name: "successLogMessage", id: 3}}, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    }
                                }]
                        }
                    }
                }
            })
            .mockReturnValueOnce({
                data: {
                    processGroupFlow: {
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                }
                            }, {component: {name: "pythonCode", id: 2}},
                                {component: {name: "successLogMessage", id: 3}}, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    }
                                }]
                        }
                    }
                }
            })
            .mockReturnValueOnce({
                data: {
                    processGroupFlow: {
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                }
                            }, {component: {name: "pythonCode", id: 2}},
                                {component: {name: "successLogMessage", id: 3}}, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    }
                                }]
                        }
                    }
                }
            })
            .mockReturnValueOnce({
                data: {
                    processGroupFlow: {
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                }
                            }, {component: {name: "pythonCode", id: 2}},
                                {component: {name: "successLogMessage", id: 3}}, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    }
                                }]
                        }
                    }
                }
            }).mockReturnValue({
                data: {
                    processGroupFlow: {
                        id: 1,
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                },
                                revision: {
                                    version: 1.1
                                }
                            }, {
                                component: {name: "pythonCode", id: 2},
                                revision: {
                                    version: 1.1
                                }
                            },
                                {
                                    component: {name: "successLogMessage", id: 3},
                                    revision: {
                                        version: 1.1
                                    }
                                }, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    },
                                    revision: {
                                        version: 1.1
                                    }
                                }]
                        }
                    }
                }
            })
    };

    const mockDatabaseService = {
        executeQuery: jest.fn().mockReturnValueOnce(0)
            .mockReturnValueOnce([{
                "transformer_file": "student_attendance_by_class.py",
                "event_name": "student_attendance",
                "dataset_name": "student_attendance_by_class"
            }]).mockReturnValueOnce([{
                "transformer_file": "student_attendance_by_class.py",
                "event_name": "student_attendance",
                "dataset_name": "student_attendance_by_class"
            }])
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, PipelineService, GenericFunction, HttpCustomService,
                {
                    provide: HttpCustomService,
                    useValue: mockHttpservice
                },
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
                },
                {
                    provide: PipelineService,
                    useClass: PipelineService
                }
            ],
        }).compile();
        service = module.get<PipelineService>(PipelineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it("Pipeline Name cannot be empty", async () => {
        const pipelineData = {
            "pipeline_name": "",
        };
        let resultOutput =
            {code: 400, error: "Pipeline name cannot be empty"};

        expect(await service.pipeline(pipelineData)).toStrictEqual(resultOutput);
    });

    it("No Pipeline Found", async () => {
        const pipelineData = {
            "pipeline_name": "asd"
        };
        let resultOutput =
            {code: 400, error: "No pipeline found"};

        expect(await service.pipeline(pipelineData)).toStrictEqual(resultOutput);
    });

    it("Processor Group Exists", async () => {
        const pipelineData = {
            "pipeline_name": "asd"
        };
        let resultOutput =
            {code: 200, message: "Processor group running successfully"};
        expect(await service.pipeline(pipelineData)).toStrictEqual(resultOutput);
    }, 70000);

    it("Processor Group Doesn't Exists", async () => {
        const pipelineData = {
            "pipeline_name": "asd"
        };
        let resultOutput =
            {code: 200, message: "Processor group running successfully"};

        expect(await service.pipeline(pipelineData)).toStrictEqual(resultOutput);
    }, 70000);

    it('Exception', async () => {

        const mockError = {
            executeQuery: jest.fn().mockImplementation(() => {
                throw Error("exception test")
            })
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, PipelineService, GenericFunction,
                {
                    provide: HttpCustomService,
                    useValue: mockHttpservice
                },
                {
                    provide: DatabaseService,
                    useValue: mockError
                },
                {
                    provide: PipelineService,
                    useClass: PipelineService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ],
        }).compile();
        let localService: PipelineService = module.get<PipelineService>(PipelineService);
        const pipelineData = {
            "pipeline_name": "asd"
        };

        let resultOutput = "Error: exception test";

        try {
            await localService.pipeline(pipelineData);
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });

    it('addProcessor Failed', async () => {

        const mockTransaction = {
            createQueryRunner: jest.fn().mockImplementation(() => ({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                release: jest.fn(),
                rollbackTransaction: jest.fn(),
                commitTransaction: jest.fn(),
            })),
            get: jest.fn().mockReturnValue({
                data: {
                    processGroupFlow: {
                        id: 1,
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                },
                                revision: {
                                    version: 1.1
                                }
                            }, {
                                component: {name: "pythonCode", id: 2},
                                revision: {
                                    version: 1.1
                                }
                            },
                                {
                                    component: {name: "successLogMessage", id: 3},
                                    revision: {
                                        version: 1.1
                                    }
                                }, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    },
                                    revision: {
                                        version: 1.1
                                    }
                                }]
                        }
                    }
                }
            }),
            post: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, PipelineService, GenericFunction, HttpCustomService,
                {
                    provide: HttpCustomService,
                    useValue: mockTransaction
                },
                {
                    provide: DatabaseService,
                    useValue: mockTransaction
                },
                {
                    provide: DatasetService,
                    useClass: DatasetService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                },
                {
                    provide: PipelineService,
                    useClass: PipelineService
                }
            ]
        }).compile();

        service = module.get<PipelineService>(PipelineService);

        let resultOutput = "Failed to create the processor";

        try {
            await service.addProcessor("student_attendance_by_class", "asd", 1);
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });

    it('addProcessorGroup Failed', async () => {

        const mockTransaction = {
            createQueryRunner: jest.fn().mockImplementation(() => ({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                release: jest.fn(),
                rollbackTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                query: jest.fn().mockReturnValueOnce({pid: 1})
                    .mockReturnValueOnce([{pid: 1}]).mockImplementation(() => {
                        throw Error("exception test")
                    })
            })),
            query: jest.fn().mockReturnValueOnce([{length: 1}]),
            get: jest.fn().mockReturnValueOnce({data: {component: {id: 1}}}),
            post: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, PipelineService, GenericFunction, HttpCustomService,
                {
                    provide: HttpCustomService,
                    useValue: mockTransaction
                },
                {
                    provide: DatabaseService,
                    useValue: mockTransaction
                },
                {
                    provide: DatasetService,
                    useClass: DatasetService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                },
                {
                    provide: PipelineService,
                    useClass: PipelineService
                }
            ]
        }).compile();

        service = module.get<PipelineService>(PipelineService);

        let resultOutput = "Failed to create the processor group";

        try {
            await service.addProcessorGroup("student_attendance_by_class");
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });

    it('connect Failed', async () => {

        const mockTransaction = {
            createQueryRunner: jest.fn().mockImplementation(() => ({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                release: jest.fn(),
                rollbackTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                query: jest.fn()
            })),
            query: jest.fn().mockReturnValueOnce([{length: 1}]),
            get: jest.fn().mockReturnValueOnce({
                data: {
                    processGroupFlow: {
                        id: 1,
                        flow: {
                            processors: [{
                                component: {
                                    name: "generateFlowFile",
                                    id: 1
                                },
                                revision: {
                                    version: 1.1
                                }
                            }, {
                                component: {name: "pythonCode", id: 2},
                                revision: {
                                    version: 1.1
                                }
                            },
                                {
                                    component: {name: "successLogMessage", id: 3},
                                    revision: {
                                        version: 1.1
                                    }
                                }, {
                                    component: {
                                        name: "failedLogMessage",
                                        id: 4
                                    },
                                    revision: {
                                        version: 1.1
                                    }
                                }]
                        }
                    }
                }
            }),
            post: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, PipelineService, GenericFunction, HttpCustomService,
                {
                    provide: HttpCustomService,
                    useValue: mockTransaction
                },
                {
                    provide: DatabaseService,
                    useValue: mockTransaction
                },
                {
                    provide: DatasetService,
                    useClass: DatasetService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                },
                {
                    provide: PipelineService,
                    useClass: PipelineService
                }
            ]
        }).compile();

        service = module.get<PipelineService>(PipelineService);

        let resultOutput = "message:Failed connected the processor from 1 to 2";

        try {
            await service.connect(1, 2, ["success"], 1);
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });
});
