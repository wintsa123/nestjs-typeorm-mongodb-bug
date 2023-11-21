
export class BizException {

    private readonly _errorCode;
    private readonly _errorMessage: string;

    get errorCode() {
        return this._errorCode;
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    protected constructor(errorEntity, errorMessage: string) {
        this._errorMessage = errorMessage;
        this._errorCode = errorEntity;
    }

    static create(errEntity, errMessage?: string): BizException {
        return new BizException(errEntity, errMessage as string);
    }
}