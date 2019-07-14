import * as React from "react";
import * as ReactDOM from "react-dom";
import { TypingView, TypingViewProp, CountDownView } from "./GameView";
import { Entry, Processor, Watcher, ITypingState, WordsRequestClient, IDifficultyOption, ArrayShuffler } from "./Model";
import { StartMenu, ResultMenu, DifficultySelectMenu } from './MenuView'
import * as Rx from "rxjs"
import { defaultOptions, defaultEntries } from "./DefaultDifficulties"

enum Scene {
    Start,
    SelectDifficulty,
    CountDown,
    Game,
    Result
};

interface TypingAppState {
    scene: Scene;
    options: IDifficultyOption[];
    typingState: ITypingState;
    countdown: number;
}

class TypingApp extends React.Component<{}, TypingAppState> {
    private readonly apiClient = new WordsRequestClient("http://127.0.0.1:5000");

    constructor(props: any) {
        super(props);
        this.state = {
            scene: Scene.Start,
            typingState: null,
            options: null,
            countdown: Number.MAX_VALUE
        };
    }

    private OnStartApp() {
        this.setState({ scene: Scene.Start });
    }

    private OnResult(finalState: ITypingState) {
        this.setState({ scene: Scene.Result });
    }

    private OnSelectDifficulty() {
        // this.apiClient.RequestOptions()
        //     .then(options => this.setState({ scene: Scene.SelectDifficulty, options: options.concat(defaultOptions) }))
        //     .catch(x => this.setState({ scene: Scene.SelectDifficulty, options: defaultOptions})); // when request is rejected, app uses defaultOptions.
        this.setState({ scene: Scene.SelectDifficulty, options: defaultOptions});
    }

    private OnSelectedDifficulty(option: IDifficultyOption) {
        if (0 <= option.id) {
            this.apiClient.RuquestWords(option.id)
                .then(words => this.OnStartGame(words));
        }
        else {
            this.OnStartGame(ArrayShuffler.Shuffle(defaultEntries[-option.id - 1])); // when option.id is negative, app uses defaultEntries.
        }
    }

    private OnStartGame(words: Entry[]) {
        var processor = new Processor(words); // typing game engine
        var watcher = new Watcher(processor); // manager that observe state of the processor and aggregate it.

        /// bind keyboard events to typing game processor
        Rx.Observable.fromEvent<KeyboardEvent>(document, 'keydown')
            .skipUntil(processor.StartAsObservable())
            .takeUntil(watcher.FinishAsObservable())
            .do(x => console.log(x))
            .map(x => x.key)
            .subscribe(x => processor.Enter(x));

        /// bind state events to typing game view
        watcher.StateChangeAsObservable().subscribe(x => this.OnGameStateChanged(x));

        /// bind game finish events to result view
        watcher.FinishAsObservable().take(1).subscribe(_ => {
            processor.Close();
            this.OnResult(watcher.State); /// when finish game, app transit to result scene.
        });

        /// after count down, app transits to game scene and initialize game state
        this.setState({ scene: Scene.CountDown, countdown: 3 });
        Rx.Observable.interval(1000)
            .map(x => 1) // to number type
            .scan((acc, x) => acc - 1, 3) // calc next count
            .takeWhile(x => 0 < x) // if 0, emit complete signal
            .subscribe(
            x => this.setState({ countdown: x }),
            err => { },
            () => { // On complete, start games
                processor.Start();
                this.setState({ scene: Scene.Game });
                this.OnGameStateChanged(watcher.State);
            });
    }

    private OnStartGameWithMissedTypedWords() {
        var missedWords = this.state.typingState.missedWords;

        if (0 < missedWords.length) {
            this.OnStartGame(missedWords);
        }
        else {
            this.OnStartApp();
        }
    }

    private OnGameStateChanged(typingState: ITypingState) {
        this.setState({ typingState: typingState });
    }

    render() {
        switch (this.state.scene) {
            case Scene.Start: return <StartMenu onstart={() => this.OnSelectDifficulty()} />;


            case Scene.SelectDifficulty: return <DifficultySelectMenu
                options={this.state.options}
                onSelect={(option) => this.OnSelectedDifficulty(option)} />


            case Scene.CountDown: return <CountDownView
                count={this.state.countdown}
                finish={this.state.countdown == 0} />


            case Scene.Game: return <TypingView typingState={this.state.typingState} />;


            case Scene.Result: return <ResultMenu
                finalState={this.state.typingState}
                onRetry={() => this.OnStartGame(this.state.typingState.words)}
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