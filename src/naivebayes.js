
/**
 * 用于重置分类器的键
 * keys we use to serialize a classifier's state
 */
const STATE_KEYS = [
  'categories', 'docCount', 'totalDocuments', 'vocabulary', 'wordCount', 'wordFrequencyCount', 'options'
]

/**
 * 默认分词器，英文按照空格分割单词，中文按照字符分割
 * Given an input string, tokenize it into an array of word tokens.
 * This is the default tokenization function used if user does not provide one in `options`.
 *
 * @param  {String} text
 * @return {Array}
 */
const defaultTokenizer = text => {

  // 仅保留英文、中文、数字
  const rgxPunctuation = /[^(a-zA-ZA-Яa-я\u4e00-\u9fa50-9_)+\s]/g

  // 英文以空格分词，中文不分词，以单个字为单位
  return text.replace(rgxPunctuation, ' ')
            .replace(/[\u4e00-\u9fa5]/g, word => `${word} `)
            .split(/\s+/)
}

/**
 * Naive-Bayes Classifier 朴素贝叶斯
 *
 * This is a naive-bayes classifier that uses Laplace Smoothing.
 *
 */
class NaiveBayes {

  constructor(options) {

    // set options object
    this.options = {}
    if (typeof options !== 'undefined') {
      if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw TypeError('NaiveBayes got invalid `options`: `' + options + '`. Pass in an object.')
      }
      this.options = options
    }

    // 分词器
    this.tokenizer = this.options.tokenizer || defaultTokenizer

    // 词汇表
    this.vocabulary = []

    // max vocabulary size based on word frequency, default is no limit
    this.vocabularyLimit = this.options.vocabularyLimit || 0

    // 已学习的文档总数量, number of documents we have learned from
    this.totalDocuments = 0

    // 分类的词频表, document frequency table for each of our categories
    this.docCount = {}

    // 分类词总数/概率基数, for each category, how many words total were mapped to it
    this.wordCount = {}

    // 分类的词频统计, word frequency table for each category
    this.wordFrequencyCount = {}

    // 所有分类, hashmap of our category names
    this.categories = []
  }

  /**
   * 初始化新分类
   * Initialize each of our data structure entries for this new category
   *
   * @param  {String} categoryName
   */
  initializeCategory(categoryName) {
    if (!this.categories.includes(categoryName)) {
      this.docCount[categoryName] = 0
      this.wordCount[categoryName] = 0
      this.wordFrequencyCount[categoryName] = {}
      this.categories.push(categoryName)
    }
    return this
  }

  /**
   * 训练朴素贝叶斯分类器，告诉它分类关系
   * train our naive-bayes classifier by telling it what `category`
   * the `text` corresponds to.
   *
   * @param  {String} text
   * @param  {String} class
   */
  learn(text, category) {

    // 初始化分类, initialize category data structures if we've never seen this category
    this.initializeCategory(category)

    // 更新这个分类映射的语句的数量（用于计算后面的 P(C) ）
    // update our count of how many documents mapped to this category
    this.docCount[category]++

    // 更新已学习的文档总数, update the total number of documents we have learned from
    this.totalDocuments++

    // 将文本标准化为词汇数组, normalize the text into a word array
    const tokens = this.tokenizer(text)

    // 获取文本中每个词汇的词频（用于更新总词频）, get a frequency count for each token in the text
    const frequencyTable = this.frequencyTable(tokens)

    /*
     * 更新我们的词汇和我们的词频计数这个分类
     * Update our vocabulary and our word frequency count for this category
     */
    Object.keys(frequencyTable).forEach(token => {

      // 将目标词汇添加到词汇表, add this word to our vocabulary if not already existing
      if (!this.vocabulary.includes(token)) {
        this.vocabulary.push(token)
      }

      const frequencyInText = frequencyTable[token]

      // 在这个分类中更新这个词的频率信息（更新总词频）, update the frequency information for this word in this category
      if (!this.wordFrequencyCount[category][token]) {
        this.wordFrequencyCount[category][token] = frequencyInText
      } else {
        this.wordFrequencyCount[category][token] += frequencyInText
      }

      // 更新我们已经看到映射到这个分类的所有词汇的计数（C.wordCount，用于计算词类概率）
      // update the count of all words we have seen mapped to this category
      this.wordCount[category] += frequencyInText
    })

    return this
  }

  /**
   * 进行分类，或者说进行预测
   * Determine what category `text` belongs to.
   *
   * @param  {String} text
   * @param  {Boolean} probability
   * @return {String} category
   */
  categorize(text, probability) {
    return probability ? this.probabilities(text)[0]
                       : this.probabilities(text)[0].category
  }

  /**
   * 返回一个数组，数组内部是按照概率从高到低排序的组合
   * Determine category probabilities for `text`.
   *
   * @param  {String} text
   * @return {Array} probabilities
   */
  probabilities(text) {

    // [W1,W2,W3,W4,Wn...]
    const tokens = this.tokenizer(text)
    const frequencyTable = this.frequencyTable(tokens)

    // 返回由 P(W1|C) * P(W2|C) ... P(Wn|C) * P(C) 组成的数组
    // iterate thru our categories to calculate the probability for this text
    return this.categories.map(category => {

      // start by calculating the overall probability of this category
      // => out of all documents we've ever looked at, how many were
      //    mapped to this category
      const categoryProbability = this.docCount[category] / (this.vocabularyLimit || this.totalDocuments)

      //take the log to avoid underflow
      let logProbability = Math.log(categoryProbability)

      // now determine P( w | c ) for each word `w` in the text
      Object.keys(frequencyTable).forEach(token => {

        const frequencyInText = frequencyTable[token]
        const tokenProbability = this.tokenProbability(token, category)

        // console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)

        //determine the log of the P( w | c ) for this word
        logProbability += frequencyInText * Math.log(tokenProbability)
      })

      return {
        category: category,
        probability: logProbability
      }
    }).sort((prev, next) => next.probability - prev.probability)
  }

  /**
   * 概率计算器，用于计算"元素"属于"分类"的概率
   * Calculate probability that a `token` belongs to a `category`
   *
   * @param  {String} token
   * @param  {String} category
   * @return {Number} probability
   */
  tokenProbability(token, category) {

    // 分类中目标词汇的词频
    const wordFrequencyCount = this.wordFrequencyCount[category][token] || 0

    // 分类总词汇数量
    const wordCount = this.wordCount[category]

    // 拉普拉斯方程，防止概率为0，P(W|C)
    return ( wordFrequencyCount + 1 ) / ( wordCount + this.vocabulary.length )
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
  frequencyTable(tokens) {
    const frequencyTable = Object.create(null)
    for (const token of tokens) {
      if (!frequencyTable[token]) {
        frequencyTable[token] = 1
      } else {
        frequencyTable[token]++
      }
    }

    if (!this.vocabularyLimit || tokens.length <= this.vocabularyLimit)
      return frequencyTable

    const frequentWords = Object
      .keys(frequencyTable)
      .sort(
        (a, b) => frequencyTable[a] - frequencyTable[b]
      )

    const newFrequencyTable = {};

    let count = 0;
    for (const word of frequentWords) {
      count += frequencyTable[word]
      newFrequencyTable[word] = frequencyTable[word]
      if (count >= this.vocabularyLimit) break
    }

    return newFrequencyTable;
  }

/**
  * Dump the classifier's state as a JSON string.
  * @param {Boolean} Optionally format the serialized JSON output for easier human consumption
  * @return {String} Representation of the classifier.
  */
  toJson(prettyPrint) {
    const prettyPrintSpaces = prettyPrint ? 2 : 0
    return JSON.stringify(this.toJsonObject(), null, prettyPrintSpaces)
  }
  toJsonObject() {
    const state = {}
    STATE_KEYS.forEach(key => state[key] = this[key])
    return state
  }

  /**
   * 从JSON初始化贝叶斯分类器实例（json对象，不是字符串对象）
   * Initializes a NaiveBayes instance from a JSON state representation.
   * Use this with classifier.toJson().
   *
   * @param  {String} jsonStr   state representation obtained by classifier.toJson()
   * @return {NaiveBayes}       Classifier
   */
  static fromJson(json) {

    if (typeof json === 'string') {
      try {
        json = JSON.parse(json)
      } catch (err) {
        throw new Error('Naivebayes.fromJson expects a valid JSON string.')
      }
    }

    json.options = json.options || {}

    // init a new classifier
    const classifier = new NaiveBayes(json.options)

    // override the classifier's state
    STATE_KEYS.forEach(key => {
      if (json[key] == undefined) {
        throw new Error(`NaiveBayes.fromJson: JSON string is missing an expected property: '${key}'.`)
      } else {
        classifier[key] = json[key]
      }
    })

    return classifier
  }

  static getStateKeys() {
    return STATE_KEYS
  }
}

module.exports = NaiveBayes
