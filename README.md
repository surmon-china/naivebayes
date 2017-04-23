[![GitHub issues](https://img.shields.io/github/issues/surmon-china/naivebayes.svg?style=flat-square)](https://github.com/surmon-china/naivebayes/issues)
[![GitHub forks](https://img.shields.io/github/forks/surmon-china/naivebayes.svg?style=flat-square)](https://github.com/surmon-china/naivebayes/network)
[![GitHub stars](https://img.shields.io/github/stars/surmon-china/naivebayes.svg?style=flat-square)](https://github.com/surmon-china/naivebayes/stargazers)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/surmon-china/naivebayes.svg?style=flat-square)](https://twitter.com/intent/tweet?url=https://github.com/surmon-china/naivebayes)

[![NPM](https://nodei.co/npm/naivebayes.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/naivebayes/)
[![NPM](https://nodei.co/npm-dl/naivebayes.png?months=9&height=3)](https://nodei.co/npm/naivebayes/)

# naivebayes

A Naive-Bayes classifier for node.js

适用于Node.js的用于文本学习的朴素贝叶斯算法库。

`naivebayes` takes a document (piece of text), and tells you what category that document belongs to.

简单说：它可以学习文本和标签，并告诉你新的未知文本应该属于什么标签/分类。

核心公式：

```
文本：[W1,W2,W3,W4,W5...Wn]
分类：[C1,C2,C3,C4,C5...Cn]

P(C|D) = P(D|C) * P(C) / P(D)

= P(C|W1W2...Wn) = P(W1W2...Wn|C) * P(C) / P(W1W2...Wn)

=> Cn.forEach(C => P(W1W2...Wn|C))

=> Wn.forEach(W => P(W|C)
```

## What can I use this for?

You can use this for categorizing any text content into any arbitrary set of **categories**. For example:

- is an email **spam**, or **not spam** ?
- is a news article about **technology**, **politics**, or **sports** ?
- is a piece of text expressing **positive** emotions, or **negative** emotions?

它可以用于任何文本学习类项目。比如：
- 判断不同的未知文本风格对应的作者
- 判断未知文本内容的分类，可以是多种维度...
- 判断未知邮件是否为垃圾邮件
- ...

## Installing

```
npm install naivebayes --save
```

## Usage

```javascript
// 导入
const NaiveBayes = require('naivebayes')

// 实例化（创建分类器）
const classifier = new NaiveBayes()

// 学习文本和分类，teach it positive phrases
classifier.learn('amazing, awesome movie!! Yeah!! Oh boy.', 'positive')
classifier.learn('Sweet, this is incredibly, amazing, perfect, great!!', 'positive')

// 学习不同文本和分类，teach it a negative phrase
classifier.learn('terrible, shitty thing. Damn. Sucks!!', 'negative')

// 判断文本归属，now ask it to categorize a document it has never seen before
classifier.categorize('awesome, cool, amazing!! Yay.')
// => 'positive'

// 导出学习数据，serialize the classifier's state as a JSON string.
const stateJson = classifier.toJson()

// 导入学习数据，load the classifier back from its JSON representation.
const revivedClassifier = NaiveBayes.fromJson(stateJson)

```

## API

### Class

```javascript
const classifier = new NaiveBayes([options])
```

Returns an instance of a Naive-Bayes Classifier.

Pass in an optional `options` object to configure the instance. If you specify a `tokenizer` function in `options`, it will be used as the instance's tokenizer. It receives a (string) `text` argument - this is the string value that is passed in by you when you call `.learn()` or `.categorize()`. It must return an array of tokens.

你可以自定义一个分词器，用于将被学习的文本进行处理后，返回一个数组；
默认分词器仅保留中文、英文、数字字符，英文按照空格分割词汇，中文按照单个字分割词汇

Eg.

```javascript
const classifier = new NaiveBayes({
    tokenizer(text) { 
        return text.split(' ') 
    }
})
```

### Learn

```javascript
classifier.learn(text, category)
```

学习：使分类器学习一些新的内容，内容包括文本和文本对应的标签/分类；标签/分类可以是已经存在的；学习的样本越多，分类的准确率越精确。

Teach your classifier what `category` the `text` belongs to. The more you teach your classifier, the more reliable it becomes. It will use what it has learned to identify new documents that it hasn't seen before.

### Categorize

```javascript
classifier.categorize(text)
```

分类：确定一段文本所属的分类。

Returns the `category` it thinks `text` belongs to. Its judgement is based on what you have taught it with **.learn()**.

### toJson

```javascript
classifier.toJson()
```

导出：将类实例化之后进行的一系列学习成果导出为json，以便下次导入增量学习。

Returns the JSON representation of a classifier.

### fromJson

```javascript
const classifier = NaiveBayes.fromJson(jsonObject)
```

导入：将上次的学习成果导入并实例化，格式为标准Json文件

Returns a classifier instance from the JSON representation. Use this with the JSON representation obtained from `classifier.toJson()`.

## 相关库
### 中文分词库：
- [nodejieba](https://github.com/yanyiwu/nodejieba)
- [node-segment](https://github.com/leizongmin/node-segment)
- [china-address - 地址分词](https://github.com/booxood/china-address)

### 英文分词库：
- [tokenize-text](https://github.com/GitbookIO/tokenize-text)
- [tokenizer](https://github.com/bredele/tokenizer)

## Credits
This project was forked from [bayes](https://github.com/ttezel/bayes) by @Tolga Tezel 👍
