class Container {
    private map = new Map<string, any>();

    register<T>(key: string | (new (...args: any[]) => T), value: T): void {
        const k = typeof key === 'string' ? key : key.name;
        this.map.set(k, value);
    }

    resolve<T>(key: string | (new (...args: any[]) => T)): T {
        const k = typeof key === 'string' ? key : key.name;
        const value = this.map.get(k);
        if (!value) {
            throw new Error(`No value registered for key: ${k}`);
        }
        return value as T;
    }
}

export const container = new Container();