// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Well, Grid, Col, Row, Panel, PanelBody } from 'react-bootstrap';
import { ITypingState, Entry, TypingStateAggregater, IDifficultyOption } from './TypingModel';

interface StartMenuProp {
    onstart: () => void; // スタートボタンが押された時に呼ばれる
}

export class StartMenu extends React.Component<StartMenuProp, {}> {
    render() {
        return (
            <Grid>
                <Row>
                    <h1>Etype</h1>
                    <p>英単語のタイピングとその単語の意味も学べます。</p>
                    <Button onClick={() => this.props.onstart()}>Start</Button>
                </Row>
            </Grid>
        );
    }
}

interface ResultProp {
    finalState: ITypingState;
    onReturn: () => void; // タイトル画面へ
    onRetry: () => void; // 再挑戦
    onStudyMissedWord: () => void; // 誤った文字のみ挑戦
};

export class ResultMenu extends React.Component<ResultProp, {}> {
    render() {
        return (
            <Grid>
                <Row>
                    <Col xs={4}>
                        <h1>リザルト</h1>
                        <ValueResultView finalState={this.props.finalState} />
                        <Button onClick={() => this.props.onReturn()}>タイトルへ</Button>
                        <Button onClick={() => this.props.onRetry()}>再挑戦</Button>
                        <Button disabled={0 === this.props.finalState.missCount} onClick={() => this.props.onStudyMissedWord()}>間違った単語のみ挑戦</Button>
                    </Col>
                    <Col xs={8}>
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
                <p>スコア : {aggregater.CalcScore().toFixed(0)}</p>
                <p>ランク : {aggregater.CalcRank()}</p>
                <p>タイプ数 : {this.props.finalState.correctCount}</p>
                <p>ミス数 : {this.props.finalState.missCount}</p>
                <p>WPM : {aggregater.CalcWPM().toFixed(0)}</p>
                <p>時間 : {this.timeStringify(aggregater.CalcSpanDate())}</p>
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
    createRow(missTypedLine: number[], word: string, key: number) {
        var row = missTypedLine.map((missCount, index) => 0 < missCount ? <span key={index} style={{ color: "red" }}>{word.charAt(index)}</span > : <span key={index}>{word.charAt(index)}</span>);
        return (
            <p key={key}>{row}</p>
        );
    }

    createMap(missTypedMap: number[][], words: Entry[]) {
        var table = missTypedMap.map((missTypedLine, index) => this.createRow(missTypedLine, words[index].Word, index));
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

interface DifficultySelectViewProp {
    options: IDifficultyOption[];
    onSelect: (option: IDifficultyOption) => void;
}

export class DifficultySelectMenu extends React.Component<DifficultySelectViewProp, {}>{
    handleSelect(option: IDifficultyOption) {
        this.props.onSelect(option);
    }

    render() {
        var options = this.props.options.map((o, i) =>
            <Panel key={i}>
                <DifficultyOptionView info={o} onClick={(option: IDifficultyOption) => this.handleSelect(option)} />
            </Panel>);

        return (<Grid>
            <Row>
                <h1>難易度セレクト</h1>
                <p>プレイ難易度を選択してください。</p>
            </Row>
            {options}
        </Grid>);
    }
}

interface DifficultyOptionViewProp {
    info: IDifficultyOption,
    onClick: (option: IDifficultyOption) => void
}

class DifficultyOptionView extends React.Component<DifficultyOptionViewProp, {}>{
    handleSelect() {
        this.props.onClick(this.props.info);
    }

    render() {
        return (
            <div onClick={() => this.handleSelect()}>
                <h2>{this.props.info.name}</h2>
                <p>ワード数 : {this.props.info.size} 平均文字数 : {this.props.info.averageLength}</p>
                <hr />
                <p>{this.props.info.discription}</p>
            </div>
        );
    }
}
