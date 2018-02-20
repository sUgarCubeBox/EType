"use strict";
// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
Object.defineProperty(exports, "__esModule", { value: true });
var TypingModel_1 = require("../TypingModel");
var chai_1 = require("chai");
require("mocha");
/// check a behaviour of the processor on each state.
describe('processor', function () {
    var words = [
        new TypingModel_1.Entry("apple", "りんご"),
        new TypingModel_1.Entry("programming", "プログラミング"),
        new TypingModel_1.Entry("note", "メモ帳")
    ];
    var processor;
    var subscriptions = new Array();
    beforeEach(function () {
        processor = new TypingModel_1.Processor(words);
    });
    describe('on initial state', function () {
        it('should show 1st words', function () {
            chai_1.assert.equal(processor.NowTypingEntry, words[0]);
        });
        it('should show 2nd words with NextTypingEntry', function () {
            chai_1.assert.equal(processor.NextTypingEntry, words[1]);
        });
        it('should show a word of the 1st entry with Left', function () {
            chai_1.assert.equal(processor.Left, 'apple');
        });
        it('should show "" with Typed', function () {
            chai_1.assert.equal(processor.Typed, "");
        });
    });
    it('should emits start event when start', function () {
        var startCount = 0;
        var sub = processor.StartAsObservable().subscribe(function (_) { return startCount++; });
        subscriptions.push(sub);
        processor.Start();
        chai_1.assert.equal(startCount, 1);
    });
    describe('after start', function () {
        beforeEach(function () {
            processor.Start();
        });
        it('should emits correct typed event when one correct letter is inputted', function () {
            var correctTypeCount = 0;
            var sub = processor.CorrectAsObservable().subscribe(function (_) { return correctTypeCount++; });
            subscriptions.push(sub);
            processor.Enter('a');
            chai_1.assert.equal(correctTypeCount, 1);
        });
        it('should emits miss typed event when one wrong is inputted', function () {
            var missTypedCount = 0;
            var sub = processor.MissAsObservable().subscribe(function (_) { return missTypedCount++; });
            subscriptions.push(sub);
            processor.Enter('b');
            chai_1.assert.equal(missTypedCount, 1);
        });
        describe('after one correct letter is inputted', function () {
            beforeEach(function () {
                processor.Enter('a');
            });
            it('should show one letter with Typed', function () {
                chai_1.assert.equal(processor.Typed, 'a');
            });
            it('should show left letters with Left', function () {
                chai_1.assert.equal(processor.Left, 'pple');
            });
        });
        describe('just before last letter of current word is inputted', function () {
            beforeEach(function () {
                var correctLetters = ['a', 'p', 'p', 'l'];
                correctLetters.forEach(function (x) { return processor.Enter(x); });
            });
            it('should emits next word event when last letter is inputted', function () {
                var nextWordEventCount = 0;
                var sub = processor.NextWordAsObservable().subscribe(function (_) { return nextWordEventCount++; });
                subscriptions.push(sub);
                processor.Enter('e');
                chai_1.assert.equal(nextWordEventCount, 1);
            });
        });
        describe('after change to 2nd word', function () {
            beforeEach(function () {
                var correctLetters = ['a', 'p', 'p', 'l', 'e'];
                correctLetters.forEach(function (x) { return processor.Enter(x); });
            });
            it('should show 2nd word', function () {
                chai_1.assert.equal(processor.NowTypingEntry, words[1]);
            });
            it('should show 3rd word with NextTypingEntry', function () {
                chai_1.assert.equal(processor.NextTypingEntry, words[2]);
            });
            it('should show letters of 2nd word with Left', function () {
                chai_1.assert.equal(processor.Left, "programming");
            });
            it('should show "" with Typed', function () {
                chai_1.assert.equal(processor.Typed, "");
            });
        });
        describe('just before last letter of "last" word is inputted', function () {
            beforeEach(function () {
                var correctLetters = [
                    'a', 'p', 'p', 'l', 'e',
                    'p', 'r', 'o', 'g', 'r', 'a', 'm', 'm', 'i', 'n', 'g',
                    'n', 'o', 't'
                ];
                correctLetters.forEach(function (x) { return processor.Enter(x); });
            });
            it('should emits finish event when last letter is inputted', function () {
                var finishEventCount = 0;
                var sub = processor.FinishAsObservable().subscribe(function (_) { return finishEventCount++; });
                subscriptions.push(sub);
                processor.Enter('e');
                chai_1.assert.equal(finishEventCount, 1);
            });
        });
    });
    afterEach(function () {
        subscriptions.forEach(function (s) {
            s.unsubscribe();
        });
        subscriptions = new Array();
    });
});
//# sourceMappingURL=test.js.map