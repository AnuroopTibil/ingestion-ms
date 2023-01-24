import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import { urlencoded, json } from 'express';
import * as bodyParser from 'body-parser';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(json({ limit: '1000mb' }));
    app.use(urlencoded({ extended: true, limit: '1000mb' }));
    await app.listen(3000);
    //running on port 3000
}

bootstrap();
