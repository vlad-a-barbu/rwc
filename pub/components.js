const components = new Map()

function mount(selector, rootComponent) {
  const container = document.querySelector(selector)
  const component = components.get(rootComponent)
  container.innerHTML = component.tag
}

async function loadComponents(registryHref) {
  const registry = await fetch(registryHref)
  const { hrefs } = await registry.json()
  await Promise.all(hrefs.map((href) => loadComponent(href)))
}

async function loadComponent(href) {
  const component = await parseComponent(href)
  const componentClass = class extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: "open" })

      const templateContent = component.template.content.cloneNode(true)
      this.shadowRoot.appendChild(templateContent)

      if (component.style) {
        const styleElement = document.createElement("style")
        styleElement.textContent = component.style.innerHTML
        this.shadowRoot.appendChild(styleElement)
      }
    }

    connectedCallback() {
      if (component.script) {
        const scriptElement = document.createElement("script")
        scriptElement.textContent = `
          function querySelector(selector) {
            return document.querySelector("${component.name}").shadowRoot.querySelector(selector);
          }
          ${component.script.innerText}
        `
        this.shadowRoot.appendChild(scriptElement)
      }
    }
  }
  customElements.define(component.name, componentClass)
  components.set(component.name, component)
}

async function parseComponent(href) {
  const resp = await fetch(href)
  const src = await resp.text()
  const dom = new DOMParser().parseFromString(src, "text/html")
  const name = componentName(href)
  return {
    name,
    tag: `<${name}></${name}>`,
    script: dom.querySelector("script"),
    template: dom.querySelector("template"),
    style: dom.querySelector("style"),
  }
}

function componentName(href) {
  const parts = href.split("/").pop().split(".")
  const name = parts.slice(parts.length - 2)[0]
  return `app-${name}`
}
