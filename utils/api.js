const time  =require('./time.js')
const request = time.Promisify(wx.request)
/*获取热门搜索*/
async function getSerachSongOrSinger(value,img='http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',callback){
   // 查询歌手歌单列表
   wx.showLoading({
    title: '加载中',
  })
   const res  = await request({url:`https://music-api.tonzhon.com/search/m/${value}`})
   const res1 = await request({url:`https://music-api.tonzhon.com/search/q/${value}`})
   const res2 = await request({url:`https://music-api.tonzhon.com/search/k/${value}`})
   const res3 = await request({url:`https://music-api.tonzhon.com/search/n/${value}`})
   wx.hideLoading()
   const arr = [].concat(res.data.success?res.data.data.songs:[],res1.data.success?res1.data.data.songs:[],res2.data.success?res2.data.data.songs:[],res3.data.success?res3.data.data.songs:[]).map(i=>({
     name:i.name,
     id:i.newId,
     singer:i?.artists.map(it=>it.name).join('-'),
     islink:true,
     type:(i.newId)[0],
     pic:img,
     mId:3 // 该资源下的搜索内容

   }))
   return callback(arr)
}
async function getSongSrc(id,callback){
  const reg = /[\u4e00-\u9fa5]/; //判断是否存在中文
  const res = await request({
    url: `https://music-api.tonzhon.com/song_file/${id}`,
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
}
async function getwholeSongSrc(arr,callback){
  const reg = /[\u4e00-\u9fa5]/; //判断是否存在中文
  let item = arr[0]
  const res = await request({
    url: `https://music-api.tonzhon.com/song_file/${item.id}`,
  })
  if (!res.data.success) {
    if(arr.length){
      arr.shift()
      getwholeSongSrc(arr,callback)
      return
    }
    wx.showToast({
      title:'无法播放',
      icon:'none'
    })
    return 
  }
  const urls = res.data?.data || ''
  if (!urls?.startsWith('http') && urls?.startsWith('//')) {
    const url = res.data?.data.substring(2, res.data?.data.indexOf('mp3') + 3)
    // 截取域名
    const doname = url.substring(0, url.indexOf('/') + 1)
    const remaining = url.substring(url.indexOf('/') + 1)
    callback({item,src :'https://' + doname + encodeURIComponent(remaining), stauts:true,mm:true})
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
        stauts:true,
        item
      })
      return  
    }
    return callback({
      src:urls,
      stauts:true,
      item
    })
  }
}
module.exports = {
  getSerachSongOrSinger,
  getSongSrc,
  getwholeSongSrc
}