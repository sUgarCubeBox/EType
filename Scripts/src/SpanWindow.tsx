// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Rx";
//import { Queue } from "typescript-collections";

/// typescript-collectionsのQueue使うと警告がでるから自前で実装
class Queue<T> {
    private list : T[];

    public constructor() {
        this.list = [];
    }

    public enqueue(elem: T) : void {
        this.list.push(elem);
    }

    public dequeue() : T {
        var top = this.list[0]
        this.list = this.list.slice(1, this.list.length);
        return top;
    }

    public get peek() : T {
        if (this.list.length == 0)
            throw new Error("no element in queue.");

        return this.list[0];
    }

    public size() : number {
        return this.list.length;
    }

    public forEach<T2>(selector : (elem : T) => T2 ) : void {
        return this.list.forEach(selector);
    }
}

// イベントを窓でバッファリングする。
// buffer()とは違って、窓が一イベントごとにスライドする。
Observable.prototype.spanWindow = function <T>(size: number) {
    return new Observable((observer : Observer<T[]>) => {
        var windowQueue = new Queue<T>();
        var windowObserver = {
            next: (x : T) => {
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