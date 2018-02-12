// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Rx";
import { Queue } from "typescript-collections";

Observable.prototype.spanWindow = function <T>(size: number) {
    return new Observable((observer : Observer<T[]>) => {
        var windowQueue = new Queue<T>();
        var windowObserver = {
            next: (x : T) => {
                console.log(x);
                windowQueue.enqueue(x);
                if(size < windowQueue.size()){
                    windowQueue.dequeue();
                }
                var array = new Array<T>();
                windowQueue.forEach(x => { array.push(x); });
                observer.next(array);
            },
            error: (err : any) => observer.error(err),
            complete: () => observer.complete()};
        
        this.subscribe(windowObserver);
    });
}

declare module "rxjs/Observable" {
    export interface Observable<T> {
        spanWindow<T>(size: number): Observable<T[]>;
    }
}
