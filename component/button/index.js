/**
 * 通用按钮组件
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 按钮文字
    text: {
      type: String,
      value: '按钮'
    },
    // 按钮类型：primary, secondary, danger, text
    type: {
      type: String,
      value: 'primary'
    },
    // 按钮大小：small, medium, large
    size: {
      type: String,
      value: 'medium'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否加载中
    loading: {
      type: Boolean,
      value: false
    },
    // 是否圆形按钮
    round: {
      type: Boolean,
      value: false
    },
    // 是否块级按钮
    block: {
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
      if (this.data.disabled || this.data.loading) {
        return;
      }
      this.triggerEvent('tap', e.detail);
    }
  }
});

