/**
 * 空状态组件
 */
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 图片路径
    image: {
      type: String,
      value: '/image/nodata.png'
    },
    // 提示文字
    text: {
      type: String,
      value: '暂无数据'
    },
    // 按钮文字（如果有按钮）
    buttonText: {
      type: String,
      value: ''
    }
  },

  data: {
  },

  methods: {
    onButtonTap() {
      this.triggerEvent('buttonTap');
    }
  }
});

