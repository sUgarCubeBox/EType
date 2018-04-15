// A '.tsx' file enables JSX support in the TypeScript compiler, 
// for more information see the following page on the TypeScript wiki:
// https://github.com/Microsoft/TypeScript/wiki/JSX

import { Entry, DifficultyOption } from './Model'

export var defaultOptions: Array<DifficultyOption> = [
    new DifficultyOption(-1, "練習用", 6, 4, "練習用難度。操作などを確かめるために使ってね。")
]

export var defaultEntries: Array<Array<Entry>> = [
    [
        new Entry("cat", "猫"),
        new Entry("dog", "犬"),
        new Entry("ant", "あり"),
        new Entry("word", "語"),
        new Entry("english", "英語"),
        new Entry("finish", "終わり")
    ]
];