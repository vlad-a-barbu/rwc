const components = new Map()

async function createApp(registryHref, rootSelector, rootComponent) {
  await loadComponents(registryHref)
  mount(rootSelector, rootComponent)
}

function mount(selector, componentName) {
  const container = document.querySelector(selector)
  const component = components.get(componentName)
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
      if (!component.script) {
        return
      }

      const scriptElement = document.createElement("script")
      scriptElement.textContent = `
          function querySelector(selector) {
            return document.querySelector("${component.name}").shadowRoot.querySelector(selector);
          }
          ${component.script.innerText}
        `
      this.shadowRoot.appendChild(scriptElement)
      compileAttributes(this.shadowRoot)
    }
  }

  customElements.define(component.name, componentClass)
  components.set(component.name, component)
}

function compileAttributes(root) {
  root.querySelectorAll("[r-click]").forEach((x) => {
    x.addEventListener("click", new Function(x.getAttribute("r-click")))
  })
  let id = 0
  root.querySelectorAll("[r-content]").forEach((x) => {
    x.setAttribute("r-id", ++id)
    const content = x.getAttribute("r-content")
    const effectScript = `
      effect(() => {
        querySelector("[r-id='${id}']").innerText = new Function("return ${content}")()
      });
    `
    const scriptElement = document.createElement("script")
    scriptElement.textContent = effectScript
    root.appendChild(scriptElement)
  })
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
