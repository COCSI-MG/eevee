export enum StashError {
    OPEN = "DATABASE_OPEN_ERROR",
    NOT_OPEN = "DATABASE_NOT_OPEN"
}

export class FileStashError extends Error {
   constructor(
    message: string,
    readonly errorCode: string,
    details?: unknown
   ) {
    super(message, details);
   }
}

export class FileStashOpenError extends FileStashError {
    constructor(
        details?: unknown
    ) {
        super("Error while opening connection with database", StashError.OPEN, details)
    }
}

export class FileStashConnectionNotOpenError extends FileStashError {
    constructor(
    ) {
        super("Connection with database is not open", StashError.NOT_OPEN);
    }
}

export class StoreError extends FileStashError {
    constructor(
        message: string
    ) {
        super(message, "STORE_ERROR")
    }
}