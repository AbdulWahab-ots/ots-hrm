type Primitive = string | number | boolean | null | undefined | bigint;

export type NestedKeyLoad<T> = {
    [K in keyof T]?: T[K] extends (infer U)[]
      ? U extends object
        ?
            | {
                [P in keyof U]?: U[P] extends Primitive
                  ? boolean
                  : NestedKeyLoad<U[P]> | boolean;
              }
            | boolean
        : boolean
      : T[K] extends Primitive
      ? boolean
      : T[K] extends object
      ?
          | {
              [P in keyof T[K]]?: T[K][P] extends Primitive
                ? boolean
                : NestedKeyLoad<T[K][P]> | boolean;
            }
          | boolean
      : boolean;
  };
    
  export type NestedNonPrimitivePaths<T, Prefix extends string = ''> = {
      [K in keyof T]: T[K] extends Primitive 
        ? never 
        : T[K] extends Array<infer U> 
          ? (U extends Primitive 
              ? never 
              : (Prefix extends '' ? K : `${Prefix}.${string & K}`))
          : T[K] extends object
            ? (Prefix extends '' ? K : `${Prefix}.${string & K}`) | 
            NestedNonPrimitivePaths<T[K], Prefix extends '' ? `${string & K}` : `${Prefix}.${string & K}`>
            : never
    }[keyof T];
  
  export type NestedPaths<T, Prefix extends string = ''> = {
      [K in keyof T]: K extends string 
        ? T[K] extends Primitive 
          ? (Prefix extends '' ? K : `${Prefix}.${K}`)
          : T[K] extends Array<infer U> 
            ? (U extends Primitive 
                ? (Prefix extends '' ? K : `${Prefix}.${K}`)
                : (Prefix extends '' ? K : `${Prefix}.${K}`) | 
                NestedPaths<U, `${Prefix extends '' ? K : `${Prefix}.${K}`}.${number}`>)
            : T[K] extends object
              ? (Prefix extends '' ? K : `${Prefix}.${K}`) | 
              NestedPaths<T[K], Prefix extends '' ? `${K}` : `${Prefix}.${K}`>
              : never
        : never
    }[keyof T];