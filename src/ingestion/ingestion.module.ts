import { HttpCustomService } from './services/HttpCustomService';
import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {DatabaseModule} from 'src/database/database.module';
import {IngestionController} from './controller/ingestion.controller';
import { DatasetService } from './services/dataset/dataset.service';
import { DimensionService } from './services/dimension/dimension.service';
import { PipelineService } from './services/pipeline/pipeline.service';
import { EventService } from './services/event/event.service';
import { GenericFunction } from './services/generic-function';
import {CsvImportService} from "./services/csvImport/csvImport.service";
import { FileStatusService } from './services/file-status/file-status.service';
@Module({
    controllers: [IngestionController],
    providers: [DatasetService,DimensionService,PipelineService,EventService ,GenericFunction, HttpCustomService, CsvImportService, FileStatusService],
    imports: [DatabaseModule, HttpModule]
})
export class IngestionModule {
}
