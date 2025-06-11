const registrations = new Map();
export const dynamicImport = async (specifier) => {
    const module = registrations.get(specifier);
    if (module !== undefined) {
        return module;
    }
    else {
        return await import(specifier);
    }
};
export const registerDynamicImport = (specifier, module) => {
    registrations.set(specifier, module);
};
//# sourceMappingURL=index.js.map