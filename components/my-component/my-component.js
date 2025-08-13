class MyComponent extends HTMLElement {
    static #cssPaths = ['my-component.css'];

    constructor() {
        super().attachShadow({ mode: 'open' }).innerHTML = `
            <h1>Hello World</h1>
        `;
        // current shadow root or the first parent shadow root or 'document'
        this.assetHost = this.shadowRoot ?? this.getRootNode();
    }

    connectedCallback() {
        this.#addAssets();
        // ...
    }

    static get Self() { return this; } // Static alias to the current class
    static #basePath = import.meta.resolve('./');
    async #addAssets() {
        const self = this.constructor.Self;
        const paths = self.#cssPaths;
        const stylesheets = await self.#addCss(...paths);
        this.assetHost.adoptedStyleSheets.push(...stylesheets);
    }

    // Load CSS files and cache the stylesheets statically
    static #cssPromiseCache = new Map();
    static async #addCss(...stylesheetPaths) {
        const stylesheets = [];
        const self = this.Self;
        for (let path of stylesheetPaths) {
            path = `${self.#basePath}${path}`;

            // Check if we already have a promise for this stylesheet
            if (!self.#cssPromiseCache.has(path)) {
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

                self.#cssPromiseCache.set(path, stylesheetPromise);
            }

            // Await the cached promise
            const stylesheet = await self.#cssPromiseCache.get(path);
            stylesheets.push(stylesheet);
        }
        return stylesheets;
    }

    ///
    // Statically define the element unless ?define=false is set as an URL param
    static {
        const tag = new URL(import.meta.url).searchParams.get("define") || this.tag;
        if (tag !== "false") this.define(tag);
    }
    static define(tag = camelToKebab(this.name)) {
        this.tag = tag;
        const name = customElements.getName(this);
        if (name) return console.warn(`${this.name} already defined as <${name}>!`);
        const ce = customElements.get(tag);
        if (Boolean(ce) && ce !== this) return console.warn(`<${tag}> already defined as ${ce.name}!`);
        customElements.define(tag, this);
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

/**
 * Converts a CamelCase string into a kebab-case string
 * @param {string} str - The CamelCase string to convert
 * @returns {string} The converted kebab-case string
 * @example
 * camelToKebab("myCamelCaseString"); // "my-camel-case-string"
 */
export function camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}