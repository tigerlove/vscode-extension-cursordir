"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const RulesViewProvider_1 = require("./panels/RulesViewProvider");
/**
 * 扩展激活时调用的入口函数
 * @param context 扩展上下文，用于注册命令和管理资源
 */
function activate(context) {
    // 注册打开规则查看器的命令
    let disposable = vscode.commands.registerCommand('cursor-rules.openViewer', () => {
        // 创建并显示规则面板
        RulesViewProvider_1.RulesViewProvider.getInstance(context.extensionUri).show();
    });
    // 将命令添加到订阅列表中，确保正确释放资源
    context.subscriptions.push(disposable);
}
/**
 * 扩展停用时调用的清理函数
 */
function deactivate() { }
//# sourceMappingURL=extension.js.map