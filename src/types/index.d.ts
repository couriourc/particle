declare type FnOrValue<ReturnType> = ((...args: any[]) => ReturnType) | ReturnType

export declare interface VectorBasic {
    x: number;
    y: number;
}

declare type VectorBasicMatrix = ([number, number])[]
