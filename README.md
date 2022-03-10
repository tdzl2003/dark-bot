# 这是什么

不知道的话，就不要下载了，这项目仅供爱好者学习研究用。

# 安装说明

首先你需要安装 Node.JS 环境，参考[https://nodejs.org](https://nodejs.org)
然后你需要 Git 迁出本项目，或者 Zip 下载并解压（但这样就不方便后续更新了）

执行命令`yarn`安装依赖，将`config.json.template`复制为`config.json`并调整你自己感兴趣的选项

更多选项参见`types.ts`中的`BotConfig`模块。

然后启动`yarn start`。

启动之后，修改配置`config.json`无需重启，自动生效。

# 同时使用浏览器查看状态的说明

你需要在浏览器和配置里使用相同的 token：

1. 你可以在启动后，从 config.json 里找到这边的 token，然后复制到浏览器上应用-Local Storage - token 里使用
2. 你也可以反过来复制，但复制后需要重启

之后浏览器刷新可以看到各种最新状态，但记住不要同时开启浏览器的挂机
