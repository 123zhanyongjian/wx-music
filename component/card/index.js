/**
 * 通用卡片组件
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 卡片标题
    title: {
      type: String,
      value: ''
    },
    // 卡片描述
    description: {
      type: String,
      value: ''
    },
    // 卡片图片
    image: {
      type: String,
      value: ''
    },
    // 是否显示阴影
    shadow: {
      type: Boolean,
      value: true
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      value: false
    },
    // 自定义类名
    customClass: {
      type: String,
      value: ''
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
    /**
     * 点击事件
     */
    onTap(e) {
      if (this.data.clickable) {
        this.triggerEvent('tap', e.detail);
      }
    }
  }
});

