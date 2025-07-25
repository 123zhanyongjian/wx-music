Component({
  properties: {
    list: Array,
    showPlayBtn: { type: Boolean, value: true },
    showMoreBtn: { type: Boolean, value: true }
  },
  methods: {
    onPlay(e) {
      this.triggerEvent('play', e.currentTarget.dataset.item);
    },
    onMore(e) {
      this.triggerEvent('more', e.currentTarget.dataset.item);
    }
  }
}); 