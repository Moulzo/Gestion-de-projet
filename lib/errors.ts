export class ActionError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "ActionError";
        this.status = status;
    }
}
