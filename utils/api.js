const time = require('./time.js')
const api = getApp().host;
const request = time.Promisify(wx.request)
/*获取热门搜索*/
async function getSerachSongOrSinger(value, img = 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg', callback) {
  // 查询歌手歌单列表
  wx.showLoading({
    title: '加载中',
  })
  const res = await request({ url: `https://music-api.tonzhon.com/search/m/${value}` })
  const res1 = await request({ url: `https://music-api.tonzhon.com/search/q/${value}` })
  const res2 = await request({ url: `https://music-api.tonzhon.com/search/k/${value}` })
  const res3 = await request({ url: `https://music-api.tonzhon.com/search/n/${value}` })
  wx.hideLoading()
  const arr = [].concat(res.data.success ? res.data.data.songs : [], res1.data.success ? res1.data.data.songs : [], res2.data.success ? res2.data.data.songs : [], res3.data.success ? res3.data.data.songs : []).map(i => ({
    name: i.name,
    id: i.newId,
    singer: i?.artists.map(it => it.name).join('-'),
    islink: true,
    type: (i.newId)[0],
    pic: img,
    mId: 3 // 该资源下的搜索内容

  }))
  return callback(arr)
}
async function getSongSrc(id, callback) {
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
      stauts: false
    })
    return
  }
  const urls = res.data?.data || ''
  if (!urls?.startsWith('http') && urls?.startsWith('//')) {
    const url = res.data?.data.substring(2, res.data?.data.indexOf('mp3') + 3)
    // 截取域名
    const doname = url.substring(0, url.indexOf('/') + 1)
    const remaining = url.substring(url.indexOf('/') + 1)
    callback({ src: 'https://' + doname + encodeURIComponent(remaining), stauts: true, mm: true })
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
        stauts: true
      })
      return
    }
    return callback({
      src: urls,
      stauts: true
    })
  }
}
async function getwholeSongSrc(arr, callback) {
  const reg = /[\u4e00-\u9fa5]/; //判断是否存在中文
  let item = arr[0]
  const res = await request({
    url: `https://music-api.tonzhon.com/song_file/${item.id}`,
  })
  if (!res.data.success) {
    if (arr.length) {
      arr.shift()
      getwholeSongSrc(arr, callback)
      return
    }
    wx.showToast({
      title: '无法播放',
      icon: 'none'
    })
    return
  }
  const urls = res.data?.data || ''
  if (!urls?.startsWith('http') && urls?.startsWith('//')) {
    const url = res.data?.data.substring(2, res.data?.data.indexOf('mp3') + 3)
    // 截取域名
    const doname = url.substring(0, url.indexOf('/') + 1)
    const remaining = url.substring(url.indexOf('/') + 1)
    callback({ item, src: 'https://' + doname + encodeURIComponent(remaining), stauts: true, mm: true })
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
        stauts: true,
        item
      })
      return
    }
    return callback({
      src: urls,
      stauts: true,
      item
    })
  }
}


// 周杰伦所有音乐
async function getJaySongList(callback) {
  const res = await request({
    url: api + '/list'

  })
  console.log(res, 22)
  const data = [].concat((res.data.playlist.tracks).map(i => ({
    name: i.name,
    title: i.name,
    id: i.id,
    singer: i?.ar.map(it => it.name).join('-'),
    pic: res.data.playlist.coverImgUrl,
    mId: 4 // 该资源下的搜索内容

  })))
  console.log(data, 333)
  callback(data)
}
async function getjaySongSrc(id, callback) {
  const res = await request({
    url: api + '/getSongSrc', data: {
      id
    }

  })
  const res1 = await request({
    url: api + '/getLrc', data: {
      id
    }

  })
  callback({ src: res.data.url, lrc: res1.data.lyric, stauts: true })
}

// // 爱听音乐通过id查询信息
async function atSong(id, callback) {
const {data:userId} =   await wx.getStorage({key:'openId',encrypt:true})
  const res = await request({
    url: api + '/songinfo',
    method: 'post',
    data: {
      id,
      userId
    }
  })
  if (!res.data.url) {
    const ret = await request({
      url: api + `/newMusicList?name=${res.data.title}`,
      method: 'get',

    })
    if (ret.data?.data?.data[0]) {
      const item = ret.data?.data?.data[0];


      gqbSong(item.id, async ({ src, lrc }) => {
        const rem = await request({
          url: api + '/editSong',
          method: 'post',
          data: {
            song: {
              id,
              newid: item.id,
              src
            }
          }
        })
        callback({ src, lrc, stauts: true, newid: item.id })
      })
    }
    // console.log(res.data.data.data,1111)
      return 
  }
  callback({ src: res.data.url, lrc: res.data.lrc, ...res.data, stauts: true, })

}
// gqb查询
// async function atSong(datas, callback) {
//   if (datas.newid) {
//     gqbSong(datas.newid, ({ src, lrc }) => {
//       callback({ src, lrc, stauts: true, })
//     })
//     return
//   }
//   const name = datas.title + ' ' + datas.author
//   const res = await request({
//     url: api + `/newMusicList?name=${name}`,
//     method: 'get',

//   })
//   if (res.data?.data?.data[0]) {
//     const item = res.data?.data?.data[0];


//     gqbSong(item.id,async ({ src, lrc }) => {
//       const ret = await request({
//         url:api+'/editSong',
//         method:'post',
//         data:{
//          song:{
//           id:datas.id,
//           newid:item.id,
//           src
//          }
//         }
//       })
//       callback({ src, lrc, stauts: true,newid:item.id })
//     })
//   }
//   // console.log(res.data.data.data,1111)
//   return


// }
// 新gequbao 通过id查询信息
async function gqbSong(id, callback) {
  console.log(13333)
  const res = await request({
    url: api + '/newSonginfo',
    method: 'post',
    data: {
      id
    }
  })

  callback({ src: res.data.data?.url, lrc: res.data.data?.lrc, ...res.data?.data, stauts: true, })

}
module.exports = {
  atSong,
  getSerachSongOrSinger,
  getSongSrc,
  getwholeSongSrc,
  getJaySongList,
  getjaySongSrc,
  gqbSong

}