
const fs = require('fs')
const nodejieba = require("nodejieba")
const NaiveBayes = require('../lib/naive-bayes.js')
const classifierJson = require('./classifierJson.json')

// 根据已保存的学习记录继续学习
const classifier = NaiveBayes.fromJson(classifierJson)

// 使用中文分词库
nodejieba.load()
console.log('测试中文分词库', nodejieba.cut("南京市长江大桥"))

// 当然也是可以直接测试的
console.log('预期：脏话，实际：', classifier.categorize('这是一句脏话吗，我操！'))
console.log('预期：脏话，实际：', classifier.categorize('呵呵呵，小子，你找死是吧！'))
console.log('预期：正常，实际：', classifier.categorize('你好，我的中文名是司马萌，英文名字叫Surmon。'))
console.log('预期：正常，实际：', classifier.categorize('相信是成功的起点，坚持是成功的终点。'))
