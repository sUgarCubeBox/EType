"use strict";
// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX
Object.defineProperty(exports, "__esModule", { value: true });
require("./SpanWindow");
var Rx_1 = require("rxjs/Rx");
var Processor = (function () {
    function Processor(words) {
        // subjects
        this.missTypeSubject = new Rx_1.Subject();
        this.correctTypeSubject = new Rx_1.Subject();
        this.nextWordSubject = new Rx_1.Subject();
        this.finishSubject = new Rx_1.Subject();
        this.startSubject = new Rx_1.Subject();
        this.skipSubject = new Rx_1.Subject();
        this.cursor = 0;
        this.words = words;
        this.wordIndex = 0;
    }
    Processor.prototype.MissAsObservable = function () { return this.missTypeSubject; };
    Processor.prototype.CorrectAsObservable = function () { return this.correctTypeSubject; };
    Processor.prototype.NextWordAsObservable = function () { return this.nextWordSubject; };
    Processor.prototype.FinishAsObservable = function () { return this.finishSubject; };
    Processor.prototype.StartAsObservable = function () { return this.startSubject; };
    Processor.prototype.SkipAsObservable = function () { return this.skipSubject; };
    Processor.prototype.Start = function () {
        var _this = this;
        this.cursor = 0;
        this.wordIndex = 0;
        this.startSubject.next({});
        this.FinishAsObservable().subscribe(function (x) { return _this.OnFinish(); });
    };
    Processor.prototype.Close = function () {
        this.finishSubject.complete();
    };
    Processor.prototype.OnFinish = function () {
        [this.missTypeSubject,
            this.correctTypeSubject,
            this.nextWordSubject,
            this.startSubject,
            this.skipSubject].forEach(function (x) { return x.complete(); }); // dispose observation
    };
    /// return true when typed letter is correct.
    Processor.prototype.Enter = function (letter) {
        var currentLetter = this.CurrentLetter;
        if (letter === currentLetter) {
            this.cursor++;
            this.correctTypeSubject.next({});
            if (this.IsEntered) {
                this.NextWord();
            }
            return true;
        }
        else {
            this.missTypeSubject.next({});
            return false;
        }
    };
    // use to time over or giveup
    Processor.prototype.Skip = function () {
        this.skipSubject.next({});
        this.NextWord();
    };
    Processor.prototype.NextWord = function () {
        if (this.IsFinished) {
            this.finishSubject.next({});
            return;
        }
        this.wordIndex++;
        this.cursor = 0;
        this.nextWordSubject.next({});
    };
    Object.defineProperty(Processor.prototype, "IsEntered", {
        get: function () {
            return this.CurrentWord.length <= this.cursor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "IsFinished", {
        get: function () {
            return this.words.length - 1 === this.wordIndex && this.IsEntered;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "CurrentWord", {
        get: function () {
            return this.NowTypingEntry.Word;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "CurrentLetter", {
        get: function () {
            return this.CurrentWord.charAt(this.cursor);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "Typed", {
        get: function () {
            return this.CurrentWord.substr(0, this.cursor);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "Left", {
        get: function () {
            return this.CurrentWord.substr(this.cursor, this.CurrentWord.length);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "NowTypingEntry", {
        get: function () {
            return this.words[this.wordIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "NextTypingEntry", {
        get: function () {
            var nextIndex = this.wordIndex + 1;
            return nextIndex < this.words.length ? this.words[nextIndex] : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "Words", {
        get: function () {
            return this.words;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "Cursor", {
        get: function () {
            return this.cursor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Processor.prototype, "WordIndex", {
        get: function () {
            return this.wordIndex;
        },
        enumerable: true,
        configurable: true
    });
    return Processor;
}());
exports.Processor = Processor;
var Entry = (function () {
    function Entry(word, mean) {
        this.word = word;
        this.mean = mean;
    }
    Object.defineProperty(Entry.prototype, "Word", {
        get: function () { return this.word; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entry.prototype, "Mean", {
        get: function () { return this.mean; },
        enumerable: true,
        configurable: true
    });
    Entry.CreateFromJsonArray = function (jsonArrayStr) {
        return JSON.parse(jsonArrayStr);
    };
    return Entry;
}());
exports.Entry = Entry;
var Watcher = (function () {
    function Watcher(processor) {
        var _this = this;
        this.finishSubject = new Rx_1.Subject();
        this.processor = processor;
        var state = new TypingState(this.processor.Words, function () { return _this.processor.Left; }, function () { return _this.processor.Typed; }, function () { return _this.processor.NowTypingEntry.Mean; });
        this.state = state;
        this.Bind(this.processor, this.state);
    }
    Watcher.prototype.FinishAsObservable = function () { return this.finishSubject; };
    Object.defineProperty(Watcher.prototype, "State", {
        get: function () { return this.state; },
        enumerable: true,
        configurable: true
    });
    Watcher.prototype.StateChangeAsObservable = function () {
        var _this = this;
        var p = this.processor;
        return p.StartAsObservable()
            .merge(p.CorrectAsObservable(), p.MissAsObservable(), p.NextWordAsObservable(), p.FinishAsObservable(), p.SkipAsObservable())
            .map(function (_) { return _this.State; });
    };
    Watcher.prototype.Bind = function (p, state) {
        var _this = this;
        // start
        p.StartAsObservable().subscribe(function (x) { return state.startTime = new Date(Date.now()); });
        p.CorrectAsObservable().subscribe(function (x) { return state.correctCount++; });
        p.MissAsObservable().subscribe(function (x) { return state.missCount++; });
        p.SkipAsObservable().subscribe(function (x) { return state.timeOverCount++; });
        p.FinishAsObservable().subscribe(function (x) {
            state.endTime = new Date(Date.now());
            _this.finishSubject.next({});
        });
        p.StartAsObservable().subscribe(function (x) { return _this.BindMaxSpeedCalculation(p, state); });
        p.StartAsObservable().subscribe(function (x) { return _this.BindMissTypedRecording(p, state); });
    };
    Watcher.prototype.BindMaxSpeedCalculation = function (p, state) {
        // calc max speed
        p.CorrectAsObservable()
            .map(function (x) { return Date.now(); })
            .map(function (x) { return [x, x]; }) // diagonal map
            .scan(function (prevPair, diagonalPair) { return [prevPair[1], diagonalPair[0]]; }, [0, 0])
            .map(function (x) { return x[1] - x[0]; }) // time between keydowns
            .spanWindow(5) // buffering events by sliding window
            .map(function (x) { return x.reduce(function (s, x) { return s + x; }) / x.length; }) // window average
            .scan(function (min, x) { return x < min ? x : min; }, Number.MAX_VALUE)
            .distinctUntilChanged()
            .subscribe(function (x) { return state.maxSpeed = 1000 / x; });
    };
    Watcher.prototype.BindMissTypedRecording = function (p, state) {
        p.MissAsObservable()
            .map(function (_) { return p.NowTypingEntry; })
            .distinctUntilChanged()
            .subscribe(function (x) { return state.missedWords.push(x); });
        p.MissAsObservable()
            .map(function (x) { return [p.Cursor, p.WordIndex]; })
            .subscribe(function (x) { return state.missTypedMap[x[1]][x[0]] += 1; }); // record misstyped position
    };
    return Watcher;
}());
exports.Watcher = Watcher;
var TypingState = (function () {
    function TypingState(words, leftSelector, typedSelecor, meanSelector) {
        var _this = this;
        this.missCount = 0;
        this.correctCount = 0;
        this.timeOverCount = 0;
        this.startTime = null;
        this.endTime = null;
        this.maxSpeed = 0;
        this.missTypedMap = Array(words.length);
        this.missedWords = Array();
        this.words = words;
        this.words.map(function (x) { return x.Word; }).forEach(function (x, i) {
            var t = new Array(x.length);
            for (var j = 0; j < x.length; j++)
                t[j] = 0;
            _this.missTypedMap[i] = t;
        });
        this.leftSelector = leftSelector;
        this.typedSelector = typedSelecor;
        this.meanSelector = meanSelector;
    }
    Object.defineProperty(TypingState.prototype, "left", {
        get: function () {
            return this.leftSelector();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypingState.prototype, "typed", {
        get: function () {
            return this.typedSelector();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TypingState.prototype, "mean", {
        get: function () {
            return this.meanSelector();
        },
        enumerable: true,
        configurable: true
    });
    return TypingState;
}());
var Rank = (function () {
    function Rank(score, rank) {
        this.score = score;
        this.rank = rank;
    }
    return Rank;
}());
/// スコアとかを集計する
var TypingStateAggregater = (function () {
    function TypingStateAggregater(state) {
        this.state = state;
    }
    Object.defineProperty(TypingStateAggregater.prototype, "State", {
        get: function () { return this.state; },
        enumerable: true,
        configurable: true
    });
    ;
    TypingStateAggregater.prototype.CalcSpanMilliseconds = function () {
        var startTime = this.state.startTime.getTime();
        var endTime = this.state.endTime.getTime();
        return endTime - startTime;
    };
    TypingStateAggregater.prototype.CalcSpanDate = function () {
        var ret = new Date();
        ret.setTime((this.CalcSpanMilliseconds()) + (ret.getTimezoneOffset() * 60 * 1000));
        return ret;
    };
    TypingStateAggregater.prototype.CalcWPM = function () {
        var spanTimeOfMinutes = this.CalcSpanMilliseconds() / (1000 * 60);
        var typed = this.state.correctCount;
        // [minute] = [millisecond] / (1000 * 60);
        return typed / spanTimeOfMinutes;
    };
    ;
    TypingStateAggregater.prototype.CalcScore = function () {
        return this.CalcWPM() + this.state.maxSpeed * 1 - this.state.missCount * 5;
    };
    TypingStateAggregater.prototype.CalcRank = function () {
        var score = this.CalcScore();
        var map = [
            new Rank(100, "タイパー研究生"),
            new Rank(200, "デビュータイパー"),
            new Rank(300, "メジャータイパー"),
            new Rank(400, "トップタイパー"),
            new Rank(550, "神タイパー")
        ];
        var rank = "ゲスト";
        map.forEach(function (r) {
            if (r.score <= score)
                rank = r.rank;
        });
        return rank;
    };
    return TypingStateAggregater;
}());
exports.TypingStateAggregater = TypingStateAggregater;
var DifficultyOption = (function () {
    function DifficultyOption(name, size, averageLength, discription, endpoint) {
        this.name = name;
        this.size = size;
        this.averageLength = averageLength;
        this.discription = discription;
        this.requestEndpoint = endpoint;
    }
    return DifficultyOption;
}());
var WordsRequestClient = (function () {
    function WordsRequestClient(apihost) {
        this.apihost = apihost;
    }
    WordsRequestClient.prototype.RequestOptions = function () {
        // test object
        return [
            new DifficultyOption("テストデータ", 7, 6, "テストのデータ", "/test"),
            new DifficultyOption("テストデータ2", 7, 6, "テスト2のデータ", "/test"),
        ];
    };
    WordsRequestClient.prototype.RuquestWords = function (endpoint) {
        // test words
        switch (endpoint) {
            case "/test": return [
                new Entry("apple", "りんご"),
                new Entry("programming", "プログラミング"),
                new Entry("note", "メモ帳"),
                new Entry("terminal", "端末"),
                new Entry("extra", "余計な"),
                new Entry("clock", "時計"),
                new Entry("time", "時間")
            ];
            default: return [];
        }
    };
    return WordsRequestClient;
}());
exports.WordsRequestClient = WordsRequestClient;
//# sourceMappingURL=TypingModel.js.map