# 🤫 Hush Line Docs

This repository contains documentation for installing and running [Hush Line](https://github.com/scidsg/hushline), a free and open-source, self-hosted anonymous tip line that makes it easy for organizations or individuals to install and use.

**Currently, you can [read the documentation here](https://scidsg.github.io/hushline-docs/book/intro.html).**

This documentation is built using [mdBook](https://github.com/rust-lang/mdBook) (v0.4.34).

## Making changes: quick start

### Install mdbook
To build or serve locally, you'll need to [install mdbook](https://rust-lang.github.io/mdBook/guide/installation.html). 

### Making changes to source files
1. Write/edit markdown and add images to the `src/` directory
2. Theming (tweaks to CSS) should done by adding a `theme` directory next to the `src` directory. In this `theme` directory, you can overwrite a number of the mdBook default style files, including CSS styling and HTML templates. Here's [a full list of such files](https://rust-lang.github.io/mdBook/format/theme/index.html).
3. To preview your changes locally, run `mdbook serve` and open [http://localhost:3000](http://localhost:3000/) in your browser.
4. When you're ready to publish, you'll want to "build" the mdBook using `mdbook build` command. This commands **overwrites** the `book` directory with all the HTML files that are your book. Ideally we'd have GitHub Pages host this directory as a public-facing website. (Here [some documentation on that](https://rust-lang.github.io/mdBook/continuous-integration.html#deploying).)

### Adding new chapters (pages)

To add a new page, it's best to add it to `src/SUMMARY.md`, which serves as a kind of table of contents for the book, and then run `mdbook build`. MdBook will then create a new markdown file for your new chapter. 

Use sub-directories in `src/` to create sub-pages.

## Contributors
- [@sts10](https://github.com/sts10)
- [@glenn-sorrentino](https://github.com/glenn-sorrentino)
