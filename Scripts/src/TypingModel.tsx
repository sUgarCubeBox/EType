// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX

import './SpanWindow';
import { Queue } from 'typescript-collections';
import { Observable, Subject } from 'rxjs/Rx';

export class Processor {
    private words: Array<Entry>;
    private wordIndex: number;
    private cursor: number;

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
        this.FinishAsObservable().subscribe(x => this.OnFinish());
    }

    private OnFinish() {
        [this.missTypeSubject,
        this.correctTypeSubject,
        this.nextWordSubject,
        this.finishSubject,
        this.startSubject,
        this.skipSubject].forEach(x => x.complete()); // dispose observation
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
        if (this.IsFinished) {
            this.finishSubject.next({});
            return;
        }
        this.wordIndex++;
        this.cursor = 0;
        this.nextWordSubject.next({});
    }

    private get IsEntered(): boolean {
        return this.CurrentWord.length <= this.cursor;
    }

    private get IsFinished(): boolean {
        return this.words.length - 1 === this.wordIndex && this.IsEntered;
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

    public get Words(): Entry[] {
        return this.words;
    }

    public get Cursor(): number {
        return this.cursor;
    }

    public get WordIndex(): number {
        return this.wordIndex;
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
    readonly left: string;
    readonly typed: string;
    readonly mean: string;
    readonly missCount: number;
    readonly correctCount: number;
    readonly timeOverCount: number;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly maxSpeed: number;
    readonly missTypedMap: number[][];
    readonly words: Entry[];
    readonly missedWords: Entry[];
}

export class Watcher {
    private processor: Processor;
    private state: TypingState;

    public get State(): ITypingState { return this.state; }

    public StateChangeAsObservable() {
        var p = this.processor;
        return p.StartAsObservable()
            .merge(p.CorrectAsObservable(),
            p.MissAsObservable(),
            p.NextWordAsObservable(),
            p.FinishAsObservable(),
            p.SkipAsObservable())
            .map(_ => this.State);
    }

    constructor(processor: Processor) {
        this.processor = processor;
        var state = new TypingState(this.processor.Words);
        this.state = state;
        this.Bind(this.processor, this.state);
    }

    private Bind(p: Processor, state: TypingState) {
        // start

        p.StartAsObservable().merge(p.NextWordAsObservable(), p.CorrectAsObservable()).subscribe(_ => {
            state.typed = p.Typed;
            state.left = p.Left;
            state.mean = p.NowTypingEntry.Mean;
        });

        p.StartAsObservable().subscribe(x => state.startTime = new Date(Date.now()));
        p.CorrectAsObservable().subscribe(x => state.correctCount++);
        p.MissAsObservable().subscribe(x => state.missCount++);
        p.SkipAsObservable().subscribe(x => state.timeOverCount++);
        p.FinishAsObservable().subscribe(x => state.endTime = new Date(Date.now()));
        p.StartAsObservable().subscribe(x => this.BindMaxSpeedCalculation(p, state));
        p.StartAsObservable().subscribe(x => this.BindMissTypedRecording(p, state));
    }

    private BindMaxSpeedCalculation(p: Processor, state: TypingState) {
        // calc max speed
        p.CorrectAsObservable()
            .map(x => Date.now())
            .map(x => [x, x]) // diagonal map
            .scan((prevPair, diagonalPair) => [prevPair[1], diagonalPair[0]], [0, 0])
            .map(x => x[1] - x[0]) // time between keydowns
            .spanWindow<number>(5) // buffering events by sliding window
            .map(x => x.reduce((s, x) => s + x) / x.length) // window average
            .scan((min, x) => x < min ? x : min, Number.MAX_VALUE)
            .distinctUntilChanged()
            .subscribe(x => state.maxSpeed = 1000 / x);
    }

    private BindMissTypedRecording(p: Processor, state: TypingState) {
        p.MissAsObservable()
            .map(_ => p.NowTypingEntry)
            .distinctUntilChanged()
            .subscribe(x => state.missedWords.push(x));

        p.MissAsObservable()
            .map(x => [p.Cursor, p.WordIndex])
            .subscribe(x => state.missTypedMap[x[1]][x[0]] += 1); // record misstyped position
    }
}

class TypingState implements ITypingState {
    left: string;
    typed: string;
    mean: string;
    missCount: number = 0;
    correctCount: number = 0;
    timeOverCount: number = 0;
    startTime: Date = null;
    endTime: Date = null;
    maxSpeed: number = 0;
    missTypedMap: number[][];
    words: Entry[];
    missedWords: Entry[];

    constructor(words: Entry[]) {
        this.missTypedMap = Array<number[]>(words.length);
        this.missedWords = Array<Entry>();
        this.words = words;
        this.words.map(x => x.Word).forEach((x, i) => {
            var t = new Array<number>(x.length);
            for (var j = 0; j < x.length; j++) // init 2 dims array with 0.
                t[j] = 0;
            this.missTypedMap[i] = t;
        });
    }
}

class Rank {
    score: number;
    rank: string;
    constructor(score: number, rank: string) {
        this.score = score;
        this.rank = rank;
    }
}

/// スコアとかを集計する
export class TypingStateAggregater {
    private state: ITypingState;

    constructor(state: ITypingState) {
        this.state = state;
    }

    public get State(): ITypingState { return this.state };

    public CalcSpanMilliseconds(): number {
        var startTime = this.state.startTime.getTime();
        var endTime = this.state.endTime.getTime();

        return endTime - startTime;
    }

    public CalcSpanDate(): Date {
        var ret = new Date();
        ret.setTime((this.CalcSpanMilliseconds()) + (ret.getTimezoneOffset() * 60 * 1000));
        return ret;
    }

    public CalcWPM(): number {
        var spanTimeOfMinutes = this.CalcSpanMilliseconds() / (1000 * 60);
        var typed = this.state.correctCount;

        // [minute] = [millisecond] / (1000 * 60);
        return typed / spanTimeOfMinutes;
    };

    public CalcScore(): number {
        return this.CalcWPM() + this.state.maxSpeed * 1 - this.state.missCount * 5;
    }

    public CalcRank(): string {
        var score = this.CalcScore();
        var map: Rank[] = [
            new Rank(100, "タイパー研究生"),
            new Rank(200, "デビュータイパー"),
            new Rank(300, "メジャータイパー"),
            new Rank(400, "トップタイパー"),
            new Rank(550, "神タイパー")
        ];

        var rank = "ゲスト";
        map.forEach(r => {
            if (r.score <= score)
                rank = r.rank;
        });

        return rank;
    }
}

export interface IDifficultyOption {
    readonly name: string;
    readonly size: number;
    readonly averageLength: number;
    readonly discription: string;
    readonly requestEndpoint: string;
}

class DifficultyOption implements IDifficultyOption {
    public name: string;
    public size: number; // size of the word set in this difficulty option
    public averageLength: number; // average length of letters of words in this difficulty option
    public discription: string;
    public requestEndpoint: string;

    constructor(name: string, size: number, averageLength: number, discription: string, endpoint: string) {
        this.name = name;
        this.size = size;
        this.averageLength = averageLength;
        this.discription = discription;
        this.requestEndpoint = endpoint;
    }
}

export class WordsRequestClient {
    private apihost: string;

    constructor(apihost: string) {
        this.apihost = apihost;
    }

    public RequestOptions(): IDifficultyOption[] {
        // test object
        return [
            new DifficultyOption("テストデータ", 7, 6, "テストのデータ", "/test"),
            new DifficultyOption("テストデータ2", 7, 6, "テスト2のデータ", "/test"),
        ];
    }

    public RuquestWords(endpoint: string): Entry[] {
        // test words
        switch (endpoint) {
            case "/test": return [
                new Entry("apple", "りんご"),
                new Entry("programming", "プログラミング"),
                new Entry("note", "メモ帳"),
                new Entry("terminal", "端末"),
                new Entry("extra", "余計な"),
                new Entry("clock", "時計"),
                new Entry("time", "時間")
            ];
            default: return [];
        }
    }
}