export interface ICoreAndDeps {
    $core: Object;
    $deps: Object;
    mappedPkgJSONDeps: Array<string>;
}
export declare const getCoreAndDeps: () => ICoreAndDeps;
