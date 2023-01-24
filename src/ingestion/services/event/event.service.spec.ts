import {Test, TestingModule} from '@nestjs/testing';
import {GenericFunction} from '../generic-function';
import {EventService} from './event.service';
import {DatabaseService} from '../../../database/database.service';

describe('EventService', () => {
    let service: EventService;
    const data = {
        "input": {
            "type": "object",
            "required": [
                "event_name",
                "event"
            ],
            "properties": {
                "event": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": [
                            "school_id",
                            "school_name"
                        ],
                        "properties": {
                            "school_id": {
                                "type": "string"
                            },
                            "school_name": {
                                "type": "string"
                            }
                        }
                    }
                },
                "event_name": {
                    "type": "string"
                }
            }
        },
        "event_name": "event",
        "ingestion_type": "event"
    };

    const mockDatabaseService = {
        executeQuery: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce([{event_data: data}])
            .mockReturnValueOnce([{event_data: data}])
            .mockReturnValueOnce([{event_data: data}])
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, EventService, GenericFunction,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService
                },
                {
                    provide: EventService,
                    useClass: EventService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }],
        }).compile();
        service = module.get<EventService>(EventService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('No Event Found', async () => {
        const eventData = {
            "event_name": "district",
            "event": [{
                "name": "jhaha",
                "district_id": "SH123"
            }]
        };
        let resultOutput =
            {code: 400, error: "No event found"};
        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput)
    });

    it('Validation Error', async () => {
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": 6677
            }]
        };

        let resultOutput =
            {
                code: 400, error: [
                    {
                        "instancePath": "/event/0",
                        "schemaPath": "#/properties/event/items/required",
                        "keyword": "required",
                        "params": {
                            "missingProperty": "school_name"
                        },
                        "message": "must have required property 'school_name'"
                    }
                ]
            };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);

    });

    it('Event Added Successfully', async () => {
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }]
        };

        let resultOutput =
            {code: 200, message: "Event added successfully"};

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);

    });

    it('Event Name is Missing', async () => {
        const eventData = {
            "event_name": "",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }]
        };

        let resultOutput =
            {code: 400, error: "Event name is missing"};

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);

    });

    it('Exception', async () => {

        const mockError = {
            executeQuery: jest.fn().mockImplementation(() => {
                throw Error("exception test")
            })
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, EventService, GenericFunction,
                {
                    provide: DatabaseService,
                    useValue: mockError
                },
                {
                    provide: EventService,
                    useClass: EventService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ],
        }).compile();
        let localService: EventService = module.get<EventService>(EventService);
        const Eventdto = {
            "event_name": "student_attendanceeee",
            "event": [{
                "school_id": "6677",
                "grade": "t"
            }]
        };

        let resultOutput = "Error: exception test";

        try {
            await localService.createEvent(Eventdto);
        } catch (e) {
            expect(e.message).toEqual(resultOutput);
        }
    });
});
