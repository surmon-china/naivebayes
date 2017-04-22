
// 用于重置分类器的键
// keys we use to serialize a classifier's state
const STATE_KEYS = module.exports.STATE_KEYS = [
  'categories', 'docCount', 'totalDocuments', 'vocabulary', 'vocabularySize', 'wordCount', 'wordFrequencyCount', 'options'
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
  const rgxPunctuation = /[^(a-zA-Z\u4e00-\u9fa50-9_)+\s]/g

  // 英文以空格分词，中文不分词，以单个字为单位
  const sanitized = text.replace(rgxPunctuation, ' ')
                         .replace(/[\u4e00-\u9fa5]/g, word => `${word} `)
                         .split(/\s+/)
  return sanitized
}

/**
 * Naive-Bayes Classifier 朴素贝叶斯
 *
 * This is a naive-bayes classifier that uses Laplace Smoothing.
 *
 * Takes an (optional) options object containing:
 *   - `tokenizer`  => custom tokenization function
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

    // 初始化词汇量和其大小
    // Initialize our vocabulary and its size.
    this.vocabulary = {}
    this.vocabularySize = 0

    // 已学习的文档总数量
    // number of documents we have learned from
    this.totalDocuments = 0

    // 每个分类的文档频率表（即：对于每个分类，文档映射到它的频率）
    // document frequency table for each of our categories
    this.docCount = {}

    // 对于每个分类，总共有多少词汇被映射到它
    // for each category, how many words total were mapped to it
    this.wordCount = {}

    // 词频统计：对于每个分类，一个给定的词映射到它的频率是多少
    // word frequency table for each category
    this.wordFrequencyCount = {}

    // 所有分类
    // hashmap of our category names
    this.categories = {}
  }


  /**
   * 初始化新分类
   * Initialize each of our data structure entries for this new category
   *
   * @param  {String} categoryName
   */
  initializeCategory(categoryName) {
    if (!this.categories[categoryName]) {
      this.docCount[categoryName] = 0
      this.wordCount[categoryName] = 0
      this.wordFrequencyCount[categoryName] = {}
      this.categories[categoryName] = true
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

    // 初始化分类（如果这个分类未被创建过）
    // initialize category data structures if we've never seen this category
    this.initializeCategory(category)

    // 更新这个分类映射的语句的数量
    // update our count of how many documents mapped to this category
    this.docCount[category]++

    // 更新已学习的文档总数
    // update the total number of documents we have learned from
    this.totalDocuments++

    // 将文本标准化为词汇数组
    // normalize the text into a word array
    const tokens = this.tokenizer(text)

    // 获取文本中每个标记的频率计数
    // get a frequency count for each token in the text
    const frequencyTable = this.frequencyTable(tokens)

    /*
     * 更新我们的词汇和我们的词频计数这个分类
     * Update our vocabulary and our word frequency count for this category
     */
    Object.keys(frequencyTable).forEach(token => {

      // 如果不是已经存在的话，把这个词添加到我们的词汇表中
      // add this word to our vocabulary if not already existing
      if (!this.vocabulary[token]) {
        this.vocabulary[token] = true
        this.vocabularySize++
      }

      const frequencyInText = frequencyTable[token]

      // 在这个分类中更新这个词的频率信息
      // update the frequency information for this word in this category
      if (!this.wordFrequencyCount[category][token]) {
        this.wordFrequencyCount[category][token] = frequencyInText
      } else {
        this.wordFrequencyCount[category][token] += frequencyInText
      }

      // 更新我们已经看到映射到这个分类的所有词汇的计数
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
   * @return {String} category
   */
  categorize(text) {

    let maxProbability = -Infinity
    let chosenCategory = null

    // [W1,W2,W3,W4,Wn...]
    var tokens = this.tokenizer(text)
    var frequencyTable = this.frequencyTable(tokens)

    // P(W1|C) * P(W2|C) ... P(Wn|C) * P(C) 的最大值 = 遍历分类，找到一个最大概率
    Object.keys(this.categories).forEach(category => {

      // P(C)
      const categoryProbability = this.docCount[category] / this.totalDocuments

      // take the log to avoid underflow
      let logProbability = Math.log(categoryProbability)

      // P(W1|C) * P(W2|C) ... P(Wn|C) 
      Object.keys(frequencyTable).forEach(token => {

        const frequencyInText = frequencyTable[token]
        const tokenProbability = this.tokenProbability(token, category)

        // console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)

        // P(W|C)
        logProbability += frequencyInText * Math.log(tokenProbability)
      })

      if (logProbability > maxProbability) {
        maxProbability = logProbability
        chosenCategory = category
      }
    })

    return chosenCategory
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

    // 这个词映射到这个分类的文档中出现过多少次
    const wordFrequencyCount = this.wordFrequencyCount[category][token] || 0

    // 曾经被映射到这个分类的所有词汇的计数是多少
    const wordCount = this.wordCount[category]

    // 拉普拉斯方程
    return ( wordFrequencyCount + 1 ) / ( wordCount + this.vocabularySize )
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

    tokens.forEach(token => {
      if (!frequencyTable[token]) {
        frequencyTable[token] = 1
      } else {
        frequencyTable[token]++
      }
    })

    return frequencyTable
  }

  toJson() {
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

    json.options = json.options || {}

    // init a new classifier
    const classifier = new NaiveBayes(json.options)

    // override the classifier's state
    STATE_KEYS.forEach(k => {
      if (!json[k]) {
        throw new Error(`NaiveBayes.fromJson: JSON string is missing an expected property: '${k}'.`)
      }
      classifier[k] = json[k]
    })

    return classifier
  }
}

module.exports = NaiveBayes
