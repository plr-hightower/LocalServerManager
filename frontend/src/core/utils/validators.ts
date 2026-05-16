export const validateServerName = (name: string): boolean => {
    return name.trim().length > 0 && name.trim().length <= 30;
};

export const validateRAM = (ram: number): boolean => {
    return ram > 0 && ram <= 22;
}

