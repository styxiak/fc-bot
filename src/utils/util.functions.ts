
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

export function numberToLength(value: string, maxLength?: number, decimal?:number)
{
    if (!maxLength) {
        maxLength = 6;
    }
    if (!decimal) {
        decimal = 2;
    }
    let length = value.length;
    let dotPosition = value.indexOf('.');
    let dotFromEnd = length - dotPosition;
    console.log(value, length, dotPosition, dotFromEnd);

    //doklejamy z tyłu
    let endCount = decimal+1;

    if (length >= dotFromEnd) {
        endCount = decimal - (dotFromEnd -1);
    }
    let padEnd = ''.padEnd(endCount);
    value = value + padEnd;
    value = value.padStart(maxLength);

    console.log(value, endCount);
    // if (dotPosition == 1) {
    //     endCount = 1;
    // } else if (dotPosition == )

    return value;
}
