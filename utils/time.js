const utils = require('./util');
let InitialValue = true;
let InitialValue1 = true;
let loopFlag = false;
let request = Promisify(wx.request);

/**
 * 获取 app 实例
 * @returns {Object}
 */
function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    return null;
  }
}

// 秒转分钟
function MinuteConversion(second) {
  const Minute = parseInt(second / 60);
  const Seccond = parseInt(second - Minute * 60);
  return `${Minute < 10 ? '0' + Minute : Minute}:${Seccond < 10 ? '0' + Seccond : Seccond}`;
}

// 分转秒
function Splitseconds(Minute) {
  const Minutes = Minute.substring(0, 2);
  const Second = Minute.substring(3, 5);
  return Number(Minutes * 60) + Number(Second);
}

// 继续播放音乐
function Continuemusic() {}

// 下一曲
function Nextsong(that, app, appInst) {
  if (that.data.songList.length === 1) return;
  const datas = that.data.songList[that.data.ins + 1];
  that.setData({ value: 0, Crack: false,lastPlayTime: 0 });
  const appInstance = appInst || getAppInstance();
  if (appInstance && appInstance.data) {
    appInstance.data.song = datas;
  }
  if (!datas.pic) {
    wholelist(appInstance || app);
  } else {
    playCore(that, app, datas, 1, that.data.currentQuality.resource, that.data.currentQuality.level);
  }
}

// 上一曲
function Lastsong(that, app, appInst) {
  const datas = that.data.songList[that.data.ins - 1];
  that.setData({ value: 0, Crack: false,lastPlayTime:0 });
  const appInstance = appInst || getAppInstance();
  if (appInstance && appInstance.data) {
    appInstance.data.song = datas;
  }
  if (!datas.pic) {
    wholelist(appInstance || app);
  } else {
    playCore(that, app, datas, 0, that.data.currentQuality.resource, that.data.currentQuality.level);
  }
}

// 随机播放
function Randomplay(that, app, appInst) {
  const length = that.data.songList.length;
  const inst = Math.floor(Math.random() * length);
  that.setData({ value: 0, Crack: false });
  const datas = that.data.songList[inst];
  const appInstance = appInst || getAppInstance();
  if (appInstance && appInstance.data) {
    appInstance.data.song = datas;
  }
  if (!datas.pic) {
    wholelist(appInstance || app);
  } else {
    playCore(that, app, datas, 0, that.data.currentQuality.resource, that.data.currentQuality.level);
  }
}

function Lrcget(that, datas) {
  if (!datas.lrc) {
    return [{ lrc: '暂无歌词', time: 0 }];
  }

  // 关键步骤：将 [00:00:00] 转换为 [00:00.00]
  const unifiedLrc = datas.lrc.replace(/(\d{2}:\d{2}):(\d{2})/g, '$1.$2');
  
  // 匹配统一后的格式 [分:秒.毫秒]
  const timeRegex = /\[(\d{2}:\d{2}\.\d{2})\]/g;
  let lrc = [];

  for (const line of unifiedLrc.split('\n')) {
    const timeMatch = line.match(timeRegex);
    if (!timeMatch) continue;

    // 提取时间和歌词
    const timeStr = timeMatch[0].replace(/\[|\]/g, '');
    const lyric = line.replace(timeRegex, '').trim();
    if (!lyric) continue;

    // 转换为秒数（分:秒.毫秒 → 总秒数）
    const seconds = Splitseconds(timeStr);
    lrc.push({ lrc: lyric, time: seconds });
  }

  // 按时间排序
  lrc.sort((a, b) => a.time - b.time);

  // 处理最后一行时间
  if (lrc.length > 1) {
    lrc[lrc.length - 1].time = lrc[lrc.length - 2].time + 60;
  }

  that.setData({
    lrc
  })
}

// 自定义promise函数
function Promisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = resolve;
      obj.fail = reject;
      fn(obj);
    });
  };
}

// 歌单全部问题处理
function wholelist(app) {
  app.data.paythis.setData({ Crack: false });
  const songmidid = app.data.song.mid;
  const mvid = app.data.song.vid;
  request({
    url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg`,
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
      callback: 'callback'
    }
  }).then(res => {
    const res1 = res.data.replace("callback(", "");
    const res2 = JSON.parse(res1.substring(0, res1.length - 1));
    const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`;
    app.data.song.src = playUrl;
    app.data.song.title = app.data.song.name;
    app.data.song.author = app.data.song.singer;
    app.data.song.pic = app.data.song.image;

    if (!app.data.song.pic) {
      request({
        url: `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${songmidid}&tpl=yqq_song_detail&format=jsonp&callback=getOneSongInfoCallback&g_tk=5381&jsonpCallback=getOneSongInfoCallback&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`
      }).then(res => {
        const data = res.data.replace('getOneSongInfoCallback(', '');
        const songData = JSON.parse(data.substring(0, data.length - 1));
        app.data.song.pic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${songData.data[0].album.mid}.jpg?max_age=2592000`;
        
        if (mvid) {
          request({ url: `https://v1.itooi.cn/tencent/mv?id=${mvid}` }).then(rev => {
            let id;
            Object.keys(rev.data.data).forEach((item, index) => {
              if (index === 0) id = { ...rev.data.data[item] };
            });
            app.data.song.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=270`;
            app.data.paythis.setData({ Mvsrc: app.data.song.Mvsrc, value: 0 });
            playCore(app.data.paythis, app.innerAudioContext, app.data.song);
          });
        } else {
          app.data.paythis.setData({ Mvsrc: '', value: 0 });
          playCore(app.data.paythis, app.innerAudioContext, app.data.song);
        }
      });
    } else {
      app.data.paythis.setData({ value: 0 });
      playCore(app.data.paythis, app.innerAudioContext, app.data.song);
    }
  });
}

// 新添加歌单方法
function newAddSong(data) {
  return [];
  let indexs;
  data.songlist = Array.isArray(data.songlist) ? data.songlist : [];
  const flag = data.songlist.some((item, index) => {
    indexs = index;
    return item.id === data.song.id;
  });
  if (!flag && data.song) {
    data.songlist.splice((data.paythis.data.ins + 1), 0, data.song);
    wx.setStorage({
      key: 'songlist',
      data: data.songlist,
      success: () => {
        const appInst = getAppInstance();
        if (appInst && appInst.data && appInst.data.paythis) {
          appInst.data.paythis.setData({ songList: data.songlist });
        }
      }
    });
  }
}

// 下一首播放
function nextSongPay(data) {
  if (data.songlist[data.paythis.data.ins]?.id === data.song.id) {
    return wx.showToast({ title: '正在播放中', icon: 'none' });
  }
  let indexs;
  data.songlist = Array.isArray(data.songlist) ? data.songlist : [];
  const flag = data.songlist.some((item, index) => {
    indexs = index;
    return item.id === data.song.id;
  });
  if (flag) data.songlist.splice(indexs, 1);
  setTimeout(() => {
    const ins = data.paythis.data.ins;
    data.songlist.splice(ins + 1, 0, data.song);
    wx.showToast({ title: '添加成功', icon: 'success' });
    wx.setStorage({ key: 'songlist', data: data.songlist });
  }, 500);
}

// 防抖函数
function debounce() {
  let timeout = null;
  return function (fn, wait) {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  };
}

// 保存播放列表
function saveStoreSongList(arr) {
  wx.getStorage({
    key: 'songlist',
    success: (res) => {
      const newSongList = [...(res.data || []), ...arr].filter((v, i, a) => 
        a.findIndex(t => t.id === v.id) === i
      );
      wx.setStorage({
        key: 'songlist',
        data: newSongList,
        success: () => {
          const appInst = getAppInstance();
          if (appInst && appInst.data && appInst.data.paythis) {
            appInst.data.paythis.setData({ songList: newSongList });
          }
        }
      });
    },
    fail: () => {
      wx.setStorage({
        key: 'songlist',
        data: arr,
        success: () => {
          const appInst = getAppInstance();
          if (appInst && appInst.data && appInst.data.paythis) {
            appInst.data.paythis.setData({ songList: arr });
          }
        }
      });
    }
  });
}

// 暂停播放
function suspend(that, app) {
  InitialValue = false;
  app.pause();
  clearInterval(that.data.setInterval);
  that.setData({ state: true, pay: "../../image/bf.png" });
  
  const appInst = getAppInstance();
  
  app.onPause(() => {
    if (appInst && appInst.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', false);
    }
    if (appInst && appInst.data && appInst.data.paythis) {
      appInst.data.paythis.setData({ pay: '../../image/bf.png', state: true, isPlaying: false });
    }
  });
  
  app.onPlay(() => {
    if (appInst && appInst.data && appInst.data.paythis) {
      appInst.data.paythis.setData({ pay: '../../image/zt.png', state: false, isPlaying: true });
    }
    if (appInst && appInst.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', true);
    }
  });
}

// 保存关闭状态
function Closestate(that, datas) {
  const obj = {
    max: that.data.max,
    state: that.data.state,
    value: that.data.value,
    pay: that.data.pay,
    Crack: that.data.Crack,
    t: that.data.t,
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
  wx.setStorage({ key: 'lastsong', data: obj });
}

// 读取缓存状态
function Readinfo(that, app, appInst) {
  wx.getStorage({
    key: 'lastsong',
    success: (res) => {
      const datas = res.data.datas;
      const appInstance = appInst || getAppInstance();
      if (appInstance && appInstance.data) {
        appInstance.data.song = datas.song;
      }
      that.setData({
        max: datas.max,
        conduct: datas.conduct,
        title: datas.title,
        author: datas.author,
        Duration: MinuteConversion(datas.max),
        src: datas.song.src,
        t: datas.t,
        ins: datas.ins,
        state: datas.state,
        song: { ...datas.song, readStorage: true },
        lrc: datas.song.lrc,
        value: datas.value,
        pay: datas.pay,
        id: datas.id,
        img: datas.coverImgUrl || datas.img
      });
    }
  });
}

// 核心播放方法（支持音质切换）
async function playCore(that, app, datas, restart, resource = null, level = null) {
  const appInst = getAppInstance();
  
  // 暂停事件
  app.onPause(() => {
    if (appInst && appInst.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', false);
    }
    if (appInst && appInst.data && appInst.data.paythis) {
      appInst.data.paythis.setData({ pay: '../../image/bf.png', state: true, isPlaying: false });
    }
    if (wx.getAppBaseInfo().version > '8.0.47' && appInst && appInst.data && appInst.data.song) {
      app.title = appInst.data.song?.title;
      app.singer = appInst.data.song?.author;
    }
  });

  // 播放事件
  app.onPlay(() => {
    if (appInst && appInst.data && appInst.data.paythis) {
      appInst.data.paythis.setData({ pay: '../../image/zt.png', state: false, isPlaying: true });
    }
    if (appInst && appInst.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', true);
    }
  });

  if (that.data.songList.length === 1) {
    that.setData({ loopstate: 1 });
  }
  // 同一首歌继续播放
  if (that.data.song&&datas && that.data.song.id === datas.id && !loopFlag&&level===that.data.beforeCurrentQuality.level) {
    console.log('同一首歌继续播放');
    if (that.data.state) {
      if (!app._onTimeUpdateHandler || !app._onEndedHandler) {
        if (that.data.song.readStorage) {
          app.src = datas.src;
          app.title = datas.title;
          app.coverImgUrl = datas.pic;
          app.singer = datas.author;
          app.onCanplay(() => {
            if (InitialValue && InitialValue1) {
              app.seek(that.data.value);
              InitialValue1 = false;
            }
          });
          Lrcget(that, datas);
          if (appInst && appInst.eventBus) {
            appInst.eventBus.emit("songChanged", datas);
          }
        }

        // 绑定进度更新
        app._onTimeUpdateHandler = function () {
          if (that.data.song?.id !== datas.id) return;
          that.setData({
            Duration: MinuteConversion(app.duration),
            max: app.duration,
            value: app.currentTime,
            t: app.currentTime,
            conduct: MinuteConversion(app.currentTime)
          });

          // 歌词滚动
          if (that.data.lrc?.length > 1) {
            for (let i = 0; i < that.data.lrc.length; i++) {
              if (i < that.data.lrc.length - 1 &&
                that.data.lrc[i + 1].time > that.data.t &&
                that.data.lrc[i].time < that.data.t &&
                i !== that.data.toLineNum && !that.data.isScroll) {
                that.setData({ toLineNum: i });
                if (wx.getAppBaseInfo().version > '8.0.47') {
                  app.title = that.data.lrc[i].lrc;
                  app.singer = `${datas.title} - ${datas.author}`;
                }
              }
            }
          }
        };
        app.onTimeUpdate(app._onTimeUpdateHandler);

        // 绑定结束事件
        app._onEndedHandler = () => that.Next?.();
        app.onEnded(app._onEndedHandler);
      }
      app.play();
      return;
    } else {
      wx.showToast({ title: '该歌曲正在播放中', icon: 'none' });
      return;
    }
  } else if (loopFlag) {
    app.src = datas.src;
    app.title = datas.title;
    app.coverImgUrl = datas.pic;
    app.singer = datas.author;
    app.seek(0);
    app.play();
    return;
  }

  // 重置进度
  that.setData({ value: 0, max: 0, Duration: '00:00', conduct: '00:00' });

  // 获取音频资源（带音质参数）
  await new Promise((resolve) => {
    wx.showLoading({ title: '加载中' });
    console.log(datas, resource, level,'333')
    utils.errorSong(5, datas, resource, level, async (e) => { // 传递音质参数
      console.log(e,'444')
      if (e.stauts) {
        loopFlag = false;
        if (appInst && appInst.data) {
          appInst.data.song = { ...e, id: datas.id };
        }
        datas.src = e.src;
        if (e.lrc) datas.lrc = e.lrc;
        if (e.pic) datas.pic = e.pic;
        if (e.newid) datas.newid = e.newid;

        // 更新全局音频配置 
        app.src = datas.src;
        app.title = datas.title;
        app.coverImgUrl = datas.pic;
        app.singer = datas.author;

        // 保存到播放列表
        saveStoreSongList([datas]);
        if (appInst && appInst.eventBus) {
          appInst.eventBus.emit("songChanged", datas);
        }
        if(that.data.paythis&&app&&that.data.beforeCurrentQuality.level !== level){
           app.onCanplay(() => {
            console.log('onCanplay event', that.data.paythis, app);
             app.seek(that.data.lastPlayTime||0)
           })
         
        }
        console.log(level, that.data.beforeCurrentQuality.level, that.data.lastPlayTime,'333')
        // 更新页面数据
        that.setData({
          title: datas.title,
          song: datas,
          author: datas.author,
          img: datas.pic,
          beforeCurrentQuality: that.data.currentQuality,
          ins: (that.data.songList || []).findIndex(i => i.id === datas.id)
        });
        // 处理歌词
        if (e.lrc) Lrcget(that, datas);

        // 播放
        app.play();
        wx.hideLoading();
        resolve();
      } else {
        console.log("????????????????????")
        that.Next?.();
        wx.hideLoading();
        resolve();
      }
    });
  });

  // 解绑旧事件
  if (app._onTimeUpdateHandler && app.offTimeUpdate) app.offTimeUpdate(app._onTimeUpdateHandler);
  if (app._onEndedHandler && app.offEnded) app.offEnded(app._onEndedHandler);

  // 绑定新事件
  app._onTimeUpdateHandler = function () {
    console.log('onTimeUpdate event',that, app)
    if (that.data.song?.id !== datas.id) return;
    that.setData({
      Duration: MinuteConversion(app.duration),
      max: app.duration,
      value: app.currentTime,
      t: app.currentTime,
      conduct: MinuteConversion(app.currentTime)
    });

    // 歌词滚动
    if (that.data.lrc?.length > 1) {
      for (let i = 0; i < that.data.lrc.length; i++) {
        if (i < that.data.lrc.length - 1 &&
          that.data.lrc[i + 1].time > that.data.t &&
          that.data.lrc[i].time < that.data.t &&
          i !== that.data.toLineNum && !that.data.isScroll) {
          that.setData({ toLineNum: i });
          if (wx.getAppBaseInfo().version > '8.0.47') {
            app.title = that.data.lrc[i].lrc;
            app.singer = `${datas.title} - ${datas.author}`;
          }
        }
      }
    }

    // 结束事件
    app.onEnded(function () {
      if (that.data.loopstate === 0) {
        that.onNext();
      } else if (that.data.loopstate === 1) {
        loopFlag = true;
        that.setData({ value: 0 });
        playCore(that, app, datas, 0, that.data.currentQuality.resource, that.data.currentQuality.level);
      } else {
        Randomplay(that, app, appInst);
      }
    });
  };
  app.onTimeUpdate(app._onTimeUpdateHandler);

  // 苹果系统上下曲
  app.onNext(() => {
    if (that.data.songList.length - 1 > that.data.ins) {
      Nextsong(that, app, appInst);
    } else {
      that.setData({ ins: -1 });
      Nextsong(that, app, appInst);
    }
  });

  app.onPrev(() => {
    if (that.data.ins > 0) {
      Lastsong(that, app, appInst);
    } else {
      const songlistLength = (appInst && appInst.data && appInst.data.songlist) ? appInst.data.songlist.length : 0;
      that.setData({ ins: songlistLength });
      Lastsong(that, app, appInst);
    }
  });

  // 启动播放
  app.play();
}

// 导出所有方法
export {
  saveStoreSongList,
  debounce,
  MinuteConversion,
  suspend,
  Nextsong,
  Lastsong,
  Splitseconds,
  Lrcget,
  wholelist,
  Closestate,
  Readinfo,
  Promisify,
  newAddSong,
  nextSongPay,
  playCore
};