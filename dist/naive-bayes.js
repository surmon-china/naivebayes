'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// 用于重置分类器的键
// keys we use to serialize a classifier's state
var STATE_KEYS = module.exports.STATE_KEYS = ['categories', 'docCount', 'totalDocuments', 'vocabulary', 'vocabularySize', 'wordCount', 'wordFrequencyCount', 'options'];

/**
 * 默认分词器，英文按照空格分割单词，中文按照字符分割
 * Given an input string, tokenize it into an array of word tokens.
 * This is the default tokenization function used if user does not provide one in `options`.
 *
 * @param  {String} text
 * @return {Array}
 */
var defaultTokenizer = function defaultTokenizer(text) {

  // 仅保留英文、中文、数字
  var rgxPunctuation = /[^(a-zA-Z\u4e00-\u9fa50-9_)+\s]/g;

  // 英文以空格分词，中文不分词，以单个字为单位
  var sanitized = text.replace(rgxPunctuation, ' ').replace(/[\u4e00-\u9fa5]/g, function (word) {
    return word + ' ';
  }).split(/\s+/);
  return sanitized;
};

/**
 * Naive-Bayes Classifier 朴素贝叶斯
 *
 * This is a naive-bayes classifier that uses Laplace Smoothing.
 *
 * Takes an (optional) options object containing:
 *   - `tokenizer`  => custom tokenization function
 *
 */

var NaiveBayes = function () {
  function NaiveBayes(options) {
    _classCallCheck(this, NaiveBayes);

    // set options object
    this.options = {};
    if (typeof options !== 'undefined') {
      if (!options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || Array.isArray(options)) {
        throw TypeError('NaiveBayes got invalid `options`: `' + options + '`. Pass in an object.');
      }
      this.options = options;
    }

    // 分词器
    this.tokenizer = this.options.tokenizer || defaultTokenizer;

    // 初始化词汇量和其大小
    // Initialize our vocabulary and its size.
    this.vocabulary = {};
    this.vocabularySize = 0;

    // 已学习的文档总数量
    // number of documents we have learned from
    this.totalDocuments = 0;

    // 每个分类的文档频率表（即：对于每个分类，文档映射到它的频率）
    // document frequency table for each of our categories
    this.docCount = {};

    // 对于每个分类，总共有多少词汇被映射到它
    // for each category, how many words total were mapped to it
    this.wordCount = {};

    // 词频统计：对于每个分类，一个给定的词映射到它的频率是多少
    // word frequency table for each category
    this.wordFrequencyCount = {};

    // 所有分类
    // hashmap of our category names
    this.categories = {};
  }

  /**
   * 初始化新分类
   * Initialize each of our data structure entries for this new category
   *
   * @param  {String} categoryName
   */


  _createClass(NaiveBayes, [{
    key: 'initializeCategory',
    value: function initializeCategory(categoryName) {
      if (!this.categories[categoryName]) {
        this.docCount[categoryName] = 0;
        this.wordCount[categoryName] = 0;
        this.wordFrequencyCount[categoryName] = {};
        this.categories[categoryName] = true;
      }
      return this;
    }

    /**
     * 训练朴素贝叶斯分类器，告诉它分类关系
     * train our naive-bayes classifier by telling it what `category`
     * the `text` corresponds to.
     *
     * @param  {String} text
     * @param  {String} class
     */

  }, {
    key: 'learn',
    value: function learn(text, category) {
      var _this = this;

      // 初始化分类（如果这个分类未被创建过）
      // initialize category data structures if we've never seen this category
      this.initializeCategory(category);

      // 更新这个分类映射的语句的数量
      // update our count of how many documents mapped to this category
      this.docCount[category]++;

      // 更新已学习的文档总数
      // update the total number of documents we have learned from
      this.totalDocuments++;

      // 将文本标准化为词汇数组
      // normalize the text into a word array
      var tokens = this.tokenizer(text);

      // 获取文本中每个标记的频率计数
      // get a frequency count for each token in the text
      var frequencyTable = this.frequencyTable(tokens);

      /*
       * 更新我们的词汇和我们的词频计数这个分类
       * Update our vocabulary and our word frequency count for this category
       */
      Object.keys(frequencyTable).forEach(function (token) {

        // 如果不是已经存在的话，把这个词添加到我们的词汇表中
        // add this word to our vocabulary if not already existing
        if (!_this.vocabulary[token]) {
          _this.vocabulary[token] = true;
          _this.vocabularySize++;
        }

        var frequencyInText = frequencyTable[token];

        // 在这个分类中更新这个词的频率信息
        // update the frequency information for this word in this category
        if (!_this.wordFrequencyCount[category][token]) {
          _this.wordFrequencyCount[category][token] = frequencyInText;
        } else {
          _this.wordFrequencyCount[category][token] += frequencyInText;
        }

        // 更新我们已经看到映射到这个分类的所有词汇的计数
        // update the count of all words we have seen mapped to this category
        _this.wordCount[category] += frequencyInText;
      });

      return this;
    }

    /**
     * 进行分类，或者说进行预测
     * Determine what category `text` belongs to.
     *
     * @param  {String} text
     * @return {String} category
     */

  }, {
    key: 'categorize',
    value: function categorize(text) {
      var _this2 = this;

      var maxProbability = -Infinity;
      var chosenCategory = null;

      // [W1,W2,W3,W4,Wn...]
      var tokens = this.tokenizer(text);
      var frequencyTable = this.frequencyTable(tokens);

      // P(W1|C) * P(W2|C) ... P(Wn|C) * P(C) 的最大值 = 遍历分类，找到一个最大概率
      Object.keys(this.categories).forEach(function (category) {

        // P(C)
        var categoryProbability = _this2.docCount[category] / _this2.totalDocuments;

        // take the log to avoid underflow
        var logProbability = Math.log(categoryProbability);

        // P(W1|C) * P(W2|C) ... P(Wn|C) 
        Object.keys(frequencyTable).forEach(function (token) {

          var frequencyInText = frequencyTable[token];
          var tokenProbability = _this2.tokenProbability(token, category);

          // console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)

          // P(W|C)
          logProbability += frequencyInText * Math.log(tokenProbability);
        });

        if (logProbability > maxProbability) {
          maxProbability = logProbability;
          chosenCategory = category;
        }
      });

      return chosenCategory;
    }

    /**
     * 概率计算器，用于计算"元素"属于"分类"的概率
     * Calculate probability that a `token` belongs to a `category`
     *
     * @param  {String} token
     * @param  {String} category
     * @return {Number} probability
     */

  }, {
    key: 'tokenProbability',
    value: function tokenProbability(token, category) {

      // 这个词映射到这个分类的文档中出现过多少次
      var wordFrequencyCount = this.wordFrequencyCount[category][token] || 0;

      // 曾经被映射到这个分类的所有词汇的计数是多少
      var wordCount = this.wordCount[category];

      // 拉普拉斯方程
      return (wordFrequencyCount + 1) / (wordCount + this.vocabularySize);
    }

    /**
     * 概率HashMap
     * Build a frequency hashmap where
     * - the keys are the entries in `tokens`
     * - the values are the frequency of each entry in `tokens`
     *
     * @param  {Array} tokens  Normalized word array
     * @return {Object}
     */

  }, {
    key: 'frequencyTable',
    value: function frequencyTable(tokens) {

      var frequencyTable = Object.create(null);

      tokens.forEach(function (token) {
        if (!frequencyTable[token]) {
          frequencyTable[token] = 1;
        } else {
          frequencyTable[token]++;
        }
      });

      return frequencyTable;
    }
  }, {
    key: 'toJson',
    value: function toJson() {
      var _this3 = this;

      var state = {};
      STATE_KEYS.forEach(function (key) {
        return state[key] = _this3[key];
      });
      return state;
    }

    /**
     * 从JSON初始化贝叶斯分类器实例（json对象，不是字符串对象）
     * Initializes a NaiveBayes instance from a JSON state representation.
     * Use this with classifier.toJson().
     *
     * @param  {String} jsonStr   state representation obtained by classifier.toJson()
     * @return {NaiveBayes}       Classifier
     */

  }], [{
    key: 'fromJson',
    value: function fromJson(json) {

      json.options = json.options || {};

      // init a new classifier
      var classifier = new NaiveBayes(json.options);

      // override the classifier's state
      STATE_KEYS.forEach(function (k) {
        if (!json[k]) {
          throw new Error('NaiveBayes.fromJson: JSON string is missing an expected property: \'' + k + '\'.');
        }
        classifier[k] = json[k];
      });

      return classifier;
    }
  }]);

  return NaiveBayes;
}();

module.exports = NaiveBayes;