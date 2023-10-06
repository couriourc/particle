declare type FnOrValue<ReturnType> = ((...args: any[]) => ReturnType) | ReturnType

declare interface VectorBasic {
    x: number;
    y: number;
}

declare type VectorBasicMatrix = ([number, number])[]
