# 1. 使用 Node.js 环境
FROM node:18-alpine

# 2. 设置工作目录
WORKDIR /app

# 3. 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 4. 复制所有代码
COPY . .

# 5. 暴露端口
EXPOSE 8080

# 6. 启动命令 (关键修改！)
# 我们不再打包成静态文件，而是直接用开发模式启动
# 这样代码在运行时就能直接读取到 Cloud Run 里的 API Key 了
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
