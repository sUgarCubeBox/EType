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
var React = require("react");
var react_bootstrap_1 = require("react-bootstrap");
var TypingView = (function (_super) {
    __extends(TypingView, _super);
    function TypingView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypingView.prototype.render = function () {
        return (React.createElement(react_bootstrap_1.Grid, null,
            React.createElement(react_bootstrap_1.Row, null,
                React.createElement("p", null,
                    "\u30BF\u30A4\u30D7\u6570 : ",
                    this.props.typingState.correctCount,
                    " \u30DF\u30B9\u6570 : ",
                    this.props.typingState.missCount,
                    " \u6700\u9AD8\u30BF\u30A4\u30D4\u30F3\u30B0\u901F\u5EA6 : ",
                    this.props.typingState.maxSpeed.toFixed(1),
                    "(type/s) "),
                React.createElement(react_bootstrap_1.Panel, null,
                    React.createElement(react_bootstrap_1.Panel.Body, null,
                        React.createElement(MeanView, { mean: this.props.typingState.mean }),
                        React.createElement(WordView, { typed: this.props.typingState.typed, left: this.props.typingState.left }))))));
    };
    return TypingView;
}(React.Component));
exports.TypingView = TypingView;
var WordView = (function (_super) {
    __extends(WordView, _super);
    function WordView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WordView.prototype.render = function () {
        return (React.createElement("div", null,
            React.createElement("span", { style: { color: "orange" } }, this.props.typed),
            React.createElement("span", { style: { color: "silver" } }, this.props.left)));
    };
    return WordView;
}(React.Component));
var MeanView = (function (_super) {
    __extends(MeanView, _super);
    function MeanView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MeanView.prototype.render = function () {
        return (React.createElement("div", null,
            React.createElement("span", null, this.props.mean)));
    };
    return MeanView;
}(React.Component));
//# sourceMappingURL=TypingView.js.map