# Co-located Styles

A pattern I'm using to co-locate styles in web components until [CSS Modules](https://frontendmasters.com/blog/architecture-through-component-colocation/) become more widely supported.

The `cssPaths` static property is an array that contains the paths to the stylesheets that should be loaded when the component is instantiated. The paths are relative to the component's JavaScript file and are only loaded once regardless of how many instances of the component are created.

The `addAssets` method is responsible for loading these stylesheets and adding them to the component's *asset host*.

```js
this.assetHost = this.shadowRoot ?? this.getRootNode();
```

The `assetHost` property is the shadow root of the component if it has one, or the document itself if the component is not in a shadow DOM. If the component is inside the shadow DOM of another component, the `assetHost` will be the closest ancestor shadow root.

## Live Demo
[colocated-styles.netlify.app](https://colocated-styles.netlify.app/)