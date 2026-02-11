FROM web-project-env:latest

WORKDIR /workspace

# 把前端静态文件拷到 /workspace/dist
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./source /workspace

# 容器启动时自动以前台方式启动 nginx
CMD ["nginx", "-g", "daemon off;"]