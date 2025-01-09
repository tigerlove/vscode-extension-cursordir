# Hello World (React + Vite)

This is an implementation of the default [Hello World](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/hello-world) sample extension that demonstrates how to set up and use a [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit) webview extension.

## Documentation

For a deeper dive into how this sample works, read the guides below.

- [Extension structure](./docs/extension-structure.md)
- [Extension commands](./docs/extension-commands.md)
- [Extension development cycle](./docs/extension-development-cycle.md)

## Run The Sample

```bash
# Copy sample extension locally
npx degit microsoft/vscode-webview-ui-toolkit-samples/frameworks/hello-world-react-vite hello-world

# Navigate into sample directory
cd hello-world

# Install dependencies for both the extension and webview UI source code
npm run install:all

# Build webview UI source code
npm run build:webview

# Open sample in VS Code
code .
```

Once the sample is open inside VS Code you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Inside the host window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Hello World (React + Vite): Show`

---

我需要一个和cursor.directory 类似布局的界面的vscode插件，界面为英文，使用@vscode-elements/elements，theme保持和系统对应

## 主要功能
1. 通过左侧菜单列出类别列表
2. 右侧显示prompt 卡片，点击自动设置项目.cursorrules文件，也可以添加到常用中，设置过的自动添加到常用，最新添加到常用的显示在最前面。顶部有tab切换所有和常用
3. 通过命令面板通过名字筛选cursorrules，选择后快速设置