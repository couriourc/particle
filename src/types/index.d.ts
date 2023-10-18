export type FnOrValue<ReturnType> = ((...args: any[]) => ReturnType) | ReturnType

export interface VectorBasic {
    x: number;
    y: number;
    z?: number;
}

export type VectorBasicMatrix = ([number, number])[]
