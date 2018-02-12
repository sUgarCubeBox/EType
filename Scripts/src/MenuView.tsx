// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Well, Grid, Col, Row } from 'react-bootstrap';
import { ITypingState, Entry, TypingStateAggregater } from './TypingModel';

interface StartMenuProp {
    onstart: () => void; // スタートボタンが押された時に呼ばれる
}

export class StartMenu extends React.Component<StartMenuProp, {}> {
    render() {
        return (
            <div>
                <h1>Etype</h1>
                <p>英単語のタイピングとその単語の意味も学べます。</p>
                <Button onClick={this.props.onstart.bind(this)}>Start</Button>
            </div>
        );
    }
}

interface ResultProp {
    finalState: ITypingState;
    onReturn: () => void;
    onRetry: () => void;
    onStudyMissedWord: () => void;
};

export class ResultMenu extends React.Component<ResultProp, {}> {
    render() {
        return (
            <Grid>
                <Row>
                    <Col>
                        <h1>リザルト</h1>
                        <ValueResultView finalState={this.props.finalState} />
                        <Button onClick={this.props.onReturn.bind(this)}>タイトルへ</Button>
                        <Button onClick={this.props.onRetry.bind(this)}>再挑戦</Button>
                        <Button onClick={this.props.onStudyMissedWord.bind(this)}>間違った単語のみ挑戦</Button>
                    </Col>
                    <Col>
                        <h1>ミスタイプした場所</h1>
                        <MissTypedMapView missTypedMap={this.props.finalState.missTypedMap} words={this.props.finalState.words} />
                    </Col>
                </Row>
            </Grid>);
    }
}

interface ValueResultProp {
    finalState: ITypingState;
}

/// 数値系の結果表示
class ValueResultView extends React.Component<ValueResultProp, {}> {
    timeStringify(time: Date): string {
        var seconds = time.getSeconds();
        var minutes = time.getMinutes();
        var hours = time.getHours();

        var strSeconds = seconds + "秒";
        var strMinutes = 0 < minutes || 0 < hours ? minutes + "分" : "";
        var strHours = 0 < hours ? hours + "時間" : "";

        return strHours + strMinutes + strSeconds;
    }

    render() {
        // スコアなどの集計をするオブジェクト
        var aggregater = new TypingStateAggregater(this.props.finalState);
    
        return (
            <div>
                <p>スコア : {aggregater.CalcScore()}</p>
                <p>ランク : {aggregater.CalcRank()}</p>
                <p>タイプ数 : {this.props.finalState.correctCount}</p>
                <p>ミス数 : {this.props.finalState.missCount}</p>
                <p>WPM : {aggregater.CalcWPM().toFixed(0)}</p>
                <p>時間 : {this.timeStringify(aggregater.CalcSpan())}</p>
                <p>最高瞬間タイピング速度 : {this.props.finalState.maxSpeed.toFixed(1) + "(タイプ/秒)"}</p>
            </div>);
    }
}

interface MissTypedMapViewProp {
    missTypedMap: number[][];
    words: Entry[];
}

/// ミスマップの結果表示
class MissTypedMapView extends React.Component<MissTypedMapViewProp, {}>{
    createRow(missTypedLine: number[], word: string) {
        var row = missTypedLine.map((missCount, index) => 0 < missCount ? <span style={{ color: "red" }}>{word.charAt(index)}</span > : <span>{word.charAt(index)}</span>);
        return (
            <p>{row}</p>
        );
    }

    createMap(missTypedMap: number[][], words: Entry[]) {
        var table = missTypedMap.map((missTypedLine, index) => this.createRow(missTypedLine, words[index].Word));
        return (
            <div>{table}</div>
        );
    }

    render() {
        return (
            <Well>{this.createMap(this.props.missTypedMap, this.props.words)}</Well>
        );
    }
}
