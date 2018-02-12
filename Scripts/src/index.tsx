import * as React from "react";
import * as ReactDOM from "react-dom";
import * as View from "./TypingView";
import { Entry, Processor, Watcher } from "./TypingModel";
import * as Rx from "rxjs"

const words: Entry[] = [
    new Entry("apple", "りんご"),
    new Entry("programming", "プログラミング"),
    new Entry("note", "メモ帳"),
    new Entry("terminal", "端末"),
    new Entry("extra", "余計な"),
    new Entry("clock", "時計"),
    new Entry("time", "時間")
];


interface TypingAppState extends View.TypingViewProp {
    
}

class TypingApp extends React.Component<{}, TypingAppState> {
    private processor: Processor;
    private watcher: Watcher;
    private typingStream: Rx.Subscription;

    constructor(props: any) {
        super(props);
        this.processor = new Processor(words);
        this.watcher = new Watcher(this.processor);

        var keyStream = Rx.Observable.fromEvent<KeyboardEvent>(document, 'keydown').publish();
        keyStream
            .map(x => x.key)
            .do(x => console.log(x))
            .subscribe(x => this.processor.Enter(x)); 
        keyStream.subscribe(x => this.OnStateChanged());
        keyStream.connect();

        this.state = {
            left: this.processor.Left,
            typed: this.processor.Typed,
            mean: this.processor.NowTypingEntry.Mean,
            correctCount: this.watcher.State.correctCount,
            missCount: this.watcher.State.missCount
        };        
    }

    private OnStateChanged() {
        this.setState({
            left: this.processor.Left,
            typed: this.processor.Typed,
            mean: this.processor.NowTypingEntry.Mean,
            correctCount: this.watcher.State.correctCount,
            missCount: this.watcher.State.missCount});
    }

    render() {
        return (
            <View.TypingView
                mean={this.state.mean}
                left={this.state.left}
                missCount={this.state.missCount}
                correctCount={this.state.correctCount}
                typed={this.state.typed} />        
        );
    }

}

ReactDOM.render(
    <div>
        <TypingApp />
    </div>,
    document.getElementById("container")
);