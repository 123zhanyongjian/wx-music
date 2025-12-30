/**
 * Toast 提示组件
 */
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 提示文字
    message: {
      type: String,
      value: ''
    },
    // 图标类型：success, error, loading, none
    icon: {
      type: String,
      value: 'none'
    },
    // 显示时长（毫秒）
    duration: {
      type: Number,
      value: 2000
    },
    // 是否显示遮罩
    mask: {
      type: Boolean,
      value: false
    }
  },

  data: {
    timer: null
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  },

  methods: {
    startTimer() {
      this.clearTimer();
      const timer = setTimeout(() => {
        this.hide();
      }, this.data.duration);
      this.setData({ timer });
    },

    clearTimer() {
      if (this.data.timer) {
        clearTimeout(this.data.timer);
        this.setData({ timer: null });
      }
    },

    hide() {
      this.setData({ show: false });
      this.triggerEvent('close');
    },

    onMaskTap() {
      if (this.data.mask) {
        this.hide();
      }
    }
  },

  lifetimes: {
    detached() {
      this.clearTimer();
    }
  }
});

