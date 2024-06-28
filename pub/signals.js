let subscriber = null

function signal(initial) {
  const state = {
    value: initial,
    subscribers: new Set(),
  }
  return [
    () => {
      if (subscriber) {
        state.subscribers.add(subscriber)
      }
      return state.value
    },
    (newVal) => {
      if (state.value === newVal) return
      state.value = newVal
      state.subscribers.forEach((sub) => sub())
    },
  ]
}

function effect(fn) {
  subscriber = fn
  fn()
  subscriber = null
}

function derived(fn) {
  const [get, set] = signal()
  effect(() => set(fn()))
  return get
}
