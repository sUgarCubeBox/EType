import './SpanWindow';
import { Observable, Subject } from 'rxjs/Rx';
import { Entry, Processor, TypingState, Watcher, ITypingState } from './Model';
import { type } from 'os';

export class CodeRow extends Entry {
    
    private whiteSpaceCount: number;
    
    public get WhiteSpaceCount(): number { return this.whiteSpaceCount; }

    constructor(coderow: string, row: number, whiteSpaceCount: number) {
        super(coderow, `line: ${row}`);
        this.whiteSpaceCount = whiteSpaceCount;
    }
}

export class SourceCode {
    private codes: CodeRow[];
    private discription: string;
    private plainCodes: string[];

    public get Codes(): CodeRow[] { return this.codes.concat([]); } // 外で破壊されたく無いから
    public get Discription(): string {return this.discription;}
    public get PlainCodes(): string[] { return this.plainCodes.concat([]); } // 同上

    constructor(plainCode: string, discription: string) {
        this.discription = discription;
        this.plainCodes = plainCode.split("\n");
        this.codes = [];
        this.plainCodes.forEach((s, i) => {
            let whiteSpaceCount: number = 0;
            while(s[0] != " ") { s.substr(1, s.length - 1);  } // 空白を除外
            this.codes.push(new CodeRow(s, i + 1, whiteSpaceCount));
        });
    }
}

export class SourceTypeProcessor extends Processor {

    protected nextCodeSubject: Subject<{}>;
    protected sourceCodeIndex: number; // 現在タイピングしてるソースコード
    protected tailIndeces: number[]; // それぞれのソースの末尾インデックス
    protected sources: SourceCode[];

    public get CurrentSourceCodeIndex(): number { return this.sourceCodeIndex; }
    public get CurrentRow(): number { 
        return this.wordIndex - (this.sourceCodeIndex == 0 ? 0 : this.tailIndeces[this.sourceCodeIndex - 1]);
    }
    public get Sources(): SourceCode[] { return this.sources.concat([]); }

    public NextCodeAsObservable(): Observable<{}> { return this.nextCodeSubject; }

    protected OnFinish() {
        super.OnFinish();
        this.nextCodeSubject.complete();
    }

    public Enter(letter: string): boolean {
        if (!this.isStarted)
            return false;

        let currentLetter: string = this.CurrentLetter;
        if (letter == "Space") currentLetter = " "; // 空白を受理
        if (letter === currentLetter) {
            this.cursor++;
            this.correctTypeSubject.next({});
            return true;
        } else if (this.IsEntered && letter == "Enter") { // すべて入力されたあとエンターを押すことを強制
            this.NextWord();
            if (this.tailIndeces[this.sourceCodeIndex] <= this.WordIndex) {
                this.nextCodeSubject.next({});
            }
        } else {
            this.missTypeSubject.next({});
            return false;
        }
    }

    public constructor(sourceCodes: SourceCode[]) {
        super(sourceCodes.flatMap(s => s.Codes));
        this.sourceCodeIndex = 0;
        let sum = 0;
        this.tailIndeces = sourceCodes.map(x => sum += x.Codes.length);
    }
}

export interface ISourceTypeState extends ITypingState {
    currentSourceCode: number;
    currentRow: number;
    sources: SourceCode[];
} 

export class SourceTypeState extends TypingState implements ITypingState {
    currentSourceCode: number = 0;
    currentRow: number = 0;
    sources: SourceCode[];

    constructor(words: Entry[], leftSelector: () => string, typedSelecor: () => string, meanSelector: () => string) {
        super(words, leftSelector, typedSelecor, meanSelector);
    }
}

export class SourceTypeWatcher extends Watcher {
    protected sourceTypeState: SourceTypeState;

    public constructor(sourceTypeProcessor: SourceTypeProcessor) {
        super(sourceTypeProcessor);
        this.sourceTypeState.sources = sourceTypeProcessor.Sources;
        sourceTypeProcessor.NextCodeAsObservable()
        .subscribe(() => { 
            this.sourceTypeState.currentSourceCode = sourceTypeProcessor.CurrentSourceCodeIndex;
            this.sourceTypeState.currentRow = sourceTypeProcessor.CurrentRow;
        });
    }

    public CreateState(processor: Processor): TypingState {
        return this.sourceTypeState = new SourceTypeState(
            processor.Words,
            () => this.processor.Left,
            () => this.processor.Typed,
            () => this.processor.NowTypingEntry.Mean
        );
    }
}