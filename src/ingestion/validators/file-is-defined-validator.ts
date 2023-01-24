import { FileValidator } from "@nestjs/common";
import {Express} from 'express';

export class FileIsDefinedValidator extends FileValidator {
    constructor() {
        // parent class constructor requires any object as
        // argument, i think it is type mistake, so i pass
        // empty object
        super({});
    }

    isValid(file?: Express.Multer.File): boolean {
        return !!file;
    }
    buildErrorMessage(): string {
        return "File is not defined";
    }
}