import * as React from 'react';
import { Well, Panel } from 'react-bootstrap';

export interface TypingViewProp extends WordViewProp, MeanViewProp {
    correctCount: number;
    missCount: number;
}

export class TypingView extends React.Component<TypingViewProp, {}> {
    render() {
        return (
            <div>
                <p>タイプ数 : {this.props.correctCount} ミス数 : {this.props.missCount}</p>
                <Panel>
                    <Panel.Body>
                        <MeanView mean={this.props.mean} />
                        <WordView typed={this.props.typed} left={this.props.left} />
                    </Panel.Body>
                </Panel>
            </div>
        );
    }
}

interface WordViewProp {
    typed: string;
    left: string;
}

class WordView extends React.Component<WordViewProp, {}> {
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
