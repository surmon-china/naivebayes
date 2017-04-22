# naivebayes

A Naive-Bayes classifier for node.js

适用于Node.js的朴素贝叶斯算法库

`naivebayes` takes a document (piece of text), and tells you what category that document belongs to.

简单说：它可以学习文本和标签，并告诉你新的未知文本应该属于什么标签/分类。

核心公式：

```
P(C|W1W2...Wn) = P(W1W2...Wn|C) * P(C) / P(W1W2...Wn)

=> P(W1|C) * P(W2|C) ... P(Wn|C)

=> P(W|C)
```

## What can I use this for?

You can use this for categorizing any text content into any arbitrary set of **categories**. For example:

- is an email **spam**, or **not spam** ?
- is a news article about **technology**, **politics**, or **sports** ?
- is a piece of text expressing **positive** emotions, or **negative** emotions?

可以用于任何文本学习类项目。

## Installing

```
npm install naivebayes --save
```

## Usage

```javascript
const NaiveBayes = require('naivebayes')

const classifier = new NaiveBayes()

// teach it positive phrases
classifier.learn('amazing, awesome movie!! Yeah!! Oh boy.', 'positive')
classifier.learn('Sweet, this is incredibly, amazing, perfect, great!!', 'positive')

// teach it a negative phrase
classifier.learn('terrible, shitty thing. Damn. Sucks!!', 'negative')

// now ask it to categorize a document it has never seen before
classifier.categorize('awesome, cool, amazing!! Yay.')
// => 'positive'

// serialize the classifier's state as a JSON string.
var stateJson = classifier.toJson()

// load the classifier back from its JSON representation.
var revivedClassifier = bayes.fromJson(stateJson)

```

## API

### `var classifier = new NaiveBayes([options])`

Returns an instance of a Naive-Bayes Classifier.

Pass in an optional `options` object to configure the instance. If you specify a `tokenizer` function in `options`, it will be used as the instance's tokenizer. It receives a (string) `text` argument - this is the string value that is passed in by you when you call `.learn()` or `.categorize()`. It must return an array of tokens. The default tokenizer removes punctuation and splits on spaces.

Eg.

```js
var classifier = bayes({
    tokenizer: function (text) { return text.split(' ') }
})
```

### `classifier.learn(text, category)`

Teach your classifier what `category` the `text` belongs to. The more you teach your classifier, the more reliable it becomes. It will use what it has learned to identify new documents that it hasn't seen before.

### `classifier.categorize(text)`

Returns the `category` it thinks `text` belongs to. Its judgement is based on what you have taught it with **.learn()**.

### `classifier.toJson()`

Returns the JSON representation of a classifier.

### `var classifier = bayes.fromJson(jsonStr)`

Returns a classifier instance from the JSON representation. Use this with the JSON representation obtained from `classifier.toJson()`

## 相关库
### 中文分词库：
- [nodejieba](https://github.com/yanyiwu/nodejieba)
- [node-segment](https://github.com/leizongmin/node-segment)

## Credits
This project was forked from [bayes](https://github.com/ttezel/bayes) by @Tolga Tezel 👍
