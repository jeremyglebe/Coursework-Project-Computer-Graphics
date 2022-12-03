export function hookToMethod(target, methodName, hook) {
    const originalMethod = target[methodName];
    target[methodName] = function () {
        hook.apply(this, arguments);
        return originalMethod.apply(this, arguments);
    };
}