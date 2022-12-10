export function hookToMethod(object: any, methodName: string, hook: Function) {
    const originalMethod = object[methodName];
    object[methodName] = function (...args: any[]) {
        hook.call(this, ...args);
        return originalMethod.call(this, ...args);
    };
}