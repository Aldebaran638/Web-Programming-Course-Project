FROM ubuntu:24.04

RUN apt update && apt install -y nginx \
    git \
    python3

# 清理apt缓存以减小镜像体积
RUN rm -rf /var/lib/apt/lists/*

RUN mkdir /workspace

# 设置工作目录
WORKDIR /workspace