var appInst = getApp();
var thats = this;
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
function pay(that, app, datas) {
  
  //播之前清除一波定时器
  clearInterval(that.data.setInterval);
  app.play();

  if(datas.url==undefined){
    app.src = datas.src;
  }else{
    app.src = datas.url;
  }

  app.title = datas.title;
  app.coverImgUrl = datas.pic;
  app.autoplay = false;
  setTimeout(() => {
    if (that.data.value != 0) {
      app.seek(that.data.value);
      console.log("?????", that.data.value)
    }
  }, 500)
  that.setData({
    title: datas.title,
    author: datas.author,
    img: datas.pic,

    state: false,
    showtime: false,
    pay: "../../image/zt.png"
  });
 
  //走进度条
  that.data.setInterval = setInterval(() => {
   
    that.setData({
      Duration: MinuteConversion(app.duration),
      max: app.duration,
      value: app.currentTime,
      t: app.currentTime,
      conduct: MinuteConversion(app.currentTime)
    });
    app.onEnded(function () {
      //音乐播完自动下一曲
      if (that.data.loopstate==0){
        Nextsong(that, app, appInst)
      } else if (that.data.loopstate == 1){
        app.seek(0)
        pay(that, app, datas)
          that.setData({
            value:0
          })
        console.log("循环播放")
      }else{
        Randomplay(that, app, appInst)
      }
      
      
    });
    // console.log(that.data.t)
    //滚动歌词
    var a = 0
    for (let i = 0; i < that.data.lrc.length; i++) {
      a++
      if (i < that.data.lrc.length - 1) {
        if (that.data.lrc[i + 1].time > that.data.t && that.data.lrc[i].time < that.data.t) {
          that.setData({
            toLineNum: i
          })
        }
      }
    }


  }, 800);
  Lrcget(that, datas)
}
//暂停音乐
function suspend(that, app) {
  app.pause();
  clearInterval(that.data.setInterval);
  that.setData({
    state: true,
    pay: "../../image/bf.png"
  });
}
//小程序关闭后下次进入还是上一次关闭时所保留的状态
function Closestate(that,datas){
console.log(datas)
  var obj={
    max: that.data.max,
    state:that.data.state,
    value: that.data.value,
    pay: that.data.pay,
    t: that.data.t,
    lrc:datas.lrc,
    conduct: that.data.conduct,
    src:datas.url,
    title: datas.title,
    coverImgUrl: datas.pic,
    autoplay:false,
    author: datas.author,
    pic:datas.pic,
    url:datas.url,
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
function Readinfo(that, app, appInst){
  
  wx.getStorage({
    key: 'lastsong',
    success: function (res) {
      console.log(res)
      var datas=res.data;
     
      appInst.data.song=datas;
      app.src = datas.src;
      app.title = datas.title;
      app.coverImgUrl = datas.coverImgUrl;
      
      app.autoplay = false;
    setTimeout(()=>{
     if(!datas.state){
       pay(that, app, datas);
       console.log("sdsds")
     }else{
       suspend(that, app)
     }
      app.seek(datas.value)
      that.setData({
        max: datas.max,
        conduct: datas.conduct,
        title:datas.title,
        author:datas.author,
        Duration: MinuteConversion(datas.max),
        src: datas.src,
        t: datas.t,
        ins:datas.ins,
        state:datas.state,
        lrc:datas.lrc,
        value: datas.value,
        pay: datas.pay,
        img: datas.coverImgUrl

      })
    },200)
    },
  })
}
//下一曲
function Nextsong(that, app, appInst) {
  console.log(appInst)
  var datas = that.data.songList[that.data.ins + 1];
  appInst.data.song = datas;
  that.setData({
    ins: that.data.ins + 1,
    value: 0
  });
  pay(that, app, datas);

}
//上一曲
function Lastsong(that, app, appInst) {
  var datas = that.data.songList[that.data.ins - 1];
  appInst.data.song = datas;
  that.setData({
    ins: that.data.ins - 1,
    value: 0
  });
  pay(that, app, datas);

}
//随机播放
function Randomplay(that, app, appInst){
  var length = that.data.songList.length-1
  var inst = Math.floor(Math.random() * length + 1)
  var datas = that.data.songList[inst];
  appInst.data.song = datas;
  that.setData({
    ins: inst,
    value: 0
  });
  pay(that, app, datas);
}
//获取歌词
function Lrcget(that, datas) {
  var lrc = [];
 
  for (let i of datas.lrc.split('\n')) {
    var obj = { lrc: '', time: '' }
    obj.lrc = i.substring(10);
    obj.time = Splitseconds(i.substring(1, 6));

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
  that.setData({
    lrc: lcc
  })
}
//添加歌曲到播放列表
function addsong(data) {
  console.log(data)
  //创建临时歌曲数据
  var songdata
  var flag=true
  if(data.songlist==''){
    data.songlist=[]
  }
  if (data.song != '') {
   
    if (data.songlist.length == 0) {
     
      data.songlist.unshift(data.song);
      data.paythis.setData({
        ins: 0
      })

      console.log(data)
      wx.setStorage({
        key: 'songlist',
        data: data.songlist,
        success: function (res) {
          console.log('异步保存成功')
        }
      })
      console.log(data.songlist)
    } else if (data.songlist.length < 99) {
   
      for (let i of data.songlist) {
        console.log('进来了')
        if (data.song.songid == undefined && data.song.songId!=undefined) {
          if (data.song.songId == i.songid || data.song.songId == i.songId) {
            flag = true;
            //记录下存在的歌
            songdata = data.song;
            //获取存在歌所在的位置index的值
            for (let i = 0; i < data.songlist.length; i++) {
              if (songdata.title == data.songlist[i].title) {
                data.paythis.setData({
                  ins: i
                })
                console.log(i)
              }
            }
            console.log('重复了')
            return
          } else {
            flag = false;

            console.log('添加')
          }
        } else if (data.song.songid != undefined && data.song.songId == undefined) {
          if (data.song.songid == i.songid || data.song.songid == i.songId) {
            flag = true;
            songdata = data.song;
            //获取存在歌所在的位置index的值
            for (let i = 0; i < data.songlist.length; i++) {
              if (songdata.title == data.songlist[i].title) {
                data.paythis.setData({
                  ins: i
                })
                console.log(i)
              }
            }
            return
            console.log('重复了')
          } else {
            flag = false;
            console.log('添加')
          }
        }
        //歌手部分音乐是否添加
        if (i.musicId == data.song.musicId){
          flag = true;
          songdata = data.song;
          //获取存在歌所在的位置index的值
          for (let i = 0; i < data.songlist.length; i++) {
            if (songdata.title == data.songlist[i].title) {
              data.paythis.setData({
                ins: i
              })
              console.log(i)
            }
          }
           console.log('重复了')
          return
        }else{
          flag = false;

          console.log('添加')
        }
      }
     
    }
    if (!flag) {
      data.songlist.unshift(data.song)
      data.paythis.setData({
        ins:0
      })
      console.log(data)
      wx.setStorage({
        key: 'songlist',
        data: data.songlist,
        success: function (res) {
          console.log('异步保存成功')
        }
      })
    }
  }

}

export { MinuteConversion, pay, suspend, Nextsong, Lastsong, Splitseconds, Lrcget, addsong, Closestate, Readinfo};
