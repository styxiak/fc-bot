
export function changeEmptyToVal(value: string, result = ' '): string {
    if (!value) {
        return result;
    }

    if (value.length === 0 ) {
        return result;
    }

    return value;

}
