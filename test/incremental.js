
const fs = require('fs')

// 分词库
const Segment = require('segment')
const segment = new Segment()

// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault()

// 分词测试
console.log('测试中文分词库', segment.doSegment('这是一个基于Node.js的中文分词模块。', { simple: true }))
// 测试中文分词库 [ '这是', '一个', '基于', 'Node.js', '的', '中文', '分词', '模块', '。' ]

const NaiveBayes = require('../lib/naive-bayes.js')
let classifierJson = require('./classifierJson.json')

// 根据已保存的学习记录继续学习
classifierJson.options = classifierJson.options || {}
classifierJson.options.tokenizer = sentence => {

	// 仅保留英文、中文、数字
  const rgxPunctuation = /[^(a-zA-Z\u4e00-\u9fa50-9_)+\s]/g

  // 英文以空格分词，中文不分词，以单个字为单位
  let sanitized = sentence.replace(rgxPunctuation, ' ')

  // 中英文分词
  sanitized = segment.doSegment(sanitized, { simple: true })
  // console.log(sanitized)
  return sanitized
}
const classifier = NaiveBayes.fromJson(classifierJson)

// 当然也是可以直接测试的
console.log('预期：脏话，实际：', classifier.categorize('这是一句脏话吗，我操！'))
console.log('预期：脏话，实际：', classifier.categorize('呵呵呵，小子，你找死是吧！'))
console.log('预期：正常，实际：', classifier.categorize('你好，我的中文名是司马萌，英文名字叫Surmon。'))
console.log('预期：正常，实际：', classifier.categorize('相信是成功的起点，坚持是成功的终点。'))

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
console.log('预期：脏话，实际：', classifier.categorize('你大爷的吧'))
console.log('预期：脏话，实际：', classifier.categorize('你丫有病吧'))
console.log('预期：正常，实际：', classifier.categorize('妈妈，我饿了'))
console.log('预期：正常，实际：', classifier.categorize('马克思主义'))

// 保存学习进度
classifierJson = classifier.toJson()
fs.writeFileSync('./examples/classifierJson.json', JSON.stringify(classifierJson))
