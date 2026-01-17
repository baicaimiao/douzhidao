# 1. 使用 Node.js 环境 (前端构建必须)
FROM node:18-alpine

# 2. 设置工作目录
WORKDIR /app

# 3. 复制依赖描述文件
COPY package*.json ./

# 4. 安装项目依赖
RUN npm install

# 5. 复制所有源代码
COPY . .

# 6. 执行打包构建 (会生成一个 dist 文件夹)
RUN npm run build

# 7. 安装一个轻量级服务器 (serve) 来运行打包好的网页
RUN npm install -g serve

# 8. 暴露 8080 端口
EXPOSE 8080

# 9. 启动命令 (运行 dist 文件夹)
CMD ["serve", "-s", "dist", "-l", "8080"]
