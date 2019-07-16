import * as React from 'react';
import { Well, Panel, Grid, Row } from 'react-bootstrap';
import { ITypingState } from './Model'

export interface TypingViewProp {
    typingState: ITypingState;
}

export class TypingView extends React.Component<TypingViewProp, {}> {
    render() {
        return (
            <Grid>
                <Row>
                    <p>タイプ数 : {this.props.typingState.correctCount} ミス数 : {this.props.typingState.missCount} 最高タイピング速度 : {this.props.typingState.maxSpeed.toFixed(1)}(type/s) </p>
                    <Panel>
                        <Panel.Body>
                            <MeanView mean={this.props.typingState.mean} />
                            <WordView typed={this.props.typingState.typed} left={this.props.typingState.left} />
                        </Panel.Body>
                    </Panel>
                </Row>
            </Grid>
        );
    }
}

interface WordViewProp {
    typed: string;
    left: string;
}

export class WordView extends React.Component<WordViewProp, {}> {
    render() {
        return (
            <div>
                <span style={{ color: "orange" }}>{this.props.typed}</span><span style={{ color: "silver" }}>{this.props.left}</span>
            </div>
        );
    }
}

interface MeanViewProp {
    mean: string;
}

class MeanView extends React.Component<MeanViewProp, {}>{
    render() {
        return (
            <div>
                <span>{this.props.mean}</span>
            </div>
        );
    }
}

interface CountDownViewProp {
    count: number;
    finish: boolean;
}

export class CountDownView extends React.Component<CountDownViewProp> {
    countString(): string {
        return this.props.finish ? "スタート" : this.props.count.toString();
    }

    render() {
        return (
            <Grid>
                <Row>
                    <p>タイプ数 : - ミス数 : - 最高タイピング速度 : ???(type/s) </p>
                    <Panel>
                        <Panel.Body style={{ textAlign: "center" }}>
                            <p style={{ color: "orange" }}>{this.countString()}</p>
                        </Panel.Body>
                    </Panel>
                </Row>
            </Grid>);
    }
}
