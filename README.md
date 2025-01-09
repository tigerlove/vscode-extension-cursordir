
## Documentation

For a deeper dive into how this sample works, read the guides below.

- [Extension structure](docs/extension-structure.md)
- [Extension commands](./docs/extension-commands.md)
- [Extension development cycle](./docs/extension-development-cycle.md)


我需要一个和cursor.directory 类似布局的界面的vscode插件，界面为英文，使用@vscode-elements/elements，theme保持和系统对应

## 主要功能
1. 通过左侧菜单列出类别列表
2. 右侧显示prompt 卡片，点击自动设置项目.cursorrules文件，也可以添加到常用中，设置过的自动添加到常用，最新添加到常用的显示在最前面。顶部有tab切换所有和常用
3. 通过命令面板通过名字筛选cursorrules，选择后快速设置

## trouble shooting
### npm ERR! missing:
add --no-dependencies option to vsce package and vsce publish
