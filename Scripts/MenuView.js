"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
var React = require("react");
var react_bootstrap_1 = require("react-bootstrap");
var TypingModel_1 = require("./TypingModel");
var StartMenu = (function (_super) {
    __extends(StartMenu, _super);
    function StartMenu() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StartMenu.prototype.render = function () {
        var _this = this;
        return (React.createElement(react_bootstrap_1.Grid, null,
            React.createElement(react_bootstrap_1.Row, null,
                React.createElement("h1", null, "Etype"),
                React.createElement("p", null, "\u82F1\u5358\u8A9E\u306E\u30BF\u30A4\u30D4\u30F3\u30B0\u3068\u305D\u306E\u5358\u8A9E\u306E\u610F\u5473\u3082\u5B66\u3079\u307E\u3059\u3002"),
                React.createElement(react_bootstrap_1.Button, { onClick: function () { return _this.props.onstart(); } }, "Start"))));
    };
    return StartMenu;
}(React.Component));
exports.StartMenu = StartMenu;
;
var ResultMenu = (function (_super) {
    __extends(ResultMenu, _super);
    function ResultMenu() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ResultMenu.prototype.render = function () {
        var _this = this;
        return (React.createElement(react_bootstrap_1.Grid, null,
            React.createElement(react_bootstrap_1.Row, null,
                React.createElement(react_bootstrap_1.Col, { xs: 4 },
                    React.createElement("h1", null, "\u30EA\u30B6\u30EB\u30C8"),
                    React.createElement(ValueResultView, { finalState: this.props.finalState }),
                    React.createElement(react_bootstrap_1.Button, { onClick: function () { return _this.props.onReturn(); } }, "\u30BF\u30A4\u30C8\u30EB\u3078"),
                    React.createElement(react_bootstrap_1.Button, { onClick: function () { return _this.props.onRetry(); } }, "\u518D\u6311\u6226"),
                    React.createElement(react_bootstrap_1.Button, { disabled: 0 === this.props.finalState.missCount, onClick: function () { return _this.props.onStudyMissedWord(); } }, "\u9593\u9055\u3063\u305F\u5358\u8A9E\u306E\u307F\u6311\u6226")),
                React.createElement(react_bootstrap_1.Col, { xs: 8 },
                    React.createElement("h1", null, "\u30DF\u30B9\u30BF\u30A4\u30D7\u3057\u305F\u5834\u6240"),
                    React.createElement(MissTypedMapView, { missTypedMap: this.props.finalState.missTypedMap, words: this.props.finalState.words })))));
    };
    return ResultMenu;
}(React.Component));
exports.ResultMenu = ResultMenu;
/// 数値系の結果表示
var ValueResultView = (function (_super) {
    __extends(ValueResultView, _super);
    function ValueResultView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ValueResultView.prototype.timeStringify = function (time) {
        var seconds = time.getSeconds();
        var minutes = time.getMinutes();
        var hours = time.getHours();
        var strSeconds = seconds + "秒";
        var strMinutes = 0 < minutes || 0 < hours ? minutes + "分" : "";
        var strHours = 0 < hours ? hours + "時間" : "";
        return strHours + strMinutes + strSeconds;
    };
    ValueResultView.prototype.render = function () {
        // スコアなどの集計をするオブジェクト
        var aggregater = new TypingModel_1.TypingStateAggregater(this.props.finalState);
        return (React.createElement("div", null,
            React.createElement("p", null,
                "\u30B9\u30B3\u30A2 : ",
                aggregater.CalcScore().toFixed(0)),
            React.createElement("p", null,
                "\u30E9\u30F3\u30AF : ",
                aggregater.CalcRank()),
            React.createElement("p", null,
                "\u30BF\u30A4\u30D7\u6570 : ",
                this.props.finalState.correctCount),
            React.createElement("p", null,
                "\u30DF\u30B9\u6570 : ",
                this.props.finalState.missCount),
            React.createElement("p", null,
                "WPM : ",
                aggregater.CalcWPM().toFixed(0)),
            React.createElement("p", null,
                "\u6642\u9593 : ",
                this.timeStringify(aggregater.CalcSpanDate())),
            React.createElement("p", null,
                "\u6700\u9AD8\u77AC\u9593\u30BF\u30A4\u30D4\u30F3\u30B0\u901F\u5EA6 : ",
                this.props.finalState.maxSpeed.toFixed(1) + "(タイプ/秒)")));
    };
    return ValueResultView;
}(React.Component));
/// ミスマップの結果表示
var MissTypedMapView = (function (_super) {
    __extends(MissTypedMapView, _super);
    function MissTypedMapView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MissTypedMapView.prototype.createRow = function (missTypedLine, word, key) {
        var row = missTypedLine.map(function (missCount, index) { return 0 < missCount ? React.createElement("span", { key: index, style: { color: "red" } }, word.charAt(index)) : React.createElement("span", { key: index }, word.charAt(index)); });
        return (React.createElement("p", { key: key }, row));
    };
    MissTypedMapView.prototype.createMap = function (missTypedMap, words) {
        var _this = this;
        var table = missTypedMap.map(function (missTypedLine, index) { return _this.createRow(missTypedLine, words[index].Word, index); });
        return (React.createElement("div", null, table));
    };
    MissTypedMapView.prototype.render = function () {
        return (React.createElement(react_bootstrap_1.Well, null, this.createMap(this.props.missTypedMap, this.props.words)));
    };
    return MissTypedMapView;
}(React.Component));
var DifficultySelectMenu = (function (_super) {
    __extends(DifficultySelectMenu, _super);
    function DifficultySelectMenu() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DifficultySelectMenu.prototype.handleSelect = function (option) {
        this.props.onSelect(option);
    };
    DifficultySelectMenu.prototype.render = function () {
        var _this = this;
        var options = this.props.options.map(function (o, i) {
            return React.createElement(react_bootstrap_1.Panel, { key: i },
                React.createElement(DifficultyOptionView, { info: o, onClick: function (option) { return _this.handleSelect(option); } }));
        });
        return (React.createElement(react_bootstrap_1.Grid, null,
            React.createElement(react_bootstrap_1.Row, null,
                React.createElement("h1", null, "\u96E3\u6613\u5EA6\u30BB\u30EC\u30AF\u30C8"),
                React.createElement("p", null, "\u30D7\u30EC\u30A4\u96E3\u6613\u5EA6\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002")),
            options));
    };
    return DifficultySelectMenu;
}(React.Component));
exports.DifficultySelectMenu = DifficultySelectMenu;
var DifficultyOptionView = (function (_super) {
    __extends(DifficultyOptionView, _super);
    function DifficultyOptionView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DifficultyOptionView.prototype.handleSelect = function () {
        this.props.onClick(this.props.info);
    };
    DifficultyOptionView.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { onClick: function () { return _this.handleSelect(); } },
            React.createElement("h2", null, this.props.info.name),
            React.createElement("p", null,
                "\u30EF\u30FC\u30C9\u6570 : ",
                this.props.info.size,
                " \u5E73\u5747\u6587\u5B57\u6570 : ",
                this.props.info.averageLength),
            React.createElement("hr", null),
            React.createElement("p", null, this.props.info.discription)));
    };
    return DifficultyOptionView;
}(React.Component));
//# sourceMappingURL=MenuView.js.map