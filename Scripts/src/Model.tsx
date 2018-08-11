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
    private isStarted: boolean;

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
        this.isStarted = false;
    }

    public Start() {
        this.cursor = 0;
        this.wordIndex = 0;
        this.startSubject.next({});
        this.FinishAsObservable().subscribe(x => this.OnFinish());
        this.isStarted = true;
    }

    public Close() {
        this.finishSubject.complete();
    }

    private OnFinish() {
        [this.missTypeSubject,
        this.correctTypeSubject,
        this.nextWordSubject,
        this.startSubject,
        this.skipSubject].forEach(x => x.complete()); 
    }

    /// return true when typed letter is correct.
    public Enter(letter: string): boolean {
        if (!this.isStarted)
            return false;

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

    private finishSubject = new Subject<{}>();

    public FinishAsObservable(): Observable<{}> { return this.finishSubject; }

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
        var state = new TypingState(
            this.processor.Words,
            () => this.processor.Left,
            () => this.processor.Typed,
            () => this.processor.NowTypingEntry.Mean
        );
        this.state = state;
        this.Bind(this.processor, this.state);
    }

    private Bind(p: Processor, state: TypingState) {
        // start
        p.StartAsObservable().subscribe(x => state.startTime = new Date(Date.now()));
        p.CorrectAsObservable().subscribe(x => state.correctCount++);
        p.MissAsObservable().subscribe(x => state.missCount++);
        p.SkipAsObservable().subscribe(x => state.timeOverCount++);
        p.FinishAsObservable().subscribe(x => {
            state.endTime = new Date(Date.now())
            this.finishSubject.next({});
        });
        p.StartAsObservable().subscribe(x => this.BindMaxSpeedCalculation(p, state));
        p.StartAsObservable().subscribe(x => this.BindMissTypedRecording(p, state));
    }

    private BindMaxSpeedCalculation(p: Processor, state: TypingState) {
        // calc max speed
        p.CorrectAsObservable()
            .map(x => Date.now())
            .map(x => [x, x]) 
            .scan((prevPair, diagonalPair) => [prevPair[1], diagonalPair[0]], [0, 0])
            .map(x => x[1] - x[0]) 
            .spanWindow<number>(5) 
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
    missCount: number = 0;
    correctCount: number = 0;
    timeOverCount: number = 0;
    startTime: Date = null;
    endTime: Date = null;
    maxSpeed: number = 0;
    missTypedMap: number[][];
    words: Entry[];
    missedWords: Entry[];

    private leftSelector: () => string;
    private typedSelector: () => string;
    private meanSelector: () => string;

    get left(): string {
        return this.leftSelector();
    }
    get typed(): string {
        return this.typedSelector();
    }
    get mean(): string {
        return this.meanSelector();
    }

    constructor(words: Entry[], leftSelector: () => string, typedSelecor: () => string, meanSelector: () => string) {
        this.missTypedMap = Array<number[]>(words.length);
        this.missedWords = Array<Entry>();
        this.words = words;
        this.words.map(x => x.Word).forEach((x, i) => {
            var t = new Array<number>(x.length);
            for (var j = 0; j < x.length; j++) // init 2 dims array with 0.
                t[j] = 0;
            this.missTypedMap[i] = t;
        });

        this.leftSelector = leftSelector;
        this.typedSelector = typedSelecor;
        this.meanSelector = meanSelector;
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

        var rank = "見習いタイパー";
        map.forEach(r => {
            if (r.score <= score)
                rank = r.rank;
        });

        return rank;
    }
}

export interface IDifficultyOption {
    readonly id: number;
    readonly name: string;
    readonly size: number;
    readonly averageLength: number;
    readonly discription: string;
}

export class DifficultyOption implements IDifficultyOption {
    public id: number;
    public name: string;
    public size: number; // size of the word set in this difficulty option
    public averageLength: number; // average length of letters of words in this difficulty option
    public discription: string;

    constructor(id: number, name: string, size: number, averageLength: number, discription: string) {
        this.id = id;
        this.name = name;
        this.size = size;
        this.averageLength = averageLength;
        this.discription = discription;
    }
}

export class WordsRequestClient {
    private apihost: string;
    private readonly headers: Headers = new Headers({
        "Content-Type": "application/json",
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    });

    constructor(apihost: string) {
        this.apihost = apihost;
    }

    public RequestOptions(): Promise<IDifficultyOption[]> {
        return fetch(this.apihost + "/api", {
            method: "get",
            headers: this.headers
        })
            .then(res => res.json()
                .then(data => {
                    var array: IDifficultyOption[] = [];
                    data.forEach((x: any) => {
                        array.push(new DifficultyOption(x.id, x.name, x.size, x.average_length, x.discription))
                    });
                    return array;
                })
            );
    }

    public RuquestWords(id: number): Promise<Entry[]> {
        return fetch(this.apihost + "/api/words/" + id.toString(), {
            method: "get",
            headers: this.headers,
        })
            .then(res => res.json()
                .then(data => {
                    var array: Entry[] = [];
                    data.forEach((x: any) => {
                        array.push(new Entry(x.word, x.mean));
                    })
                    return array;
                })
            );
    }
}

export class ArrayShuffler {
    public static Shuffle<T>(array: Array<T>): Array<T> {
        var copied = array.concat();
        var dist: Array<T> = [];
        while (copied.length != 0) {
            var pickIndex = ArrayShuffler.GenerateRangedRandom(0, copied.length - 1);
            var pickElem = copied[pickIndex];
            copied.splice(pickIndex, 1);
            dist.push(pickElem)
        }
        return dist;
    }

    private static GenerateRangedRandom(start: number, end: number) {
        return Math.floor(Math.random() * end) + start;
    }
}