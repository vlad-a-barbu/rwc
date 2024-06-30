let subscriber = null

function signal(initial) {
  const state = {
    value: initial,
    subscribers: new Set(),
  }
  const get = () => {
    if (subscriber) {
      state.subscribers.add(subscriber)
    }
    return state.value
  }
  const set = (newVal) => {
    if (state.value === newVal) return
    state.value = typeof newVal === "function" ? newVal(state.value) : newVal
    state.subscribers.forEach((sub) => sub())
  }
  return [get, set]
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
