var appInst = getApp();
var thats = this;
const utils = require('./util')
let InitialValue = true;
let InitialValue1 = true
let errorFlag = false
var request = Promisify(wx.request)
//秒转分钟
function MinuteConversion(second) {
  var Minute = parseInt(second / 60);
  var Seccond = parseInt(second - Minute * 60);
  if (Minute < 10) {
    Minute = "0" + Minute;
  }
  if (Seccond < 10) {
    Seccond = "0" + Seccond;
  }
  var time = Minute + ":" + Seccond;
  return time;
}
//分转秒
function Splitseconds(Minute) {

  var Minutes = Minute.substring(0, 2);
  var Second = Minute.substring(3, 5)
  var seconds = Number(Minutes * 60) + Number(Second);

  return seconds;


}
//继续播放音乐
function Continuemusic() {

}

//重头播放音乐
async function pay(that, app, datas, restart) {
  datas.errorNum = 0
  //播之前清除一波定时器
  clearInterval(that.data.setInterval);
  if (that.data.value === 0 || restart) {
    // 新音乐才重新赋值
    const loveList = that.returnloveList()
    app.title = datas.title;
    app.coverImgUrl = datas.pic;
    app.autoplay = false;
    app.singer = datas.author
    console.log(datas.src, 54321)
    that.setData({
      title: datas.title,
      song: datas,
      author: datas.author,
      img: datas.pic,
      Mvsrc: datas.isMv ? appInst.host+'/mv?id='+datas.id : '',
      state: false,
      showtime: false,
      pay: "../../image/zt.png",
      isScroll:false,
      id: datas.id,
      loveState: loveList.some(i => i.id === datas.id),
      ins: ([].concat(that.data.songList)).findIndex(i => i.id === datas.id),
      lrc: [{
        lrc: '暂无歌词'
      }],
    });
    that.changeTitle() /// 修改标题
    if(!datas.src){
      wx.showLoading({
        title: '加载中',
      })
      utils.errorSong(datas.mId, datas, async(e) => {
        errorFlag = true;
        wx.hideLoading()
        if (e.stauts) {
        
          datas.errorNum++
          app.title = datas.title;
          app.coverImgUrl = datas.pic;
          app.autoplay = false;
          app.singer = datas.author;
          datas.src = e.src;
          app.src = e.src;
          if (that.data.songList.findIndex(i => i.id === datas.id) !== -1) {
            that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].src = e.src;
           if(e.newid){
            that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].newid = e.newid
           }
            that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].pic = e.pic||datas.pic
          }
          if (e.lrc) {
            datas.lrc = e.lrc
            Lrcget(that, datas)
          }
          if(e.pic){
            that.setData({
              img:e.pic
            })
            datas.pic = e.pic
            app.coverImgUrl = e.pic
          }
          wx.setStorage({
            key: 'songlist',
            data: that.data.songList,
            success: function (res) {
              console.log('异步保存成功');
            }
          })
    
    
    
          //将最新的数据保存起来
          const rem = await request({
            url: appInst.host + '/editSong',
            method: 'post',
            data: {
              song: {
                id:datas.id,
                src:datas.src,
                pic:datas.pic,
                lrc:datas.lrc
              }
            }
          })
          console.log(rem,333)
          return
        } else {
          wx.hideLoading()
          //   console.log(123)
          that.next()
    
        }
        console.log(543)
    
      })
    }
    else{
    app.src = datas.src;
   
  }
}
  app.play();
  //苹果手机系统下一首
  app.onNext(() => {

    if (that.data.songList.length - 1 > that.data.ins) {
      Nextsong(that, app, appInst)
    } else {
      that.setData({
        ins: -1
      })
      Nextsong(that, app, appInst)
    }
  })
  //苹果手机系统上一首
  app.onPrev(() => {

    if (that.data.ins > 0) {
      Lastsong(that, app, appInst)
    } else {
      that.setData({
        ins: appInst.data.songlist.length
      })
      Lastsong(that, app, appInst)
    }
  })




  // 播放音乐出错的情况自动下一首，并且删除播放列表这首歌；
  app.onError(() => {
    if(datas.errorNum>2){
     // 链接来源出错 下一首
     wx.showToast({
      title:'地址失效',
      icon:'error'
    })
    setTimeout(() => {
      that.next()
    }, 2000);
    return
  }

  wx.showLoading({
    title: '加载中',
  })
  utils.errorSong(datas.mId, datas, async(e) => {
    errorFlag = true;
    wx.hideLoading()
    if (e.stauts) {
    
      datas.errorNum++
      app.title = datas.title;
      app.coverImgUrl = datas.pic;
      app.autoplay = false;
      app.singer = datas.author;
      datas.src = e.src;
      app.src = e.src;
      if (that.data.songList.findIndex(i => i.id === datas.id) !== -1) {
        that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].src = e.src;
       if(e.newid){
        that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].newid = e.newid
       }
        that.data.songList[that.data.songList.findIndex(i => i.id === datas.id)].pic = e.pic||datas.pic
      }
      if (e.lrc) {
        datas.lrc = e.lrc
        Lrcget(that, datas)
      }
      if(e.pic){
        that.setData({
          img:e.pic
        })
        datas.pic = e.pic
        app.coverImgUrl = e.pic
      }
      wx.setStorage({
        key: 'songlist',
        data: that.data.songList,
        success: function (res) {
          console.log('异步保存成功');
        }
      })



      //将最新的数据保存起来
      const rem = await request({
        url: appInst.host + '/editSong',
        method: 'post',
        data: {
          song: {
            id:datas.id,
            src:datas.src,
            pic:datas.pic,
            lrc:datas.lrc
          }
        }
      })
      console.log(rem,333)
      return
    } else {
      wx.hideLoading()
      //   console.log(123)
      that.next()

    }
    console.log(543)

  })
    // }


  })
  //走进度条

  app.onTimeUpdate(async function () {
    if (that.data.lrc.length === 1 && datas.lrc) {
      Lrcget(that, datas)
    }
   
    if (that.data.ins === -1 || that.data.ins !== that.data.songList.findIndex(i => i.id === datas.id)) {
      that.setData({
        ins: that.data.songList.findIndex(i => i.id === datas.id)
      })
    }
    if(that.data.value>2){
      datas.errorNum = 0 // 如果成功播放 就清空错误次数
    }
    that.setData({
      Duration: MinuteConversion(app.duration),
      max: app.duration,
      value: app.currentTime,
      t: app.currentTime,
      conduct: MinuteConversion(app.currentTime)
    });
    app.onEnded(function () {
      //音乐播完自动下一曲
      if (that.data.loopstate == 0) {
        //顺序播放
        that.next()
      } else if (that.data.loopstate == 1) {

        app.seek(0)
        that.setData({
          value: 0
        })
        pay(that, app, datas)


      } else {
        Randomplay(that, app, appInst)
      }


    });


    //滚动歌词
    if (that.data.lrc.length) {
      for (let i = 0; i < that.data.lrc.length; i++) {

        if (i < that.data.lrc.length - 1) {
          if (that.data.lrc[i + 1].time > that.data.t && that.data.lrc[i].time < that.data.t) {

            if (i != that.data.toLineNum&&!that.data.isScroll) {
              that.setData({
                toLineNum: i
              })
              // app.singer = that.data.lrc[i].lrc; // 显示动态歌词在左面
            }
          }
        }
      }

    }
    // 播放音乐出错的情况自动下一首；
    // app.onError(() => {
    //   wx.
    //   Nextsong(that, app, appInst)
    // })


  })
  // 获取歌词
  if (datas.mId === 3 && !datas.lrc) {
    datas.lrc = await utils.GETlRC(datas.id)

  }
  if(datas.mId===5&&that.data.lrc.length === 1&&!datas.lrc&&!datas.getLrc){
    // 获取歌词
    const res  =await request({
      url:appInst.host+'/songinfo',
      method:'post',
      data:{
        id:datas.id
      }
    })
    that.setData({
      lrc:res.data.lrc
    })
    datas.lrc = res.data.lrc;
    datas.getLrc = true
    Lrcget(that,datas)
  
  }

}
//暂停音乐
function suspend(that, app) {
  InitialValue = false
  app.pause();
  clearInterval(that.data.setInterval);
  that.setData({
    state: true,
    pay: "../../image/bf.png"
  });
}
//小程序关闭后下次进入还是上一次关闭时所保留的状态
function Closestate(that, datas) {

  var obj = {
    max: that.data.max,
    state: that.data.state,
    value: that.data.value,
    pay: that.data.pay,
    Crack: that.data.Crack,
    t: that.data.t,
    // lrc: datas.lrc,
    conduct: that.data.conduct,
    src: datas.url,
    title: datas.title,
    coverImgUrl: datas.pic,
    autoplay: false,
    author: datas.author,
    pic: datas.pic,
    url: datas.url,
    ins: that.data.ins


  };
  wx.setStorage({
    key: 'lastsong',
    data: obj,
    success: function (res) {
      console.log('缓存成功')
    }
  })

}
//读取小程序关闭后下次进入还是上一次关闭时所保留的信息
function Readinfo(that, app, appInst) {
  console.log(InitialValue, 444)
  wx.getStorage({
    key: 'lastsong',
    success: function (res) {
      const datas = res.data;
      that.setData({
        max: datas.max,
        Crack: that.data.Crack,
        conduct: datas.conduct,
        title: datas.title,
        author: datas.author,
        Duration: MinuteConversion(datas.max),
        src: datas.src,
        t: datas.t,
        ins: datas.ins,
        state: datas.state,
        // lrc: datas.lrc,
        value: datas.value,
        pay: datas.pay,
        id: datas.id,
        img: datas.coverImgUrl

      })
      if (datas.src == undefined) {
        app.src = datas.url;
      } else {
        app.src = datas.src;
      }
      app.title = datas.title;
      app.coverImgUrl = datas.coverImgUrl;
      app.seek(datas.value)

      appInst.data.song = datas;

      app.onCanplay(() => {
        if (InitialValue && InitialValue1) {
          app.seek(datas.value)
          InitialValue1 = false
        }
      })
      app.onSeeked(() => {
        if (InitialValue) {
          suspend(that, app)

        }
      })


    },
  })
}
//下一曲
function Nextsong(that, app, appInst) {
  var datas = that.data.songList[that.data.ins + 1];
  that.setData({
    value: 0,
    Crack: false,
  });
  appInst.data.song = datas;
  if (appInst.data.song.pic == undefined) {

    wholelist(appInst)

  } else {





    pay(that, app, datas, 1);
  }


}
//上一曲
function Lastsong(that, app, appInst) {

  var datas = that.data.songList[that.data.ins - 1];
  that.setData({
    value: 0,
    Crack: false,
  });
  appInst.data.song = datas;
  if (appInst.data.song.pic == undefined) {

    wholelist(appInst)
  } else {


    pay(that, app, datas);
  }

}
//随机播放
function Randomplay(that, app, appInst) {
  var length = that.data.songList.length

  var inst = Math.floor(Math.random() * length);
  that.setData({
    value: 0,
    Crack: false,
  });
  var datas = that.data.songList[inst];
  appInst.data.song = datas;
  if (appInst.data.song.pic == undefined) {

    wholelist(appInst);

  } else {


    pay(that, app, datas);
  }
}
//获取歌词
function Lrcget(that, datas) {
  const Lrctime =/(\d{1,2}:\d{2}\.?\d+)/g
  const lrcs  =/\[(\d{1,2}:\d{2}\.?\d+)\]/g
  if (datas.lrc) {
    var lrc = [];

    for (let i of datas.lrc.split('\n')) {
      var obj = { lrc: '', time: '' }
      obj.lrc = i.replace(lrcs,'');
      obj.time = Splitseconds((i.match(Lrctime))?(i.match(Lrctime))[0]:'');

      lrc.push(obj)
    }
    console.log(lrc)
    that.setData({
      lrc: lrc
    })
    //如果有乱码
    var lcc = []
    for (let i of that.data.lrc) {
      var lc = { lrc: '', time: '' }
      lc.lrc = i.lrc.split(']').join('');
      lc.time = i.time;
      lcc.push(lc)
    }
    lcc[lcc.length-1].time =60+(lcc[lcc.length-2].time) //
  
    that.setData({
      lrc: lcc
    })
  }
}
//自定义promise函数
function Promisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        resolve(res)
      }

      obj.fail = function (res) {
        reject(res)
      }

      fn(obj)//执行函数，obj为传入函数的参数
    })
  }
}

//歌单全部问题
function wholelist(app) {
  app.data.paythis.setData({
    Crack: false
  })
  console.log('?????434343')
  var songmidid = app.data.song.mid
  var mvid = app.data.song.vid
  request({
    url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&loginUin=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&filename=C400${songmidid}.m4a&guid=3913883408&songmid=${songmidid}&callback=callback`,
    data: {
      g_tk: 5381,
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      notice: 0,
      format: 'jsonp',
      hostUin: 0,
      loginUin: 0,
      platform: 'yqq',
      needNewCode: 0,
      cid: 205361747,
      uin: 0,
      filename: `C400${songmidid}.m4a`,
      guid: 3913883408,
      songmid: songmidid,
      callback: 'callback',
    }

  })
    .then(res => {

      var res1 = res.data.replace("callback(", "")
      var res2 = JSON.parse(res1.substring(0, res1.length - 1))
      const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
      app.data.song.src = playUrl;
      app.data.song['title'] = app.data.song.name;
      app.data.song['author'] = app.data.song.singer;
      app.data.song['pic'] = app.data.song.image;
      if (app.data.song.pic == undefined) {
        var mid = app.data.song.mid
        request({
          url: 'https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=' + mid + '&tpl=yqq_song_detail&format=jsonp&callback=getOneSongInfoCallback&g_tk=5381&jsonpCallback=getOneSongInfoCallback&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0'
        })
          .then(res => {
            res = res.data.replace('getOneSongInfoCallback(', '');
            res = JSON.parse(res.substring(0, res.length - 1))
            app.data.song.pic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${res.data[0].album.mid}.jpg?max_age=2592000`
            //获取mv
            if (mvid) {
              request({
                url: `https://v1.itooi.cn/tencent/mv?id=${mvid}`
              })
                .then(rev => {
                  console.log(rev, '2222222222222222222222222222222222222222222222222222');
                  let id;
                  Object.keys(rev.data.data).forEach((item, index) => {
                    if (index === 0) {
                      id = { ...rev.data.data[item] }
                    }
                  })
                  // app.data.paythis.data.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=270`
                  app.data.song.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=270`

                  app.data.paythis.setData({
                    Mvsrc: appInst.data.song.Mvsrc,
                    Crack: false,
                    value: 0
                  })
                  console.log('???', app.data.song)
                  pay(app.data.paythis, app.innerAudioContext, app.data.song);
                })

            } else {
              app.data.paythis.setData({
                Mvsrc: '',
                Crack: false,
                value: 0

              })
              console.log(111)
              pay(app.data.paythis, app.innerAudioContext, app.data.song);
            }


          })
      } else {
        app.data.paythis.setData({

          value: 0, Crack: false,

        })
        pay(app.data.paythis, app.innerAudioContext, app.data.song);
        console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      }



    })
}
//请求歌词
function GetLRC(data, that) {
  var request = Promisify(wx.request);
  console.log(data)
  let pic = 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg';
  let url;
  if (pic === data.pic) {
    url = `https://music.163.com/api/song/media?id=${data.id}`
  } else {
    url = `https://api.mlwei.com/music/api/?key=523077333&cache=1&type=song&id=${data.mid}&size=hq`
  }
  request({
    url: url,
  })
    .then(res => {
      if (pic === data.pic) {
        data.lrc = res.data.lyric
      } else {
        request({
          url: res.data.lrc
        })
          .then(ret => {
            data.lrc = ret.data
          })
      }
    })
}

// 新添加歌单方法
function newAddSong(data) {
  let indexs
  console.log(data)
  data.songlist = Array.isArray(data.songlist) ? data.songlist : []
  let flag = data.songlist.some((item, index) => {
    indexs = index;
    return item.id === data.song.id

  })
  if (flag) {
    return
  } else {
    if (data.song) {
      
      data.songlist.splice((data.paythis.data.ins+1),0,data.song)
    }
    wx.setStorage({
      key: 'songlist',
      data: data.songlist,
      success: function (res) {
        console.log('异步保存成功', data.songlist)
      }
    })
  }
}
//下一首播放
function nextSongPay(data) {
  //现在播放的和选的是一样的，结束
  console.log(data.songlist[data.paythis.data.ins],data.song)
  if (data.songlist[data.paythis.data.ins]?.id === data.song.id) {
    return wx.showToast({
      title: '正在播放中',
      icon: 'none'
    })
  }
  let indexs
  console.log(data)
  data.songlist = Array.isArray(data.songlist) ? data.songlist : []
  let flag = data.songlist.some((item, index) => {
    indexs = index;
    return item.id === data.song.id

  })
  if (flag) {
    data.songlist.splice(indexs, 1)//删除原有的歌曲
  }
  setTimeout(() => {
    let ins = data.paythis.data.ins;
    data.songlist.splice(ins + 1, 0, data.song);//将新歌添加到播放
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
    wx.setStorage({
      key: 'songlist',
      data: data.songlist,
      success: function (res) {
        console.log('异步保存成功', data.songlist)
      }
    })
  }, 500); // 需要获取最新的ins 所以用了延迟
}
function debounce() {
  let timeout = null;
  return function (fn, wait) {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  }
}
export { debounce, MinuteConversion, pay, suspend, Nextsong, Lastsong, Splitseconds, Lrcget, wholelist, Closestate, Readinfo, Promisify, newAddSong, nextSongPay };
