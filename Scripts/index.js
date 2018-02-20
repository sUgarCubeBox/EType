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
var ReactDOM = require("react-dom");
var TypingView_1 = require("./TypingView");
var TypingModel_1 = require("./TypingModel");
var MenuView_1 = require("./MenuView");
var Rx = require("rxjs");
var Scene;
(function (Scene) {
    Scene[Scene["Start"] = 0] = "Start";
    Scene[Scene["SelectDifficulty"] = 1] = "SelectDifficulty";
    Scene[Scene["Game"] = 2] = "Game";
    Scene[Scene["Result"] = 3] = "Result";
})(Scene || (Scene = {}));
;
var TypingApp = (function (_super) {
    __extends(TypingApp, _super);
    function TypingApp(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            scene: Scene.Start,
            typingState: null
        };
        return _this;
    }
    TypingApp.prototype.OnStartApp = function () {
        this.setState({ scene: Scene.Start });
    };
    TypingApp.prototype.OnResult = function (finalState) {
        this.setState({ scene: Scene.Result });
    };
    TypingApp.prototype.OnSelectDifficulty = function () {
        this.setState({ scene: Scene.SelectDifficulty });
    };
    TypingApp.prototype.GetOptions = function () {
        return new TypingModel_1.WordsRequestClient("/test").RequestOptions();
    };
    TypingApp.prototype.OnSelectedDifficulty = function (option) {
        var words = new TypingModel_1.WordsRequestClient("/test").RuquestWords(option.requestEndpoint);
        this.OnStartGame(words);
    };
    TypingApp.prototype.OnStartGame = function (words) {
        var _this = this;
        var processor = new TypingModel_1.Processor(words); // typing game engine
        var watcher = new TypingModel_1.Watcher(processor); // manager that observe state of the processor and aggregate it.
        /// bind keyboard events to typing game processor
        var keyStream = Rx.Observable.fromEvent(document, 'keydown')
            .map(function (x) { return x.key; })
            .subscribe(function (x) { return processor.Enter(x); });
        /// bind state events to typing game view
        watcher.StateChangeAsObservable().subscribe(function (x) { return _this.OnGameStateChanged(x); });
        /// bind game finish events to result view
        watcher.FinishAsObservable().take(1).subscribe(function (_) {
            keyStream.unsubscribe();
            processor.Close();
            _this.OnResult(watcher.State); /// when finish game, app transit to result scene.
        });
        /// transit to game scene and initialize game state
        this.setState({ scene: Scene.Game });
        processor.Start();
        this.OnGameStateChanged(watcher.State);
    };
    TypingApp.prototype.OnStartGameWithMissedTypedWords = function () {
        var missedWords = this.state.typingState.missedWords;
        if (0 < missedWords.length) {
            this.OnStartGame(missedWords);
        }
        else {
            this.OnStartApp();
        }
    };
    TypingApp.prototype.OnGameStateChanged = function (typingState) {
        this.setState({ typingState: typingState });
    };
    TypingApp.prototype.render = function () {
        var _this = this;
        switch (this.state.scene) {
            case Scene.Start: return React.createElement(MenuView_1.StartMenu, { onstart: function () { return _this.OnSelectDifficulty(); } });
            case Scene.SelectDifficulty: return React.createElement(MenuView_1.DifficultySelectMenu, { options: this.GetOptions(), onSelect: function (option) { return _this.OnSelectedDifficulty(option); } });
            case Scene.Game: return React.createElement(TypingView_1.TypingView, { typingState: this.state.typingState });
            case Scene.Result: return React.createElement(MenuView_1.ResultMenu, { finalState: this.state.typingState, onRetry: function () { return _this.OnStartGame(_this.state.typingState.words); }, onReturn: function () { return _this.OnStartApp(); }, onStudyMissedWord: function () { return _this.OnStartGameWithMissedTypedWords(); } });
            default: return "";
        }
    };
    return TypingApp;
}(React.Component));
ReactDOM.render(React.createElement("div", null,
    React.createElement(TypingApp, null)), document.getElementById("container"));
//# sourceMappingURL=index.js.map