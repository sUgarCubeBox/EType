// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX

import { Subscription } from 'rxjs/Rx';
import { Processor, Watcher, Entry, TypingStateAggregater } from '../Model';
import { expect, assert } from 'chai';
import 'mocha';

/// processorの動作チェック
describe('processor', () => {
    var words: Entry[] = [ // test words
        new Entry("apple", "りんご"),
        new Entry("programming", "プログラミング"),
        new Entry("note", "メモ帳")
    ];
    var processor: Processor;
    var subscriptions: Array<Subscription> = new Array<Subscription>();

    beforeEach(() => {
        processor = new Processor(words);
    });

    describe('on initial state', () => {
        it('should show 1st words', () => {
            assert.equal(processor.NowTypingEntry, words[0]);
        });

        it('should show 2nd words with NextTypingEntry', () => {
            assert.equal(processor.NextTypingEntry, words[1]);
        });

        it('should show a word of the 1st entry with Left', () => {
            assert.equal(processor.Left, 'apple');
        });

        it('should show "" with Typed', () => {
            assert.equal(processor.Typed, "");
        });
    });

    it('should emits start event when start', () => {
        var startCount: number = 0;
        var sub = processor.StartAsObservable().subscribe(_ => startCount++);
        subscriptions.push(sub);
        processor.Start();
        assert.equal(startCount, 1);
    });

    describe('after start', () => {
        beforeEach(() => {
            processor.Start();
        });

        it('should emits correct typed event when one correct letter is inputted', () => {
            var correctTypeCount: number = 0;
            var sub = processor.CorrectAsObservable().subscribe(_ => correctTypeCount++);
            subscriptions.push(sub);
            processor.Enter('a');
            assert.equal(correctTypeCount, 1);
        });

        it('should emits miss typed event when one wrong is inputted', () => {
            var missTypedCount: number = 0;
            var sub = processor.MissAsObservable().subscribe(_ => missTypedCount++);
            subscriptions.push(sub);
            processor.Enter('b');
            assert.equal(missTypedCount, 1);
        });

        describe('after one correct letter is inputted', () => {
            beforeEach(() => {
                processor.Enter('a');
            });

            it('should show one letter with Typed', () => {
                assert.equal(processor.Typed, 'a');
            });

            it('should show left letters with Left', () => {
                assert.equal(processor.Left, 'pple');
            });
        });

        describe('just before last letter of current word is inputted', () => {
            beforeEach(() => {
                var correctLetters: Array<string> = ['a', 'p', 'p', 'l'];
                correctLetters.forEach(x => processor.Enter(x));
            });

            it('should emits next word event when last letter is inputted', () => {
                var nextWordEventCount = 0;
                var sub = processor.NextWordAsObservable().subscribe(_ => nextWordEventCount++);
                subscriptions.push(sub);
                processor.Enter('e');
                assert.equal(nextWordEventCount, 1);
            });
        });

        describe('after change to 2nd word', () => {
            beforeEach(() => {
                var correctLetters: Array<string> = ['a', 'p', 'p', 'l', 'e'];
                correctLetters.forEach(x => processor.Enter(x));
            });

            it('should show 2nd word', () => {
                assert.equal(processor.NowTypingEntry, words[1]);
            });

            it('should show 3rd word with NextTypingEntry', () => {
                assert.equal(processor.NextTypingEntry, words[2]);
            });

            it('should show letters of 2nd word with Left', () => {
                assert.equal(processor.Left, "programming");
            });

            it('should show "" with Typed', () => {
                assert.equal(processor.Typed, "");
            }); 
        });

        describe('just before last letter of "last" word is inputted', () => {
            beforeEach(() => {
                var correctLetters: Array<string> =
                    [
                        'a', 'p', 'p', 'l', 'e',
                        'p', 'r', 'o', 'g', 'r', 'a', 'm', 'm', 'i', 'n', 'g',
                        'n', 'o', 't'
                    ];

                correctLetters.forEach(x => processor.Enter(x));
            });

            it('should emits finish event when last letter is inputted', () => {
                var finishEventCount = 0;
                var sub = processor.FinishAsObservable().subscribe(_ => finishEventCount++);
                subscriptions.push(sub);
                processor.Enter('e');
                assert.equal(finishEventCount, 1);
            });
        });
    });

    afterEach(() => {
        subscriptions.forEach(s => {
            s.unsubscribe();
        });

        subscriptions = new Array<Subscription>();
    });
});