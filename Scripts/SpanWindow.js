"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
var Observable_1 = require("rxjs/Observable");
var typescript_collections_1 = require("typescript-collections");
Observable_1.Observable.prototype.spanWindow = function (size) {
    var _this = this;
    return new Observable_1.Observable(function (observer) {
        var windowQueue = new typescript_collections_1.Queue();
        var windowObserver = {
            next: function (x) {
                windowQueue.enqueue(x);
                if (size < windowQueue.size()) {
                    windowQueue.dequeue();
                }
                var array = new Array();
                windowQueue.forEach(function (x) { array.push(x); });
                observer.next(array);
            },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        };
        _this.subscribe(windowObserver);
    });
};
//# sourceMappingURL=SpanWindow.js.map