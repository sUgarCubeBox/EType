import * as React from "react";
import * as ReactDOM from "react-dom";
import { TypingView, TypingViewProp } from "./TypingView";
import { Entry, Processor, Watcher, ITypingState, WordsRequestClient, IDifficultyOption } from "./TypingModel";
import { StartMenu, ResultMenu, DifficultySelectView } from './MenuView'
import * as Rx from "rxjs"

enum Scene {
    Start,
    SelectDifficulty,
    Game,
    Result
};

interface TypingAppState extends TypingViewProp {
    scene: Scene;
}

class TypingApp extends React.Component<{}, TypingAppState> {
    private processor: Processor;
    private watcher: Watcher;
    private missedWords: Entry[];

    constructor(props: any) {
        super(props);
        this.state = {
            scene: Scene.Start,
            left: "",
            typed: "",
            mean: "",
            correctCount: 0,
            missCount: 0,
            maxSpeed: 0
        };
    }

    private OnStartApp() {
        this.setState({ scene: Scene.Start });
    }

    private OnResult(finalState: ITypingState) {
        this.setState({ scene: Scene.Result });
    }

    private OnSelectDifficulty() {
        this.setState({ scene: Scene.SelectDifficulty });
    }

    private GetOptions(): IDifficultyOption[]{
        return new WordsRequestClient("/test").RequestOptions();
    }

    private OnSelectedDifficulty(option: IDifficultyOption) {
        var words = new WordsRequestClient("/test").RuquestWords(option.requestEndpoint);
        this.OnStartGame(words);
    }

    private OnStartGame(words: Entry[]) {
        this.processor = new Processor(words);
        this.watcher = new Watcher(this.processor);
        this.missedWords = new Array<Entry>();

        var keyStream = Rx.Observable.fromEvent<KeyboardEvent>(document, 'keydown').publish();
        keyStream
            .map(x => x.key)
            .subscribe(x => this.processor.Enter(x));
        keyStream.subscribe(x => this.OnGameStateChanged());
        var keyStreamConnection = keyStream.connect();

        this.processor.FinishAsObservable().take(1).subscribe(_ => {
            this.missedWords = this.watcher.State.missedWords;
            keyStreamConnection.unsubscribe();
            this.OnResult(this.watcher.State);
        });

        this.setState({ scene: Scene.Game });
        this.processor.Start();
        this.OnGameStateChanged();
    }

    private OnStartGameWithMissedTypedWords() {
        if (0 < this.missedWords.length) {
            this.OnStartGame(this.missedWords);
        }
        else {
            this.OnStartApp();
        }
    }

    private OnGameStateChanged() {
        this.setState(this.GameState);
    }

    private get GameState(): any {
        return {
            left: this.processor.Left,
            typed: this.processor.Typed,
            mean: this.processor.NowTypingEntry.Mean,
            correctCount: this.watcher.State.correctCount,
            missCount: this.watcher.State.missCount,
            maxSpeed: this.watcher.State.maxSpeed
        };
    }

    render() {
        switch (this.state.scene) {
            case Scene.Start: return <StartMenu onstart={() => this.OnSelectDifficulty()} />;


            case Scene.SelectDifficulty: return <DifficultySelectView
                options={this.GetOptions()}
                onSelect={(option) => this.OnSelectedDifficulty(option)} />


            case Scene.Game: return <TypingView
                left={this.state.left}
                typed={this.state.typed}
                correctCount={this.state.correctCount}
                maxSpeed={this.state.maxSpeed}
                missCount={this.state.missCount}
                mean={this.state.mean} />;


            case Scene.Result: return <ResultMenu
                finalState={this.watcher.State}
                onRetry={() => this.OnStartGame(this.watcher.State.words)}
                onReturn={() => this.OnStartApp()}
                onStudyMissedWord={() => this.OnStartGameWithMissedTypedWords()} />;


            default: return "";
        }
    }

}

ReactDOM.render(
    <div>
        <TypingApp />
    </div>,
    document.getElementById("container")
);