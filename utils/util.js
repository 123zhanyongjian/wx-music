const time = require('./time')
const request = time.Promisify(wx.request)
const base = require('./base')
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const GETlRC = async (id) => {
  if (id[0] === 'k') {
    return ''
  }
  const res = await request({
    url: `https://music-api.tonzhon.com/lyrics/${id}`
  })
  if (id[0] === 'q') {
    // base64解码
    if(res.data?.data){
      return decodeURIComponent(escape(base.weAtob(res.data.data)))
    }
    return ''
  }
  return res.data?.data
}
const errorSong = async (type, datas, callback) => {
  // mid=1 // 
  // 判断该歌曲属于哪个分类
  if (type === 1) {
    request({
      url: 'http://www.xmsj.org/',
      method: 'post',
      data: {
        input: datas.id,
        filter: 'id',
        type: datas.type || 'baidu',
        page: 1,

      },
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(res => {
        callback({
          src: res.data.data[0].url,
          stauts:true
        })

        // pay(that, app, datas1,1)

      })
    return
  }
  if(type===2){
    return callback({
      stauts:false
    })
  }
  if (type === 3) {
    const reg = /[\u4e00-\u9fa5]/; //判断是否存在中文
    const res = await request({
      url: `https://music-api.tonzhon.com/song_file/${datas.id}`,
    })
   
    if (!res.data.success) {
      wx.showToast({
        title: '无法播放',
        icon: 'none'
      })
      callback({
        stauts:false
      })
      return 
    }
    const urls = res.data?.data || ''
    if (!urls?.startsWith('http') && urls?.startsWith('//')) {
      const url = res.data?.data.substring(2, res.data?.data.indexOf('mp3') + 3)
      // 截取域名
      const doname = url.substring(0, url.indexOf('/') + 1)
      const remaining = url.substring(url.indexOf('/') + 1)
      callback({src :'https://' + doname + encodeURIComponent(remaining), stauts:true,mm:true})
    }
    else if (urls?.startsWith('http')) {
      if (reg.test(urls)) {
        // 存在中文
        // 提取域名
        const str1 = urls.substring(0, urls.indexOf('//') + 2)
        const str = urls.substring(urls.indexOf('//') + 2)
        const remaining = str.substring(str.indexOf('/') + 1)
        const doname = str.substring(0, str.indexOf('/') + 1)
        callback({
          src: str1 + doname + encodeURIComponent(remaining),
          stauts:true
        })
        return  
      }
      return callback({
        src:urls,
        stauts:true
      })
    }

  }else{
    return callback({
      stauts:false
    })
  }
 
}


module.exports = {
  formatTime: formatTime,
  GETlRC,
  errorSong
}