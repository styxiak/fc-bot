
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

export function enumToString(enumObject: any) {
    return (Object.values(enumObject).filter(value => typeof value === 'string') as string[])
        .map((val) => `${val}`)
        .join(', ');
}
