# Text Diff Tool

A lightweight, browser-based diff tool built with **Vue 3** and **Vite**. This tool provides a Git-style interface for comparing text directly in your browser, with privacy-focused local storage persistence.

[![Live Demo](https://img.shields.io/badge/demo-online-2ea44f.svg?style=flat&logo=google-chrome&logoColor=white)](https://text-diff-tool.caloskao.org/)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)

## Try it Online

You can use the fully functional tool directly in your browser without any installation:

**[text-diff-tool.caloskao.org](https://text-diff-tool.caloskao.org/)**

## Features

* **Git-Style Visualization**: Powered by `diff2html` and `jsdiff` to render unified diffs.
* **Split & Inline Views**: Switch between "Side-by-Side" and "Line-by-Line" comparison modes.
* **Safe Clear & Undo**: Accidentally cleared your work? The Undo button restores content from a temporary buffer.
* **Dark Mode Support**: Fully optimized GitHub-style dark theme that respects system preferences (Auto/Light/Dark).
* **Syntax Highlighting**: Automatic code highlighting via `highlight.js`.
* **Privacy Focused**: All data is stored in your browser's `localStorage`. Nothing is sent to any server.
* **Raw Patch Export**: Generate and copy standard `.diff`/`.patch` text format.

## Tech Stack

* **Framework**: Vue 3 (Composition API, `<script setup>`)
* **Build Tool**: Vite
* **Diff Engine**: [jsdiff](https://github.com/kpdecker/jsdiff)
* **Renderer**: [diff2html](https://diff2html.xyz/)
* **Syntax Highlighting**: [highlight.js](https://highlightjs.org/)

## Getting Started

### Prerequisites

* Node.js (v18.0 or higher)
* npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/caloskao/text-diff-tool.git](https://github.com/caloskao/text-diff-tool.git)
    cd text-diff-tool
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## Building for Production

To create a production-ready build:

```bash
npm run build
```

The output files will be in the `dist/` directory, ready to be deployed to any static host (GitHub Pages, Vercel, Netlify, etc.).

## License

This project is licensed under the MIT License.