Component({
        data: { 
          title:'新建歌单', 
          music: {  
            id: 1,  
            title: '',  
            image: ''  
          }  
        },   
    methods:{
      getInput(e){
        this.setData({
          ['music.title']: e.detail.value
        })
      },
      formSubmit(){  
       if(!this.data.music.title||!this.data.music.image){
        return wx.showToast({
          title: '请将信息填写完整',
          icon:'none'
        })
       }
        this.triggerEvent('newSongList',this.data.music)
        },
      cancelModal(){
       
        this.triggerEvent('close')
      },
      
          imagePicker() {  
           const that = this
            // 打开图片选择器，选择图片后返回图片路径，赋值给data中的image对象  
            wx.chooseImage({  
              count: 1, // 默认9  
              sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有  
              sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有  
              success:(res)=> {  
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片  
                const tempFilePaths = res.tempFilePaths;  
                that.setData({
                   ['music.image']: tempFilePaths[0] });  
                console.log(that)
              }  
            });  
          }  
    }
})