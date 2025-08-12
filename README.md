# Minecraft Farm Bot - 自动化农业机器人

一个基于 Node.js 和 Mineflayer 的 Minecraft 自动化农业机器人，具备自动种植、收获、存储和断线重连功能。

用于在原版生存服务器里解放双手，全自动7x24h种田。

## 功能特性

- 🌾 **自动种植** - 支持小麦、胡萝卜、马铃薯、甜菜根的全自动种植
- 🏛️ **自动存储** - 将收获的作物自动存储到箱子中
- 🔄 **断线重连** - 网络断开后自动重连并恢复之前状态
- 🍎 **自动进食** - 自动检查食物值并进食背包中的食物
- 👤 **玩家跟随** - 跟随指定玩家移动
- 📊 **状态监控** - 实时显示农场和机器人状态

## 快速开始

### 使用 Docker (推荐)

```bash
# 拉取镜像
docker pull enderthecoder/minecraft-farm-bot

# 运行默认配置
docker run --name farm-bot enderthecoder/minecraft-farm-bot

# 自定义配置运行
docker run --name farm-bot \
  -e MINECRAFT_HOST="your-server.com" \
  -e MINECRAFT_PORT=25565 \
  -e MINECRAFT_USERNAME="YourBotName" \
  -e MINECRAFT_VERSION="1.21.5" \
  enderthecoder/minecraft-farm-bot
```

### 本地运行

```bash
# 克隆项目
git clone https://github.com/EnderTheCoder/minecraft-farmer-bot
cd minecraft-farm-bot

# 安装依赖
npm install

# 启动机器人
npm start
```

## 环境变量配置

| 变量名                      | 默认值                 | 描述                        |
|--------------------------|---------------------|---------------------------|
| `MINECRAFT_HOST`         | `cloud4.ender.cool` | Minecraft 服务器地址           |
| `MINECRAFT_PORT`         | `25565`             | Minecraft 服务器端口           |
| `MINECRAFT_USERNAME`     | `FarmerBot`         | 机器人用户名                    |
| `MINECRAFT_VERSION`      | `1.21.5`            | Minecraft 版本              |
| `MINECRAFT_PASSWORD`     | `undefined`         | 账户密码（可选）                  |
| `MINECRAFT_AUTH`         | `mojang`            | 认证方式 (mojang 或 microsoft) |
| `RECONNECT_MAX_ATTEMPTS` | `10`                | 最大重连尝试次数                  |
| `RECONNECT_DELAY`        | `5000`              | 重连间隔（毫秒）                  |

## 使用指令

在游戏中对机器人发送以下聊天指令：

- `follow` - 开始跟随玩家
- `stop` - 停止所有操作
- `plant <作物>` - 启动全自动种植模式
    - 支持作物: `wheat`, `carrot`, `potato`, `beetroot`
- `harvest` - 开始收获作物
- `store` - 存储物品到箱子
- `scan` - 扫描耕地区域
- `status` - 显示农场状态
- `eat` - 手动触发进食检查

## 功能详解

### 全自动种植模式

```bash
plant wheat
```

启动后机器人会循环执行：

1. 扫描耕地区域
2. 收获成熟的作物
3. 种植空闲的土地
4. 自动存储收获的作物

### 自动进食

机器人会自动检查食物值：

- 食物值低于18时自动进食
- 优先食用背包中的食物
- 吃到食物值满为止

### 断线重连

- 网络断开后自动重连
- 保持之前的自动种植状态
- 重连后自动恢复操作

### 玩家跟随

- 保持与玩家的安全距离
- 自动寻路跟随

## 项目结构

```
minecraft-farm-bot/
├── farm-bot.js          # 主程序文件
├── Dockerfile           # Docker 配置文件
├── package.json         # 项目依赖配置
├── README.md            # 项目说明文档
└── .dockerignore        # Docker 忽略文件
```

## 依赖项

```json
{
  "dependencies": {
    "mineflayer": "^4.20.0",
    "mineflayer-pathfinder": "^2.2.0",
    "vec3": "^0.1.7"
  }
}
```

## 构建

### 构建 Docker 镜像

```bash
docker build -t enderthecoder/minecraft-farm-bot .
```


## 故障排除

### 常见问题

**Q: 机器人无法连接到服务器**
A: 检查网络连接和服务器地址配置

**Q: 机器人无法种植作物**
A: 确保机器人背包中有种子，并且脚下有耕地

**Q: 重连失败**
A: 检查服务器状态和认证信息

### 日志查看

```bash
# Docker 容器日志
docker logs farm-bot

# 实时日志
docker logs -f farm-bot
```

## 开发

### 本地开发环境

```bash
# 安装开发依赖
npm install --save-dev nodemon

# 开发模式运行
npm run dev
```

### 代码结构

- 主要逻辑在 `farm-bot.js` 文件中
- 模块化设计，易于扩展新功能
- 支持错误处理和异常恢复

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 免责声明

- 请确保在允许使用机器人的服务器上运行此程序
- 使用本程序前请阅读服务器的使用条款
- 开发者不对使用此程序造成的任何后果负责

## 支持

如遇到问题，请提交 Issue 或联系开发者。