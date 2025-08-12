class MyComponent extends HTMLElement {
    static #cssPaths = ['my-component.css'];
    static #basePath = import.meta.resolve('./');
    // Private static alias to the current class (works with subclassing too)
    static get #Self() { return this; }
    #host;

    constructor() {
        super().attachShadow({ mode: 'open' }).innerHTML = `
            <h1>Hello World</h1>
        `;
        // current shadow root or 'document' or the first parent shadow root
        this.#host = this.shadowRoot ?? this.getRootNode();
    }

    connectedCallback() {
        this.#addAssets();
       // …
    }

    async #addAssets() {
        const C = this.constructor.#Self;
        const stylesheets = await C.#css(...C.#cssPaths);
        this.#host.adoptedStyleSheets.push(...stylesheets);
    }

    // Load CSS files and cache the stylesheets statically
    static async #css(...stylesheetPaths) {
        const stylesheets = [];
        const C = this.#Self;
        for (let path of stylesheetPaths) {
            path = `${C.#basePath}${path}`;

            // Check if we already have a promise for this stylesheet
            if (!C.#cssPromiseCache.has(path)) {
                // Create and cache the complete stylesheet creation promise
                const stylesheetPromise = fetch(path)
                    .then(response => {
                        if (!response.ok) throw new Error(`Failed to fetch stylesheet: ${path}`);
                        return response.text();
                    })
                    .then(async (cssText) => { return await createStylesheet(cssText); })
                    .catch(error => {
                        console.error(`Error loading stylesheet ${path}:`, error);
                        return new CSSStyleSheet(); // Return empty stylesheet as fallback
                    });

                C.#cssPromiseCache.set(path, stylesheetPromise);
            }

            // Await the cached promise
            const stylesheet = await C.#cssPromiseCache.get(path);
            stylesheets.push(stylesheet);
        }
        return stylesheets;
    }
    static #cssPromiseCache = new Map();

    ///

    // Statically define the element unless ?define=false is set as an URL param
    static tag = "my-component";
    static define(tag = this.tag) {
        this.tag = tag;
        const name = customElements.getName(this);
        if (name) return console.warn(`${this.name} already defined as <${name}>!`);
        const ce = customElements.get(tag);
        if (Boolean(ce) && ce !== this) return console.warn(`<${tag}> already defined as ${ce.name}!`);
        customElements.define(tag, this);
    }
    static {
        const tag = new URL(import.meta.url).searchParams.get("define") || this.tag;
        if (tag !== "false") this.define(tag);
    }
}


/**
 * Creates a CSSStyleSheet from CSS text
 * @param {string} cssText - The CSS text to create a stylesheet from
 * @returns {Promise<CSSStyleSheet>} A promise that resolves to a CSSStyleSheet
 */
export async function createStylesheet(cssText) {
    const stylesheet = new CSSStyleSheet();
    await stylesheet.replace(cssText);
    return stylesheet;
}