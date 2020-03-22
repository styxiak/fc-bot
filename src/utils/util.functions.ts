
export function changeEmptyToVal(value: string, result = ' '): string {
    console.log(value);
    if (!value) {
        return result;
    }

    if (value.length === 0 ) {
        return result;
    }

    return value;

}
