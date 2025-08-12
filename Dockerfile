FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口
EXPOSE 3000

# 默认环境变量
ENV MINECRAFT_HOST=localhost
ENV MINECRAFT_PORT=25565
ENV MINECRAFT_USERNAME=FarmerBot
ENV MINECRAFT_VERSION=1.21.5
ENV RECONNECT_MAX_ATTEMPTS=10
ENV RECONNECT_DELAY=5000

# 启动命令
CMD ["node", "farm-bot.js"]
