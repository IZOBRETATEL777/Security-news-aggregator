export class Container {
    private map: Map<string, unknown> = new Map();

    register<T>(key: string, value: T): void {
        this.map.set(key, value);
    }

    resolve<T>(key: string): T {
        return this.map.get(key) as T;
    }
}

export const container = new Container();