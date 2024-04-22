// Popup.js (WxComponent)  
const app = getApp();
const time = require('../../utils/time')
const request=time.Promisify(wx.request)
Component({  
  properties: {  
    header: {  
      type: String,  
      value: ''  
    },  
    body: {  
      type: String,  
      value: '6666'  
    },
    show:{
      type:Boolean,
      value:false
    },
    song:{
      type:Object,
      default:{}
    }
  },  
  data:{
    page:1,
    changeId:'',
    paegSize:10,
    count:0,
    playlist:[],
    addSongListFlag:false,
  },
  methods: { 
    newListBtn(){
      console.log(123,this)
      this.setData({
       addSongListFlag:true
      })
    
      },
    stops(event){
       
    }, 
    clickList(e){
      this.setData({
        changeId:e.currentTarget.dataset.id
      })
    },
    newSongList(e){
      const datas = e.detail;
      const that = this
      console.log(e)
      const uploadImg = time.Promisify(wx.uploadFile)
      uploadImg({
        url:app.host+'/upload',
        filePath:datas.image,
        name:'file'
      })
      .then(res=>{
        const data = JSON.parse(res.data)
        if(data.code===200){
          // 更新接口
          wx.showLoading({
            title: '加载中',
          })
          wx.request({
            url:app.host+'/playlist/Add',
            method:'post',
            data:{
        
              userid:app.data.openId,
              img:data.data,
              name:datas.title
            },
            success:res1=>{
              wx.hideLoading()
              if(res1.data.code===200){
                setTimeout(() => {
                  wx.showToast({
                    title:res1.data.message,
                    icon:"success"
                  })
                  that.setData({
                    addSongListFlag:false
                   })
                   this.getList(1,10)
                }, 200);
                return
              }
              setTimeout(() => {
                wx.showToast({
                  title:res.data.message
                })
              }, 200);
            },
            fail:(err)=>{
              wx.hideLoading()
              setTimeout(() => {
                wx.showToast({
                  title:err.message,
                  icon:'error'
                })
              }, 200);
            }
          })
        }
      })
      
    },
    close(){
      console.log("???")
      this.setData({
        addSongListFlag:false
       })
    },
    closePopup() {  
      // 关闭弹窗的方法，可以根据需要自行实现逻辑  
     this.triggerEvent('close') 
    },  
   async  confirm() {  
    if(!this.data.changeId){
      return wx.showToast({
        title:'请选择一个歌单',
        icon:'none'
      })
    }
    wx.showLoading({
      title: '加载中',
    })
   try{
    console.log(this.data.song,this)
    const res = await request({
      url:app.host+'/playlist/addsong',
      method:'post',
      data:{
        id:this.data.changeId+'',
        ids:[this.data.song],
        userid:app.data.openId,
      }
    })
    wx.hideLoading()
    if(res.data.code===200){
      setTimeout(() => {
        wx.showToast({
          title:res.data.data,
          icon:'success'
        })
         // 
         this.cancel()
         // 确认按钮的点击事件，可以根据需要自行实现逻辑  
      }, 200);
      return
    }
    setTimeout(() => {
      wx.showToast({
        title:res.data.data,
        icon:'none'
      })
    }, 200);
   }
   catch(err){
    wx.hideLoading()
    setTimeout(() => {
      wx.showToast({
        title:err.message,
        icon:'error'
      })
    }, 200);
   }
     
      console.log('确认按钮被点击');  
    },  
    cancel() {  
      // 取消按钮的点击事件，可以根据需要自行实现逻辑  
      this.triggerEvent('close',false) 
    },
    async getList(page,paegSize){
      if(page===1){
        this.data.playlist=[]
      }
      wx.showLoading({
        title: '加载中',
      })
      try{
        const res = await request({url:app.host+'/playlist',data:{userid:app.data.openId,page,paegSize}})
        wx.hideLoading()
        if(res.data.code===200){
          this.setData({
            playlist:this.data.playlist.concat(res.data.data.data.map(i=>({...i,img:app.host+'/'+i.img}))),
            count:res.data.data.count
          })
        }
      }
      catch(err){
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title:err.message,
            icon:'error'
          })
        }, 200);
      }
     
    }, 
  } ,
  created(){
    this.getList(1,10)
  } 
});