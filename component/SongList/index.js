Component({
  properties: {
    list: Array,
    showPlayBtn: { type: Boolean, value: true },
    showMoreBtn: { type: Boolean, value: true }
  },
  methods: {
    onPlay(e) {
      this.triggerEvent('play', {song:e.currentTarget.dataset.item});
    },
    onMore(e) {
      this.triggerEvent('more', {song:e.currentTarget.dataset.item})
    }
  }
}); 