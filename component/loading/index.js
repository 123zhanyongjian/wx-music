/**
 * 加载组件
 */
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 加载文字
    text: {
      type: String,
      value: '加载中...'
    },
    // 是否全屏
    fullscreen: {
      type: Boolean,
      value: false
    },
    // 背景色
    backgroundColor: {
      type: String,
      value: 'rgba(0, 0, 0, 0.7)'
    }
  },

  data: {
  },

  methods: {
  }
});

