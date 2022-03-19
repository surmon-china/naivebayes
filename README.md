
# naivebayes

[![GitHub stars](https://img.shields.io/github/stars/surmon-china/naivebayes.svg?style=for-the-badge)](https://github.com/surmon-china/naivebayes/stargazers)
&nbsp;
[![npm](https://img.shields.io/npm/v/naivebayes?color=%23c7343a&label=npm&style=for-the-badge)](https://www.npmjs.com/package/naivebayes)
&nbsp;
[![GitHub issues](https://img.shields.io/github/issues-raw/surmon-china/naivebayes.svg?style=for-the-badge)](https://github.com/surmon-china/naivebayes/issues)
&nbsp;
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=for-the-badge)](/LICENSE)

[![NPM](https://nodei.co/npm/naivebayes.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/naivebayes/)

Naive-Bayes classifier for JavaScript.

适用于 JavaScript 的用于文本学习的朴素贝叶斯算法库。

`naivebayes` takes a document (piece of text), and tells you what category that document belongs to.

简单说：**它可以学习文本和标签，并告诉你新的未知文本应该属于什么标签/分类。**

**核心公式：**

```
文本：[W1,W2,W3,W4,W5...Wn]
分类：[C1,C2,C3,C4,C5...Cn]

P(C|D) = P(D|C) * P(C) / P(D)

= P(C|W1W2...Wn) = P(W1W2...Wn|C) * P(C) / P(W1W2...Wn)

=> Cn.forEach(C => P(W1W2...Wn|C))

=> Wn.forEach(W => P(W|C)
```

**[Web example | 使用浏览器进行在线分类学习](https://github.surmon.me/naivebayes)**

## What can I use this for?

You can use this for categorizing any text content into any arbitrary set of **categories**. For example:

- Is an email **spam**, or **not spam** ?
- Is a news article about **technology**, **politics**, or **sports** ?
- Is a piece of text expressing **positive** emotions, or **negative** emotions?

它可以用于任何文本学习类项目。比如：
- 判断未知邮件是否为垃圾邮件
- 判断不同的未知文本风格对应的作者
- 判断未知文本内容的分类，可以是任何你想要的维度
- ...

## Installing

```
npm install naivebayes --save
```

## Usage

### 基本方法

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

### 实践场景

```javascript
const NaiveBayes = require('naivebayes')

// 使用第三方中文分词库
const Segment = require('segment')
const segment = new Segment()

// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault()

// 分词测试
console.log('测试中文分词库', segment.doSegment('这是一个基于 Node.js 的中文分词模块。', { simple: true }))
// 测试中文分词库 [ '这是', '一个', '基于', 'Node.js', '的', '中文', '分词', '模块', '。' ]

const classifier = new NaiveBayes({

    // 自定义分词器
    tokenizer(sentence) {

        // 仅保留英文、中文、数字
        const sanitized = sentence.replace(/[^(a-zA-Z\u4e00-\u9fa50-9_)+\s]/g, ' ')

        // 中英文分词
        return segment.doSegment(sanitized, { simple: true })
    }
})

// 利用词库进行一些复杂的测试
classifier.learn('你大爷的！', '脏话')
classifier.learn('跪下叫爸爸！！', '脏话')
classifier.learn('我去你妈的！！', '脏话')
classifier.learn('呵呵呵妈的智障！！', '脏话')
classifier.learn('妈妈，一起飞吧', '正常')
classifier.learn('妈妈，一起摇滚吧', '正常')
classifier.learn('给山和河起个名字，骑马的坐在马背上，放羊的跟在羊身后', '正常')
classifier.learn('金色的秋天正在向一望无际的原野告别', '正常')
classifier.learn('他们还看见他们所有的人站在一起，还没有一片树叶年轻', '正常')
classifier.learn('牛儿吃草卷起舌头，狐狸和土狼寻找着野兔子的窝', '正常')
classifier.learn('反正现在这里到处都是你的脚印', '正常')
classifier.learn('不毛之地已高楼林立，流亡之处已灯红酒绿', '正常')
classifier.learn('我想要怒放的生命', '正常')
classifier.learn('两种社会矛盾之一。同“敌我矛盾”相对。一般来说，是在人民利益根本一致的基础上的矛盾。它在不同的国家和各个国家的不同历史时期有着不同的内容。在中国社会主义革命和建设时期，“包括工人阶级内部，工农两个阶级之间，知识分子之间，农民阶级之间，工人、农民和知识分子之间的矛盾”。', '正常')

// 测试
console.log('预期：脏话，实际：', classifier.categorize('你大爷的吧')) // 脏话
console.log('预期：脏话，实际：', classifier.categorize('你丫有病吧')) // 脏话
console.log('预期：正常，实际：', classifier.categorize('妈妈，我饿了')) // 正常
console.log('预期：正常，实际：', classifier.categorize('马克思主义'， true)) // { category: '正常', probability: xxx }

// 获取对于各分类的概率数组
console.log('预期：正常，实际：', classifier.probabilities('马克思主义'))
// [{ category: 'xx', probability: xxx }, { ... }, ...]
```

## API

### Class

```javascript
const classifier = new NaiveBayes([options])
```

Returns an instance of a Naive-Bayes Classifier.

Pass in an optional `options` object to configure the instance. If you specify a `tokenizer` function in `options`, it will be used as the instance's tokenizer. It receives a (string) `text` argument - this is the string value that is passed in by you when you call `.learn()` or `.categorize()`. It must return an array of tokens.

你可以自定义一个分词器，用于将被学习的文本进行处理后，返回一个数组；
默认分词器仅保留中文、英文、数字字符，英文按照空格分割词汇，中文按照单个汉字分割词汇，[代码在此](/src/naivebayes.js#L21)。

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

学习：使分类器学习一些新的内容，内容包括文本和文本对应的标签/分类；标签/分类可以是已经存在的；学习的样本越多，分类的准确率越高。

Teach your classifier what `category` the `text` belongs to. The more you teach your classifier, the more reliable it becomes. It will use what it has learned to identify new documents that it hasn't seen before.

### Probabilities

```javascript
classifier.probabilities(text)
```

计算概率：返回一个由分类名称和分类对应的概率（计算后的）组成的数组，已经从大到小排序完毕，`classifier.categorize(text)` 使用的便是此数组中的最大值。

Returns an array of `{ category, probability }` objects with probability calculated for each category. Its judgement is based on what you have taught it with `.learn()`.

### Categorize

```javascript
classifier.categorize(text ,[probability])
```

分类：确定一段文本所属的分类，`probability`参数用于标识是否返回概率，如果为`true`，则返回一个对象`{ category: xxx, probability: xxx }`，否则直接返回分类。

Returns the `category` it thinks `text` belongs to. Its judgement is based on what you have taught it with `.learn()`.

### ToJson

```javascript
classifier.toJson()
```

导出：将类实例化之后进行的一系列学习成果导出为标准json格式（字符串），以便下次导入增量学习。

Returns the JSON representation of a classifier. This is the same as `JSON.stringify(classifier.toJsonObject())`.

### ToJsonObject

```javascript
classifier.toJsonObject()
```

基本同上，异同：导出的是json对象，可直接用于运算。

Returns a JSON-friendly representation of the classifier as an `object`.

### FromJson

```javascript
const classifier = NaiveBayes.fromJson(jsonObject)
```

导入：将上次的学习成果导入并实例化，格式为标准Json（字符串/对象）；当然你也可以将其他地方已学习的计算结果转化为 `NaiveBayes` 需要的json格式，然后初始化`NaiveBayes` 分类器，json对象的具体格式可以通过[这里的代码](/src/naivebayes.js#L7)一探究竟。

Returns a classifier instance from the JSON representation. Use this with the JSON representation obtained from `classifier.toJson()`.

## 相关库
### 中文分词库：
- [nodejieba](https://github.com/yanyiwu/nodejieba)
- [node-segment](https://github.com/leizongmin/node-segment)
- [segmentit (for javascript)](https://github.com/linonetwo/segmentit)
- [china-address - 地址分词](https://github.com/booxood/china-address)
- [word-picker](https://github.com/redhu/word-picker)

### 英文分词库：
- [tokenize-text](https://github.com/GitbookIO/tokenize-text)
- [tokenizer](https://github.com/bredele/tokenizer)

## Credits
This project was forked from [bayes](https://github.com/ttezel/bayes) by @Tolga Tezel 👍
