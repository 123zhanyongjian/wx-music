/**
 * Modal 对话框组件
 */
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 标题
    title: {
      type: String,
      value: '提示'
    },
    // 内容
    content: {
      type: String,
      value: ''
    },
    // 确认按钮文字
    confirmText: {
      type: String,
      value: '确定'
    },
    // 取消按钮文字
    cancelText: {
      type: String,
      value: '取消'
    },
    // 是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: true
    },
    // 确认按钮颜色
    confirmColor: {
      type: String,
      value: '#1DB954'
    },
    // 是否显示遮罩
    mask: {
      type: Boolean,
      value: true
    },
    // 点击遮罩是否关闭
    maskClosable: {
      type: Boolean,
      value: false
    }
  },

  data: {
  },

  methods: {
    onConfirm() {
      this.triggerEvent('confirm');
      this.hide();
    },

    onCancel() {
      this.triggerEvent('cancel');
      this.hide();
    },

    onMaskTap() {
      if (this.data.maskClosable) {
        this.hide();
      }
    },

    hide() {
      this.setData({ show: false });
      this.triggerEvent('close');
    },

    stopPropagation() {
      // 阻止事件冒泡
    }
  }
});

