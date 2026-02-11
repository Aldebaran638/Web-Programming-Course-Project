@echo off

REM 切到脚本所在目录（dist）
cd /d "%~dp0"
cd

echo delete old container
docker rm -f web-project-container

echo build env image
docker build -t web-project-env:latest ./env

echo build project image
docker build -t web-project-image:latest .

echo run container
docker run -d -p 8001:8001 --name web-project-container web-project-image:latest