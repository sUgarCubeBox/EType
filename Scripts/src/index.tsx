import * as React from "react";
import * as ReactDOM from "react-dom";
import { TypingView, TypingViewProp } from "./TypingView";
import { Entry, Processor, Watcher, ITypingState, WordsRequestClient, IDifficultyOption } from "./TypingModel";
import { StartMenu, ResultMenu, DifficultySelectMenu } from './MenuView'
import * as Rx from "rxjs"

enum Scene {
    Start,
    SelectDifficulty,
    Game,
    Result
};

interface TypingAppState {
    scene: Scene;
    typingState: ITypingState;
}

class TypingApp extends React.Component<{}, TypingAppState> {
    constructor(props: any) {
        super(props);
        this.state = {
            scene: Scene.Start,
            typingState: null
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

    private GetOptions(): IDifficultyOption[] {
        return new WordsRequestClient("/test").RequestOptions();
    }

    private OnSelectedDifficulty(option: IDifficultyOption) {
        var words = new WordsRequestClient("/test").RuquestWords(option.requestEndpoint);
        this.OnStartGame(words);
    }

    private OnStartGame(words: Entry[]) {
        var processor = new Processor(words); // typing game engine
        var watcher = new Watcher(processor); // manager that observe state of the processor and aggregate it.

        /// bind keyboard events to typing game processor
        var keyStream = Rx.Observable.fromEvent<KeyboardEvent>(document, 'keydown')
            .map(x => x.key)
            .subscribe(x => processor.Enter(x));

        /// bind state events to typing game view
        watcher.StateChangeAsObservable().subscribe(x => this.OnGameStateChanged(x));

        /// bind game finish events to result view
        processor.FinishAsObservable().take(1).subscribe(_ => {
            keyStream.unsubscribe();
            this.OnResult(watcher.State); /// when finish game, app transit to result scene.
        });

        /// transit to game scene and initialize game state
        this.setState({ scene: Scene.Game });
        processor.Start();
        this.OnGameStateChanged(watcher.State);
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
                options={this.GetOptions()}
                onSelect={(option) => this.OnSelectedDifficulty(option)} />


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