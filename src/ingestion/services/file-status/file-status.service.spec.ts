import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../database/database.service';
import { GenericFunction } from '../generic-function';
import { FileStatusService } from './file-status.service';

describe('FileStatusService', () => {
  let service: FileStatusService;
  const mockDatabaseService = {
    executeQuery: jest.fn().mockReturnValue([])
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, FileStatusService, GenericFunction,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService
        },
        {
          provide: FileStatusService,
          useClass: FileStatusService
        },
        {
          provide: GenericFunction,
          useClass: GenericFunction
        }],
    }).compile();

    service = module.get<FileStatusService>(FileStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('File name cannot be empty', async () => {
    let data = {
    }
    let result = {
      code: 400, error: [
        {
          "instancePath": "",
          "schemaPath": "#/required",
          "keyword": "required",
          "params": {
            "missingProperty": "filename"
          },
          "message": "must have required property 'filename'"
        }
      ]
    }
    expect(await service.getFileStatus(data)).toStrictEqual(result);
  });

  it('No records found', async () => {
    let data = {
      filename: "gggg"
    }
    let result = {
      "code": 400, "error": "No records found"
    }
    expect(await service.getFileStatus(data)).toStrictEqual(result)
  });

  it('Get the file status', async () => {

    const Mockdata = {
      file_status: "sdj"
    }
    const mockDatabaseService1 = {
      executeQuery: jest.fn().mockReturnValue([Mockdata])
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, FileStatusService, GenericFunction,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService1
        },
        {
          provide: FileStatusService,
          useClass: FileStatusService
        },
        {
          provide: GenericFunction,
          useClass: GenericFunction
        }],
    }).compile();
    service = module.get<FileStatusService>(FileStatusService);


    let data = {
      filename: "school_details"
    }
    let result = {
      "code": 200, "response": [
        {
          "file_status": "sdj"
        }
      ]
    }
    expect(await service.getFileStatus(data)).toStrictEqual(result)
  });

  it("exception", async () => {

    const Mockdata = {
      file_status: "sdj"
    }
    const mockError = {
      executeQuery: jest.fn().mockImplementation(() => {
        throw Error("exception test")
      })
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, FileStatusService, GenericFunction,
        {
          provide: DatabaseService,
          useValue: mockError
        },
        {
          provide: FileStatusService,
          useClass: FileStatusService
        },
        {
          provide: GenericFunction,
          useClass: GenericFunction
        }],
    }).compile();
    service = module.get<FileStatusService>(FileStatusService);

    let data = {
      filename: "dfdf"
    }
    let resultOutput = "Error: exception test";

    try {
      await service.getFileStatus(data);
    } catch (e) {
      expect(e.message).toEqual(resultOutput);
    }
  });


});
