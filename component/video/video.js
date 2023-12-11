const app = getApp()
const tiem = require('../../utils/time.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: true,
      // observer: function (newVal, oldVal, changedPath) {
      //   // 属性被改变时执行的函数（可选），也可以写成在methods段中定义的方法名字符串
      //   // 通常 newVal 就是新设置的数据， oldVal 是旧数据
      // }
    },
    src:{
      type:String,
      value:'',
    },
    initialTime:{
      type:Number,
      value:0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindtimeupdate(e){
      if(this.src===app.data.paythis.src){
        app.data.paythis.setData({
          value:e.detail.currentTime,
          conduct: tiem.MinuteConversion(e.detail.currentTime)
        })
      }
   
    }
  }
})