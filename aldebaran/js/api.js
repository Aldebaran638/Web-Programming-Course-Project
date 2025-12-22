// 基础 API 封装与令牌管理
const BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getRole() {
  return localStorage.getItem("role") || "";
}

function setAuth(token, role) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({
    "Content-Type": "application/json"
  }, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  // 尝试解析为 JSON
  try { return await res.json(); } catch { return null; }
}

// 课程列表
async function getCourses(params) {
  const usp = new URLSearchParams(params);
  return apiFetch(`/api/v1/courses?${usp.toString()}`);
}

// 课程详情
async function getCourse(id) {
  return apiFetch(`/api/v1/courses/${id}`);
}

// 登录
async function login(username, password) {
  return apiFetch(`/api/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

// 忘记密码
async function forgotPassword(email) {
  return apiFetch(`/api/v1/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

// 重置密码
async function resetPassword(token, new_password) {
  return apiFetch(`/api/v1/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, new_password })
  });
}

// 管理员批量创建学生
async function batchCreateStudents(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/api/v1/users/batch-create-students`, {
    method: "POST",
    body: fd
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
