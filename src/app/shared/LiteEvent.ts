// tslint:disable:callable-types
export interface ILiteEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
}

export class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    on(handler: { (data?: T): void }): void {
        this.handlers.push(handler);
    }

    off(handler: { (data?: T): void }): void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    trigger(data?: T): void {
        this.handlers.slice(0).forEach(h => h(data));
    }

    expose(): ILiteEvent<T> {
        return this;
    }
}
