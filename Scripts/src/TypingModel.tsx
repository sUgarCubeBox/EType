// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX

import './SpanWindow';
import { Queue } from 'typescript-collections';
import { Observable, Subject } from 'rxjs/Rx';

export class Processor {
    private words: Array<Entry>; // immutable
    private wordIndex: number; // state
    private cursor: number; // state

    // subjects
    private missTypeSubject = new Subject<{}>();
    private correctTypeSubject = new Subject<{}>();
    private nextWordSubject = new Subject<{}>();
    private finishSubject = new Subject<{}>();
    private startSubject = new Subject<{}>();
    private skipSubject = new Subject<{}>();

    public MissAsObservable(): Observable<{}> { return this.missTypeSubject; }
    public CorrectAsObservable(): Observable<{}> { return this.correctTypeSubject; }
    public NextWordAsObservable(): Observable<{}> { return this.nextWordSubject; }
    public FinishAsObservable(): Observable<{}> { return this.finishSubject; }
    public StartAsObservable(): Observable<{}> { return this.startSubject; }
    public SkipAsObservable(): Observable<{}> { return this.skipSubject; }

    constructor(words: Array<Entry>) {
        this.cursor = 0;
        this.words = words;
        this.wordIndex = 0;
    }

    public Start() {
        this.cursor = 0;
        this.wordIndex = 0;
        this.startSubject.next({});
    }

    /// return true when typed letter is correct.
    public Enter(letter: string): boolean {
        var currentLetter: string = this.CurrentLetter;
        if (letter === currentLetter) {
            this.cursor++;
            this.correctTypeSubject.next({});
            if (this.IsEntered) {
                this.NextWord();
            }
            return true;
        } else {
            this.missTypeSubject.next({});
            return false;
        }
    }

    // use to time over or giveup
    public Skip() {
        this.skipSubject.next({});
        this.NextWord();
    }

    private NextWord() {
        this.wordIndex++;
        this.cursor = 0;
        this.nextWordSubject.next({});
    }

    private get IsEntered(): boolean {
        return this.cursor === this.CurrentWord.length;
    }

    private get IsFinish(): boolean {
        return this.wordIndex === this.words.length;
    }

    private get CurrentWord(): string {
        return this.NowTypingEntry.Word;
    }

    private get CurrentLetter(): string {
        return this.CurrentWord.charAt(this.cursor);
    }

    public get Typed(): string {
        return this.CurrentWord.substr(0, this.cursor);
    }

    public get Left(): string {
        return this.CurrentWord.substr(this.cursor, this.CurrentWord.length);
    }

    public get NowTypingEntry(): Entry {
        return this.words[this.wordIndex];
    }

    public get NextTypingEntry(): Entry {
        var nextIndex = this.wordIndex + 1;
        return nextIndex < this.words.length ? this.words[nextIndex] : null;
    }
}

export class Entry {

    private word: string;
    private mean: string;

    public get Word(): string { return this.word; }
    public get Mean(): string { return this.mean; }

    constructor(word: string, mean: string) {
        this.word = word;
        this.mean = mean;
    }

    public static CreateFromJsonArray(jsonArrayStr: string): Array<Entry> {
        return JSON.parse(jsonArrayStr);
    }
}

export interface ITypingState {
    readonly missCount: number;
    readonly correctCount: number;
    readonly timeOverCount: number;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly maxSpeed: number;
}

export class Watcher {
    private processor: Processor;
    private state: TypingState;

    public get State(): ITypingState { return this.state; }

    constructor(processor: Processor) {
        this.processor = processor;
        this.state = new TypingState();
        this.Bind(this.processor, this.state);
    }

    private Bind(p: Processor, state: TypingState) {
        // start
        p.StartAsObservable().subscribe(x => state.startTime = new Date(Date.now()));
        p.CorrectAsObservable().subscribe(x => state.correctCount++);
        p.MissAsObservable().subscribe(x => state.missCount++);
        p.SkipAsObservable().subscribe(x => state.timeOverCount++);
        p.FinishAsObservable().subscribe(x => state.endTime = new Date(Date.now()));

        console.log(p.CorrectAsObservable());

        // calc max speed
        p.CorrectAsObservable()
         .map(x => Date.now())
         .map(x => [x, x]) // diagonal map
         .scan((prevPair, diagonalPair) => [prevPair[1], diagonalPair[0]] ,[0, 0])
         .map(x => x[1] - x[0]) // time between keydowns
         .spanWindow<number>(5) // buffering events by sliding window
         .map(x => x.reduce((s, x) => s + x) / x.length) // window average
         .scan((min, x) => x < min ? x : min, Number.MAX_VALUE)
         .distinctUntilChanged()
         .do(x => console.log(x))
         .subscribe(x => state.maxSpeed = 1000 / new Date(x).getMilliseconds());         
    }
}

export class TypingState implements ITypingState {
    missCount: number = 0;
    correctCount: number = 0;
    timeOverCount: number = 0;
    startTime: Date = null;
    endTime: Date = null;
    maxSpeed: number = 0;
}
