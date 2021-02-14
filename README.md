# Caf.js

Co-design permanent, active, stateful, reliable cloud proxies with your web app and gadgets.

See http://www.cafjs.com

## Command Line Tools

This is a subset of the functionality of `cafjs`, see `caf_dcinabox` repo for details. It helps to build Docker images faster.

It has no `Caf.js` dependencies and its purpose is to avoid installing all the development dependencies while creating a Docker image.

Also, this package is always installed from the NPM repository, i.e., ignoring the local workspace. This means that we do not need to bundle the `tools` directory in the image.

Building an image typically requires the `build`, `pack`, and `mkStatic` targets. They are invoked inside a `Dockerfile` as usual:

```
    cafjs build
```

but `cafjs` and other build tools are installed inside the image with:

```
    ENV PATH="/usr/local/bin:${PATH}"
    RUN yarn global add caf_build browserify@17.0.0 uglify-es@3.3.9 --prefix /usr/local
```

do not globally install this package outside an image, otherwise you will lose the full `cafjs` tool...
