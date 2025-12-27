from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form, status, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json
import hashlib
import secrets
from dataclasses import dataclass
from pydantic import BaseModel
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Text,
    Enum,
    ForeignKey,
    DECIMAL,
    and_,
    or_,
    asc,
    desc,
    Boolean,
    DateTime,
    Time,
)
from sqlalchemy.orm import sessionmaker, relationship, joinedload, declarative_base
from sqlalchemy.exc import SQLAlchemyError
import math
import logging

DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/Web-Programming-Course-Project?charset=utf8mb4"

Base = declarative_base()

logging.basicConfig(level=logging.INFO)

# ORM Models
class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("student", "teacher", "edu_admin", "sys_admin", name="user_role"), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    status = Column(Enum("active", "locked", name="user_status"), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)


class Class(Base):
    __tablename__ = "Classes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    class_name = Column(String(100), unique=True, nullable=False)
    department = Column(String(100))
    enrollment_year = Column(Integer)
    is_deleted = Column(Boolean, default=False, nullable=False)


class StudentProfile(Base):
    __tablename__ = "StudentProfiles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    student_id_number = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    class_id = Column(Integer, ForeignKey("Classes.id"))

    user = relationship("User")
    class_ = relationship("Class")


class Course(Base):
    __tablename__ = 'Courses'
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(50), unique=True, nullable=False)
    course_name = Column(String(100), nullable=False)
    credits = Column(DECIMAL(3, 1), nullable=False)
    description = Column(Text)
    department = Column(String(100))
    prerequisites = Column(Text)
    is_deleted = Column(Integer, default=0)
    teaching_assignments = relationship("TeachingAssignment", back_populates="course")

class TeachingAssignment(Base):
    __tablename__ = 'TeachingAssignments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey('TeacherProfiles.id'))
    course_id = Column(Integer, ForeignKey('Courses.id'))
    semester = Column(String(50), nullable=False)
    is_deleted = Column(Integer, default=0)
    course = relationship("Course", back_populates="teaching_assignments")
    teacher = relationship("TeacherProfile", back_populates="teaching_assignments")

class TeacherProfile(Base):
    __tablename__ = 'TeacherProfiles'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    teacher_id_number = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    title = Column(String(50))
    teaching_assignments = relationship("TeachingAssignment", back_populates="teacher")


class Classroom(Base):
    __tablename__ = "Classrooms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    location = Column(String(255))
    capacity = Column(Integer)


class CourseMaterial(Base):
    __tablename__ = "CourseMaterials"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("Courses.id"), nullable=False)
    material_type = Column(Enum("document", "video", "carousel_image", "config", name="material_type"), nullable=False)
    title = Column(String(255))
    file_path_or_content = Column(String(255))
    display_order = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("Users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)

    course = relationship("Course")
    uploader = relationship("User")


class Enrollment(Base):
    __tablename__ = "Enrollments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("StudentProfiles.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("Courses.id"), nullable=False)
    semester = Column(String(50), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)

    student = relationship("StudentProfile")
    course = relationship("Course")


class CourseSchedule(Base):
    __tablename__ = "CourseSchedules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    teaching_id = Column(Integer, ForeignKey("TeachingAssignments.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("Classrooms.id"), nullable=False)
    day_of_week = Column(Enum("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", name="day_of_week"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    teaching = relationship("TeachingAssignment")
    classroom = relationship("Classroom")


class GradeItem(Base):
    __tablename__ = "GradeItems"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("Courses.id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    weight = Column(DECIMAL(5, 2), nullable=False)
    description = Column(Text)
    assignment_id = Column(Integer, ForeignKey("Assignments.id"))
    is_deleted = Column(Boolean, default=False, nullable=False)


class Assignment(Base):
    __tablename__ = "Assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("Courses.id"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    file_path = Column(String(255))
    deadline = Column(DateTime)
    type = Column(Enum("assignment", "exam", name="assignment_type"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)


class Grade(Base):
    __tablename__ = "Grades"
    id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = Column(Integer, ForeignKey("Enrollments.id"), nullable=False)
    grade_item_id = Column(Integer, ForeignKey("GradeItems.id"), nullable=False)
    score = Column(DECIMAL(5, 2))
    status = Column(Enum("pending", "graded", "published", name="grade_status"), nullable=False, default="pending")
    graded_at = Column(DateTime)
    grader_id = Column(Integer, ForeignKey("Users.id"))
    is_deleted = Column(Boolean, default=False, nullable=False)

    enrollment = relationship("Enrollment")
    grade_item = relationship("GradeItem")
    grader = relationship("User")


class TaskProgress(Base):
    __tablename__ = "TaskProgress"
    id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = Column(Integer, ForeignKey("Enrollments.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("CourseMaterials.id"), nullable=False)
    status = Column(Enum("todo", "done", name="task_status"), nullable=False, default="todo")
    last_access_time = Column(DateTime)

    enrollment = relationship("Enrollment")
    material = relationship("CourseMaterial")


class AssignmentSubmission(Base):
    __tablename__ = "AssignmentSubmissions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("Assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("StudentProfiles.id"), nullable=False)
    file_path = Column(String(255))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    score = Column(DECIMAL(5, 2))
    feedback = Column(Text)
    graded_at = Column(DateTime)
    grader_id = Column(Integer, ForeignKey("Users.id"))
    is_deleted = Column(Boolean, default=False, nullable=False)

    assignment = relationship("Assignment")
    student = relationship("StudentProfile")
    grader = relationship("User")


class CourseComment(Base):
    __tablename__ = "CourseComments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("Courses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("CourseComments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False, nullable=False)


class Log(Base):
    __tablename__ = "Logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id"))
    action = Column(String(255), nullable=False)
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# 可通用恢复的资源映射（仅包含有 is_deleted 字段的表）
RESTORABLE_MODELS = {
    "users": User,
    "classes": Class,
    "courses": Course,
    "coursematerials": CourseMaterial,
    "enrollments": Enrollment,
    "gradeitems": GradeItem,
    "assignments": Assignment,
    "grades": Grade,
    "assignmentsubmissions": AssignmentSubmission,
    "coursecomments": CourseComment,
}

# Pydantic Schemas
class TeacherOut(BaseModel):
    id: int
    full_name: str
    class Config:
        orm_mode = True

class CourseOut(BaseModel):
    id: int
    course_code: str
    course_name: str
    credits: float
    description: Optional[str]
    department: Optional[str]
    prerequisites: Optional[str]
    teachers: List[TeacherOut]
    class Config:
        orm_mode = True

class Pagination(BaseModel):
    totalItems: int
    totalPages: int
    currentPage: int
    pageSize: int

class CourseListResponse(BaseModel):
    pagination: Pagination
    courses: List[CourseOut]

# FastAPI app

app = FastAPI(title="成绩管理教学平台 API", version="1.0.0")
# 允许 CORS：支持 127.0.0.1 / localhost 上 5500-8000 端口
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    # 使用正则放宽到 5500-8000 范围内的所有端口
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):(55[0-9]{2}|5[6-9][0-9]{2}|6[0-9]{3}|7[0-9]{3}|8000)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def db_error_handler(request: Request, exc: SQLAlchemyError):
    """统一处理数据库访问异常：返回测试数据并在日志中提醒。"""

    logging.error(
        "数据库访问失败: %s %s - %s",
        request.method,
        request.url.path,
        repr(exc),
    )

    return JSONResponse(
        status_code=200,
        content={
            "data": {"sample": True},
            "error": {
                "code": "DB_ACCESS_ERROR",
                "message": "当前接口访问数据库失败，本接口返回的是后端测试数据",
            },
        },
    )

# SQLAlchemy session
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 允许的排序字段
ALLOWED_SORT_FIELDS = {
    'course_code': Course.course_code,
    'course_name': Course.course_name,
    'credits': Course.credits,
    'department': Course.department
}

@app.get("/api/v1/courses", response_model=CourseListResponse)
def get_courses(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    sortBy: str = Query('course_code'),
    order: str = Query('asc'),
    course_code: Optional[str] = None,
    course_name: Optional[str] = None,
    department: Optional[str] = None,
    credits: Optional[float] = None
):
    if sortBy not in ALLOWED_SORT_FIELDS:
        raise HTTPException(status_code=400, detail={
            "error": {
                "code": "INVALID_PARAMETER",
                "message": f"无效的排序字段 '{sortBy}'。"
            }
        })
    sort_column = ALLOWED_SORT_FIELDS[sortBy]
    sort_func = asc if order == 'asc' else desc
    session = SessionLocal()
    try:
        query = session.query(Course).filter(Course.is_deleted == 0)
        # 搜索条件
        if course_code:
            query = query.filter(Course.course_code == course_code)
        if course_name:
            query = query.filter(Course.course_name.like(f"%{course_name}%"))
        if department:
            query = query.filter(Course.department == department)
        if credits is not None:
            query = query.filter(Course.credits == credits)
        total_items = query.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        # 排序和分页
        query = query.order_by(sort_func(sort_column))
        query = query.offset((page - 1) * pageSize).limit(pageSize)
        courses = query.options(joinedload(Course.teaching_assignments).joinedload(TeachingAssignment.teacher)).all()
        # 组装结果
        result_courses = []
        for c in courses:
            teachers = []
            for ta in c.teaching_assignments:
                if ta.teacher and ta.is_deleted == 0:
                    teachers.append(TeacherOut(id=ta.teacher.id, full_name=ta.teacher.full_name))
            result_courses.append(CourseOut(
                id=c.id,
                course_code=c.course_code,
                course_name=c.course_name,
                credits=float(c.credits),
                description=c.description,
                department=c.department,
                prerequisites=c.prerequisites,
                teachers=teachers
            ))
        return CourseListResponse(
            pagination=Pagination(
                totalItems=total_items,
                totalPages=total_pages,
                currentPage=page,
                pageSize=pageSize
            ),
            courses=result_courses
        )
    finally:
        session.close()

# 你可以通过 http://localhost:8000/docs 访问Swagger UI 文档页面，在线调试API。


# =====================
# 用户登录（骨架实现）
# =====================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginUserInfo(BaseModel):
    id: int
    username: str
    role: str
    force_password_change: bool = True

class LoginResponse(BaseModel):
    token: str
    user: LoginUserInfo

LOGIN_LOCK_DURATION = timedelta(minutes=5)
MAX_FAILED_ATTEMPTS = 5

def hash_password(password: str) -> str:
    """简单示例：使用 SHA-256 对明文密码进行哈希。

    实际项目应使用带盐哈希和专门密码库。
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    """将 ISO8601 字符串解析为 datetime，支持末尾的 'Z'。解析失败返回 None。"""
    if not value:
        return None
    try:
        v = value.strip()
        if v.endswith("Z"):
            v = v.replace("Z", "+00:00")
        return datetime.fromisoformat(v)
    except Exception:
        return None


@dataclass
class CurrentUser:
    id: int
    username: str
    role: str
    student_profile_id: Optional[int] = None
    teacher_profile_id: Optional[int] = None


# 简单内存态：token -> 当前用户信息（仅用于课程项目示例，进程重启会失效）
active_tokens: Dict[str, CurrentUser] = {}

# 登录失败计数与锁定信息，按用户名记录
failed_login_state: Dict[str, Dict[str, Any]] = {}


def get_current_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """从 Authorization: Bearer <token> 中解析当前登录用户。"""

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "未登录或令牌缺失。"}
        })
    token = authorization.split(" ", 1)[1].strip()
    user = active_tokens.get(token)
    if not user:
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "登录已过期或令牌无效。"}
        })
    return user


class DevRegisterRequest(BaseModel):
    """开发环境用的简化注册请求模型。

    仅供本课程项目开发调试使用，不做复杂校验。
    """

    username: str
    password: str
    role: str  # student/teacher/edu_admin/sys_admin
    email: str
    full_name: Optional[str] = None
    class_id: Optional[int] = None          # 学生可选班级
    student_id_number: Optional[str] = None # 学号
    teacher_id_number: Optional[str] = None # 工号
    title: Optional[str] = None             # 教师职称


@app.post("/api/v1/dev/register")
def dev_register(payload: DevRegisterRequest):
    """开发用注册接口：可以快速创建任意角色用户及其档案。

    - student: 创建 Users + StudentProfiles（可选 class_id、student_id_number、full_name）
    - teacher: 创建 Users + TeacherProfiles（可选 teacher_id_number、full_name、title）
    - edu_admin/sys_admin: 仅创建 Users 记录
    """

    if payload.role not in {"student", "teacher", "edu_admin", "sys_admin"}:
        raise HTTPException(status_code=400, detail={
            "error": {"code": "INVALID_ROLE", "message": "role 必须是 student/teacher/edu_admin/sys_admin 之一"}
        })

    session = SessionLocal()
    try:
        # 简单唯一性检查
        exists = session.query(User).filter(User.username == payload.username, User.is_deleted == False).first()
        if exists:
            raise HTTPException(status_code=400, detail={
                "error": {"code": "USERNAME_EXISTS", "message": "该用户名已存在"}
            })

        exists_email = session.query(User).filter(User.email == payload.email, User.is_deleted == False).first()
        if exists_email:
            raise HTTPException(status_code=400, detail={
                "error": {"code": "EMAIL_EXISTS", "message": "该邮箱已被使用"}
            })

        user = User(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role=payload.role,
            email=payload.email,
            status="active",
            is_deleted=False,
        )
        session.add(user)
        session.flush()

        created_profile = None

        if payload.role == "student":
            # 如果未提供学号，则使用 username 作为学号
            sid = payload.student_id_number or payload.username
            # 如果未提供姓名，则用用户名占位
            full_name = payload.full_name or payload.username

            # 可选班级检查（不存在则直接忽略，让前端简化）
            class_id = None
            if payload.class_id:
                cls = session.query(Class).filter(Class.id == payload.class_id, Class.is_deleted == False).first()
                class_id = cls.id if cls else None

            created_profile = StudentProfile(
                user_id=user.id,
                student_id_number=sid,
                full_name=full_name,
                class_id=class_id,
            )
            session.add(created_profile)

        elif payload.role == "teacher":
            tid = payload.teacher_id_number or payload.username
            full_name = payload.full_name or payload.username
            created_profile = TeacherProfile(
                user_id=user.id,
                teacher_id_number=tid,
                full_name=full_name,
                title=payload.title or "讲师",
            )
            session.add(created_profile)

        session.commit()

        return {
            "message": "注册成功（开发模式）",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "email": user.email,
            },
        }
    finally:
        session.close()


@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    session = SessionLocal()
    try:
        user = (
            session.query(User)
            .filter(User.username == payload.username, User.is_deleted == False)
            .first()
        )
        if not user:
            raise HTTPException(status_code=401, detail={
                "error": {"code": "UNAUTHORIZED", "message": "用户名或密码错误。"}
            })

        if user.status == "locked":
            raise HTTPException(status_code=423, detail={
                "error": {"code": "ACCOUNT_LOCKED", "message": "账户已锁定，请联系管理员。"}
            })

        state = failed_login_state.get(user.username, {"failed_attempts": 0, "locked_until": None})
        now = datetime.utcnow()
        locked_until = state.get("locked_until")
        if locked_until and now < locked_until:
            raise HTTPException(status_code=423, detail={
                "error": {"code": "ACCOUNT_LOCKED", "message": "账户已锁定，请稍后再试。"}
            })

        # 验证密码（与批量创建学生时的规则保持一致：直接对明文做 SHA-256）
        expected_hash = user.password_hash or ""
        if hash_password(payload.password) != expected_hash:
            state["failed_attempts"] = int(state.get("failed_attempts", 0)) + 1
            if state["failed_attempts"] >= MAX_FAILED_ATTEMPTS:
                state["locked_until"] = now + LOGIN_LOCK_DURATION
                failed_login_state[user.username] = state
                raise HTTPException(status_code=423, detail={
                    "error": {"code": "ACCOUNT_LOCKED", "message": "密码错误次数过多，账户已暂时锁定。"}
                })
            failed_login_state[user.username] = state
            raise HTTPException(status_code=401, detail={
                "error": {"code": "UNAUTHORIZED", "message": "用户名或密码错误。"}
            })

        # 登录成功：重置计数
        state["failed_attempts"] = 0
        state["locked_until"] = None
        failed_login_state[user.username] = state

        # 根据角色查找对应档案 ID
        student_profile_id: Optional[int] = None
        teacher_profile_id: Optional[int] = None
        if user.role == "student":
            sp = (
                session.query(StudentProfile)
                .filter(StudentProfile.user_id == user.id)
                .first()
            )
            if sp:
                student_profile_id = sp.id
        elif user.role == "teacher":
            tp = (
                session.query(TeacherProfile)
                .filter(TeacherProfile.user_id == user.id)
                .first()
            )
            if tp:
                teacher_profile_id = tp.id

        # 生成令牌并记录当前会话
        token = secrets.token_urlsafe(32)
        active_tokens[token] = CurrentUser(
            id=user.id,
            username=user.username,
            role=user.role,
            student_profile_id=student_profile_id,
            teacher_profile_id=teacher_profile_id,
        )

        return LoginResponse(
            token=token,
            user=LoginUserInfo(
                id=user.id,
                username=user.username,
                role=user.role,
                force_password_change=True,
            ),
        )
    finally:
        session.close()


# =====================
# 课程详情
# =====================

class TeacherDetailOut(BaseModel):
    id: int
    full_name: str
    title: Optional[str] = None
    class Config:
        orm_mode = True

class CourseDetailOut(BaseModel):
    id: int
    course_code: str
    course_name: str
    credits: float
    description: Optional[str]
    department: Optional[str]
    prerequisites: Optional[str]
    teachers: List[TeacherDetailOut]
    class Config:
        orm_mode = True

@app.get("/api/v1/courses/{id}", response_model=CourseDetailOut)
def get_course_detail(id: int):
    session = SessionLocal()
    try:
        course = (
            session.query(Course)
            .options(joinedload(Course.teaching_assignments).joinedload(TeachingAssignment.teacher))
            .filter(Course.is_deleted == 0, Course.id == id)
            .first()
        )
        if not course:
            raise HTTPException(status_code=404, detail={
                "error": {"code": "NOT_FOUND", "message": f"ID为 {id} 的课程未找到。"}
            })
        teachers: List[TeacherDetailOut] = []
        for ta in course.teaching_assignments:
            if ta.teacher and ta.is_deleted == 0:
                teachers.append(TeacherDetailOut(
                    id=ta.teacher.id,
                    full_name=ta.teacher.full_name,
                    title=ta.teacher.title
                ))
        return CourseDetailOut(
            id=course.id,
            course_code=course.course_code,
            course_name=course.course_name,
            credits=float(course.credits),
            description=course.description,
            department=course.department,
            prerequisites=course.prerequisites,
            teachers=teachers
        )
    finally:
        session.close()


# =====================
# 批量创建学生（骨架实现）
# =====================

@app.post("/api/v1/users/batch-create-students", status_code=status.HTTP_201_CREATED)
async def batch_create_students(file: UploadFile = File(...)):
    """从上传的 CSV 创建学生账号和档案，直接写入数据库。

    只支持 UTF-8 编码的 CSV，且至少包含
    student_id_number, full_name, class_name 三列。
    """

    raw = await file.read()
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="文件编码必须为 UTF-8")

    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if not lines:
        raise HTTPException(status_code=400, detail="上传文件内容为空")

    headers = [h.strip() for h in lines[0].split(",")]
    required = ["student_id_number", "full_name", "class_name"]
    if not all(col in headers for col in required):
        raise HTTPException(
            status_code=400,
            detail=f"文件缺少必要列: {', '.join(required)}",
        )

    idx = {name: headers.index(name) for name in headers}

    session = SessionLocal()
    summary = {"total": 0, "created": 0, "failed": 0, "existing": 0}
    details: List[Dict[str, Any]] = []
    try:
        for line in lines[1:]:
            if not line.strip():
                continue
            cols = [c.strip() for c in line.split(",")]
            # 跳过列数不足的行
            if len(cols) < len(headers):
                continue

            student_id_number = cols[idx["student_id_number"]]
            full_name = cols[idx["full_name"]]
            class_name = cols[idx["class_name"]]
            summary["total"] += 1

            if not student_id_number or not full_name or not class_name:
                summary["failed"] += 1
                details.append({
                    "student_id_number": student_id_number or "",
                    "status": "failed",
                    "message": "必填字段缺失"
                })
                continue

            # 已存在学生
            existing_student = (
                session.query(StudentProfile)
                .filter(StudentProfile.student_id_number == student_id_number)
                .first()
            )
            if existing_student:
                summary["existing"] += 1
                details.append({
                    "student_id_number": student_id_number,
                    "status": "existing",
                    "message": "学生档案已存在"
                })
                continue

            try:
                # 查找或创建班级
                cls = (
                    session.query(Class)
                    .filter(Class.class_name == class_name, Class.is_deleted == False)
                    .first()
                )
                if not cls:
                    cls = Class(class_name=class_name)
                    session.add(cls)
                    session.flush()

                # 创建用户
                username = student_id_number
                email = f"{student_id_number}@example.com"

                existing_user = (
                    session.query(User)
                    .filter(User.username == username, User.is_deleted == False)
                    .first()
                )
                if existing_user:
                    summary["failed"] += 1
                    details.append({
                        "student_id_number": student_id_number,
                        "status": "failed",
                        "message": "同名用户已存在"
                    })
                    continue

                # 使用固定规则生成初始密码哈希（真实项目应使用随机盐和安全策略）
                initial_password = "InitialPassword123"
                password_hash = hash_password(initial_password)

                user = User(
                    username=username,
                    password_hash=password_hash,
                    role="student",
                    email=email,
                    status="active",
                    is_deleted=False,
                )
                session.add(user)
                session.flush()

                student = StudentProfile(
                    user_id=user.id,
                    student_id_number=student_id_number,
                    full_name=full_name,
                    class_id=cls.id,
                )
                session.add(student)

                summary["created"] += 1
                details.append({
                    "student_id_number": student_id_number,
                    "status": "created",
                    "message": "创建成功",
                })
            except Exception as e:
                session.rollback()
                summary["failed"] += 1
                details.append({
                    "student_id_number": student_id_number,
                    "status": "failed",
                    "message": f"数据库错误: {str(e)}",
                })
            else:
                # 小批量处理场景，逐条 flush 即可，统一在循环结束后 commit
                pass

        session.commit()
    finally:
        session.close()

    return {"summary": summary, "details": details}


# =====================
# 忘记密码与重置密码（骨架实现）
# =====================

class ForgotPasswordRequest(BaseModel):
    email: str

@app.post("/api/v1/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    # 骨架：记录请求并返回提示；生产环境需生成并发送重置邮件
    return {"message": "如果邮箱地址存在，密码重置链接已发送至您的邮箱。"}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/api/v1/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    # 骨架：校验令牌并更新密码；生产环境需验证令牌有效性并进行安全更新
    return {"message": "密码已成功重置，您现在可以使用新密码登录。"}


# =====================
# 学生端：课程修读与成绩查询（骨架实现）
# =====================

# 添加选课
@app.post("/api/v1/enrollments", status_code=status.HTTP_201_CREATED)
def create_enrollment(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    """学生选课：在 Enrollments 表中创建记录。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以选课")

    course_id = payload.get("course_id")
    semester = payload.get("semester")
    if not course_id or not semester:
        raise HTTPException(status_code=400, detail="course_id 和 semester 为必填字段")

    session = SessionLocal()
    try:
        # 检查课程是否存在且未删除
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=400, detail="课程不存在或已被删除")

        # 检查学生是否存在
        student = session.query(StudentProfile).get(current_user.student_profile_id)
        if not student:
            raise HTTPException(status_code=400, detail="学生档案不存在，请联系管理员")

        # 是否已选过该课
        existing = (
            session.query(Enrollment)
            .filter(
                Enrollment.student_id == student.id,
                Enrollment.course_id == course_id,
                Enrollment.semester == semester,
                Enrollment.is_deleted == False,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="已选修此课程，无需重复选课")

        enrollment = Enrollment(
            student_id=student.id,
            course_id=course.id,
            semester=semester,
            enrollment_date=datetime.utcnow(),
            is_deleted=False,
        )
        session.add(enrollment)
        session.commit()
        session.refresh(enrollment)

        return {
            "id": enrollment.id,
            "student_id": enrollment.student_id,
            "course_id": enrollment.course_id,
            "semester": enrollment.semester,
            "enrollment_date": enrollment.enrollment_date.isoformat() + "Z",
        }
    finally:
        session.close()

@app.delete("/api/v1/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(enrollment_id: int, current_user: CurrentUser = Depends(get_current_user)):
    """学生退选课程：将选课记录标记为删除。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以退选课程")

    session = SessionLocal()
    try:
        enrollment = session.query(Enrollment).get(enrollment_id)
        if not enrollment or enrollment.is_deleted:
            return

        # 简化权限校验：只允许当前学生退选自己的课程
        if enrollment.student_id != current_user.student_profile_id:
            raise HTTPException(status_code=403, detail="无权退选该课程")

        enrollment.is_deleted = True
        session.commit()
        return
    finally:
        session.close()

@app.delete("/api/v1/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(enrollment_id: int):
    """学生退选课程（骨架实现）。

    实际项目中应根据当前登录学生和 enrollment_id
    去数据库中删除/标记删除这条选课记录，并进行权限校验。
    这里作为演示仅返回 204 No Content。
    """
    return

# 取消选课
@app.post("/api/v1/withdraw", status_code=status.HTTP_201_CREATED)
def remove_enrollment(payload: Dict[str, Any]):
    # 期望字段：course_id, semester
    return {
        "id": 55,
        "student_id": 10,
        "course_id": payload.get("course_id", 101),
        "semester": payload.get("semester", "2025-2026-1"),
        "enrollment_date": "2025-09-01T10:00:00Z"
    } 

# 查看选课列表
@app.get("/api/v1/me/enrollments")
def list_my_enrollments(semester: Optional[str] = None, current_user: CurrentUser = Depends(get_current_user)):
    """查看当前学生已选课程列表。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以查看自己的选课列表")

    session = SessionLocal()
    try:
        q = (
            session.query(Enrollment)
            .options(joinedload(Enrollment.course).joinedload(Course.teaching_assignments).joinedload(TeachingAssignment.teacher))
            .filter(
                Enrollment.student_id == current_user.student_profile_id,
                Enrollment.is_deleted == False,
            )
        )
        if semester:
            q = q.filter(Enrollment.semester == semester)

        enrollments = q.all()
        results = []
        for e in enrollments:
            course = e.course
            teachers = []
            for ta in course.teaching_assignments:
                if ta.teacher and ta.is_deleted == 0:
                    teachers.append({"id": ta.teacher.id, "full_name": ta.teacher.full_name})

            results.append(
                {
                    "enrollment_id": e.id,
                    "semester": e.semester,
                    "course": {
                        "id": course.id,
                        "course_code": course.course_code,
                        "course_name": course.course_name,
                        "credits": float(course.credits),
                        "teachers": teachers,
                    },
                }
            )

        return results
    finally:
        session.close()

@app.get("/api/v1/me/enrollments/{enrollment_id}/tasks")
def list_enrollment_tasks(
    enrollment_id: int,
    status: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """查看某门已选课程下的学习任务完成情况。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以查看自己的学习任务")

    session = SessionLocal()
    try:
        # 简单身份校验：确保该选课记录属于当前学生
        enrollment = session.query(Enrollment).get(enrollment_id)
        if not enrollment or enrollment.is_deleted:
            raise HTTPException(status_code=404, detail="选课记录不存在")
        if enrollment.student_id != current_user.student_profile_id:
            raise HTTPException(status_code=403, detail="无权查看该选课记录")

        q = (
            session.query(TaskProgress)
            .options(joinedload(TaskProgress.material))
            .filter(TaskProgress.enrollment_id == enrollment_id)
        )
        if status:
            q = q.filter(TaskProgress.status == status)

        tasks = q.all()
        results = []
        for t in tasks:
            material = t.material
            results.append(
                {
                    "task_progress_id": t.id,
                    "status": t.status,
                    "material": {
                        "id": material.id,
                        "material_type": material.material_type,
                        "title": material.title,
                    },
                }
            )

        return results
    finally:
        session.close()

@app.get("/api/v1/me/grades/summary")
def get_grades_summary(semester: Optional[str] = None, current_user: CurrentUser = Depends(get_current_user)):
    """按学期汇总学生成绩和学分绩点。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以查看自己的成绩汇总")

    session = SessionLocal()

    def score_to_gpa(score: float) -> float:
        if score >= 90:
            return 4.0
        if score >= 85:
            return 3.7
        if score >= 80:
            return 3.3
        if score >= 75:
            return 3.0
        if score >= 70:
            return 2.7
        if score >= 65:
            return 2.3
        if score >= 60:
            return 2.0
        return 0.0

    try:
        # 找到当前学生的所有选课记录
        enroll_q = session.query(Enrollment).filter(
            Enrollment.student_id == current_user.student_profile_id,
            Enrollment.is_deleted == False,
        )
        if semester:
            enroll_q = enroll_q.filter(Enrollment.semester == semester)

        enrollments = enroll_q.all()
        result: Dict[str, Any] = {}

        for e in enrollments:
            sem = e.semester
            if sem not in result:
                result[sem] = {"courses": [], "semester_gpa": 0.0, "total_credits": 0.0}

            # 计算该课程的总评成绩
            grades = (
                session.query(Grade, GradeItem)
                .join(GradeItem, Grade.grade_item_id == GradeItem.id)
                .filter(
                    Grade.enrollment_id == e.id,
                    Grade.is_deleted == False,
                    GradeItem.is_deleted == False,
                )
                .all()
            )
            total_score = 0.0
            for g, gi in grades:
                if g.score is not None:
                    total_score += float(g.score) * float(gi.weight)

            course = session.query(Course).get(e.course_id)
            if not course:
                continue

            gpa = score_to_gpa(total_score)
            result[sem]["courses"].append(
                {
                    "enrollment_id": e.id,
                    "course_name": course.course_name,
                    "credits": float(course.credits),
                    "final_score": round(total_score, 1),
                    "gpa": gpa,
                }
            )
            result[sem]["total_credits"] += float(course.credits)

        # 计算每学期的 GPA（学分加权）
        for sem, info in result.items():
            total_points = 0.0
            for c in info["courses"]:
                total_points += c["gpa"] * c["credits"]
            if info["total_credits"] > 0:
                info["semester_gpa"] = round(total_points / info["total_credits"], 2)

        return result
    finally:
        session.close()

@app.get("/api/v1/me/enrollments/{enrollment_id}/grades")
def get_enrollment_grades(enrollment_id: int, current_user: CurrentUser = Depends(get_current_user)):
    """获取某门课程的详细成绩构成。"""

    if current_user.role != "student" or current_user.student_profile_id is None:
        raise HTTPException(status_code=403, detail="仅学生可以查看自己的课程成绩")

    session = SessionLocal()
    try:
        enrollment = session.query(Enrollment).get(enrollment_id)
        if not enrollment or enrollment.is_deleted:
            raise HTTPException(status_code=404, detail="选课记录不存在")
        if enrollment.student_id != current_user.student_profile_id:
            raise HTTPException(status_code=403, detail="无权查看该选课记录")

        course = session.query(Course).get(enrollment.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="课程不存在")

        rows = (
            session.query(Grade, GradeItem)
            .join(GradeItem, Grade.grade_item_id == GradeItem.id)
            .filter(
                Grade.enrollment_id == enrollment_id,
                Grade.is_deleted == False,
                GradeItem.is_deleted == False,
            )
            .all()
        )

        grade_items = []
        final_score = 0.0
        for g, gi in rows:
            score_val = float(g.score) if g.score is not None else None
            if score_val is not None:
                final_score += score_val * float(gi.weight)
            grade_items.append(
                {
                    "item_name": gi.item_name,
                    "weight": float(gi.weight),
                    "score": score_val,
                }
            )

        return {
            "course_name": course.course_name,
            "final_score": round(final_score, 1),
            "grade_items": grade_items,
        }
    finally:
        session.close()


# =====================
# 教师端：课程与成绩管理（接入数据库实现）
# =====================

@app.get("/api/v1/me/teaching-assignments")
def list_my_teaching_assignments(
    semester: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """获取当前登录教师的授课列表。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以查看授课列表")

    session = SessionLocal()
    try:
        q = (
            session.query(TeachingAssignment)
            .options(joinedload(TeachingAssignment.course))
            .filter(
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
        )
        if semester:
            q = q.filter(TeachingAssignment.semester == semester)

        assignments = q.all()
        results = []
        for ta in assignments:
            course = ta.course
            if not course or course.is_deleted:
                continue
            results.append(
                {
                    "teaching_assignment_id": ta.id,
                    "semester": ta.semester,
                    "course": {
                        "id": course.id,
                        "course_code": course.course_code,
                        "course_name": course.course_name,
                    },
                }
            )
        return results
    finally:
        session.close()


@app.post("/api/v1/courses/{course_id}/materials", status_code=status.HTTP_201_CREATED)
async def upload_course_materials(
    course_id: int,
    material_type: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    display_order: Optional[int] = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """为课程上传资料并写入 CourseMaterials 表。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以上传课程资料")

    session = SessionLocal()
    try:
        # 校验课程和授课关系
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=404, detail="课程不存在")

        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以上传本课程资料")

        # 保存文件到本地 uploads 目录
        base_dir = os.path.dirname(__file__)
        dest_dir = os.path.join(base_dir, "uploads", "courses", str(course_id), "materials")
        os.makedirs(dest_dir, exist_ok=True)

        file_bytes = await file.read()
        filename = file.filename or "uploaded_file"
        dest_path = os.path.join(dest_dir, filename)
        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        # 相对路径用于前端访问
        rel_path = f"/uploads/courses/{course_id}/materials/{filename}"

        material = CourseMaterial(
            course_id=course_id,
            material_type=material_type,
            title=title,
            file_path_or_content=rel_path,
            display_order=display_order or 0,
            uploaded_by=current_user.id,
            is_deleted=False,
        )
        session.add(material)
        session.commit()
        session.refresh(material)

        return {
            "id": material.id,
            "course_id": material.course_id,
            "material_type": material.material_type,
            "title": material.title,
            "file_path_or_content": material.file_path_or_content,
            "display_order": material.display_order,
            "uploaded_by": material.uploaded_by,
        }
    finally:
        session.close()


@app.patch("/api/v1/courses/{course_id}/config")
def update_course_config(
    course_id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    """更新课程简介和配置（存储在 CourseMaterials 中的 config 记录）。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以更新课程配置")

    session = SessionLocal()
    try:
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=404, detail="课程不存在")

        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以配置本课程")

        description = payload.get("description")
        if description is not None:
            course.description = description

        # 课程配置以 JSON 形式保存在 material_type = 'config' 的记录中
        cfg = (
            session.query(CourseMaterial)
            .filter(
                CourseMaterial.course_id == course_id,
                CourseMaterial.material_type == "config",
                CourseMaterial.is_deleted == False,
            )
            .first()
        )
        if not cfg:
            cfg = CourseMaterial(
                course_id=course_id,
                material_type="config",
                title="config",
                file_path_or_content="{}",
                display_order=0,
                uploaded_by=current_user.id,
                is_deleted=False,
            )
            session.add(cfg)

        try:
            current_config = json.loads(cfg.file_path_or_content or "{}")
        except Exception:
            current_config = {}

        for key in ["allow_comments", "allow_notes"]:
            if key in payload:
                current_config[key] = payload[key]

        cfg.file_path_or_content = json.dumps(current_config, ensure_ascii=False)
        session.commit()
        session.refresh(course)

        return {
            "course_id": course.id,
            "description": course.description,
            "config": current_config,
        }
    finally:
        session.close()


@app.post("/api/v1/courses/{course_id}/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(
    course_id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    """创建作业/考试记录。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以布置作业")

    session = SessionLocal()
    try:
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=404, detail="课程不存在")

        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以布置本课程作业")

        title = payload.get("title")
        if not title:
            raise HTTPException(status_code=400, detail="title 为必填字段")

        type_val = payload.get("type")
        if type_val not in {"assignment", "exam"}:
            raise HTTPException(status_code=400, detail="type 必须为 'assignment' 或 'exam'")

        deadline_str = payload.get("deadline")
        deadline_dt = parse_iso_datetime(deadline_str) if deadline_str else None

        assignment = Assignment(
            course_id=course_id,
            title=title,
            description=payload.get("description"),
            file_path=payload.get("file_path"),
            deadline=deadline_dt,
            type=type_val,
            is_deleted=False,
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)

        return {
            "id": assignment.id,
            "course_id": assignment.course_id,
            "title": assignment.title,
            "type": assignment.type,
            "deadline": assignment.deadline.isoformat() + "Z" if assignment.deadline else None,
        }
    finally:
        session.close()


@app.get("/api/v1/assignments/{assignment_id}/submissions")
def list_submissions(
    assignment_id: int,
    current_user: CurrentUser = Depends(get_current_user),
):
    """查看某个作业/考试的学生提交情况。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以查看提交情况")

    session = SessionLocal()
    try:
        assignment = session.query(Assignment).get(assignment_id)
        if not assignment or assignment.is_deleted:
            raise HTTPException(status_code=404, detail="作业/考试不存在")

        # 权限：必须是本课程授课教师
        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == assignment.course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以查看提交情况")

        submissions = (
            session.query(AssignmentSubmission)
            .options(joinedload(AssignmentSubmission.student))
            .filter(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.is_deleted == False,
            )
            .all()
        )

        results = []
        for sub in submissions:
            status_val = "graded" if sub.score is not None else "pending"
            results.append(
                {
                    "submission_id": sub.id,
                    "student": {
                        "id": sub.student.id if sub.student else None,
                        "full_name": sub.student.full_name if sub.student else None,
                    },
                    "submitted_at": sub.submitted_at.isoformat() + "Z" if sub.submitted_at else None,
                    "status": status_val,
                    "score": float(sub.score) if sub.score is not None else None,
                }
            )

        return results
    finally:
        session.close()


@app.post("/api/v1/courses/{course_id}/grade-items", status_code=status.HTTP_201_CREATED)
def create_grade_item(
    course_id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    """为课程创建成绩构成项，并校验权重不超过 1。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以设置成绩项")

    session = SessionLocal()
    try:
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=404, detail="课程不存在")

        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以设置本课程成绩项")

        item_name = payload.get("item_name")
        weight = payload.get("weight")
        if item_name is None or weight is None:
            raise HTTPException(status_code=400, detail="item_name 和 weight 为必填字段")

        try:
            weight_val = float(weight)
        except ValueError:
            raise HTTPException(status_code=400, detail="weight 必须为数字")

        # 现有权重之和
        existing_items = (
            session.query(GradeItem)
            .filter(
                GradeItem.course_id == course_id,
                GradeItem.is_deleted == False,
            )
            .all()
        )
        total_weight = sum(float(it.weight) for it in existing_items) + weight_val
        if total_weight > 1.0 + 1e-6:
            raise HTTPException(status_code=400, detail="所有成绩项权重之和超过 1")

        gi = GradeItem(
            course_id=course_id,
            item_name=item_name,
            weight=weight_val,
            description=payload.get("description"),
            is_deleted=False,
        )
        session.add(gi)
        session.commit()
        session.refresh(gi)

        return {
            "id": gi.id,
            "course_id": gi.course_id,
            "item_name": gi.item_name,
            "weight": float(gi.weight),
        }
    finally:
        session.close()


@app.put("/api/v1/grades/{grade_id}")
def update_grade(
    grade_id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    """录入或修改单个成绩。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以录入成绩")

    session = SessionLocal()
    try:
        grade = session.query(Grade).get(grade_id)
        if not grade or grade.is_deleted:
            raise HTTPException(status_code=404, detail="成绩记录不存在")

        # 权限：成绩所属课程必须是当前教师授课
        enrollment = grade.enrollment
        if not enrollment or enrollment.is_deleted:
            raise HTTPException(status_code=404, detail="选课记录不存在")

        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == enrollment.course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以录入本课程成绩")

        if "score" not in payload:
            raise HTTPException(status_code=400, detail="score 为必填字段")

        try:
            score_val = float(payload["score"])
        except ValueError:
            raise HTTPException(status_code=400, detail="score 必须为数字")

        grade.score = score_val
        grade.status = "graded"
        grade.graded_at = datetime.utcnow()
        grade.grader_id = current_user.id
        session.commit()
        session.refresh(grade)

        return {
            "id": grade.id,
            "enrollment_id": grade.enrollment_id,
            "grade_item_id": grade.grade_item_id,
            "score": float(grade.score) if grade.score is not None else None,
            "status": grade.status,
        }
    finally:
        session.close()


@app.post("/api/v1/grade-items/{item_id}/grades/batch-upload")
async def batch_upload_grades(
    item_id: int,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
):
    """批量导入某个成绩项的成绩（CSV，包含 student_id_number, score 列）。"""

    if current_user.role != "teacher" or current_user.teacher_profile_id is None:
        raise HTTPException(status_code=403, detail="仅教师可以批量导入成绩")

    raw = await file.read()
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="文件编码必须为 UTF-8")

    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if not lines:
        raise HTTPException(status_code=400, detail="上传文件内容为空")

    headers = [h.strip() for h in lines[0].split(",")]
    required = ["student_id_number", "score"]
    if not all(col in headers for col in required):
        raise HTTPException(
            status_code=400,
            detail=f"文件缺少必要列: {', '.join(required)}",
        )

    idx = {name: headers.index(name) for name in headers}

    session = SessionLocal()
    summary = {"total": 0, "updated": 0, "failed": 0}
    details: List[Dict[str, Any]] = []
    try:
        grade_item = (
            session.query(GradeItem)
            .filter(GradeItem.id == item_id, GradeItem.is_deleted == False)
            .first()
        )
        if not grade_item:
            raise HTTPException(status_code=404, detail="成绩项不存在")

        # 权限：必须是该课程授课教师
        ta = (
            session.query(TeachingAssignment)
            .filter(
                TeachingAssignment.course_id == grade_item.course_id,
                TeachingAssignment.teacher_id == current_user.teacher_profile_id,
                TeachingAssignment.is_deleted == 0,
            )
            .first()
        )
        if not ta:
            raise HTTPException(status_code=403, detail="仅授课教师可以导入本课程成绩")

        for line in lines[1:]:
            if not line.strip():
                continue
            cols = [c.strip() for c in line.split(",")]
            if len(cols) < len(headers):
                continue

            student_id_number = cols[idx["student_id_number"]]
            score_raw = cols[idx["score"]]
            summary["total"] += 1

            if not student_id_number or not score_raw:
                summary["failed"] += 1
                details.append(
                    {
                        "student_id_number": student_id_number or "",
                        "status": "failed",
                        "message": "必填字段缺失",
                    }
                )
                continue

            try:
                score_val = float(score_raw)
            except ValueError:
                summary["failed"] += 1
                details.append(
                    {
                        "student_id_number": student_id_number,
                        "status": "failed",
                        "message": "成绩不是有效数字",
                    }
                )
                continue

            student = (
                session.query(StudentProfile)
                .filter(StudentProfile.student_id_number == student_id_number)
                .first()
            )
            if not student:
                summary["failed"] += 1
                details.append(
                    {
                        "student_id_number": student_id_number,
                        "status": "failed",
                        "message": "学生不存在",
                    }
                )
                continue

            enrollment = (
                session.query(Enrollment)
                .filter(
                    Enrollment.student_id == student.id,
                    Enrollment.course_id == grade_item.course_id,
                    Enrollment.is_deleted == False,
                )
                .first()
            )
            if not enrollment:
                summary["failed"] += 1
                details.append(
                    {
                        "student_id_number": student_id_number,
                        "status": "failed",
                        "message": "学生未选修该课程",
                    }
                )
                continue

            grade = (
                session.query(Grade)
                .filter(
                    Grade.enrollment_id == enrollment.id,
                    Grade.grade_item_id == item_id,
                    Grade.is_deleted == False,
                )
                .first()
            )
            if not grade:
                grade = Grade(
                    enrollment_id=enrollment.id,
                    grade_item_id=item_id,
                    is_deleted=False,
                )
                session.add(grade)

            grade.score = score_val
            grade.status = "graded"
            grade.graded_at = datetime.utcnow()
            grade.grader_id = current_user.id
            summary["updated"] += 1

        session.commit()
    finally:
        session.close()

    return {"summary": summary, "details": details}


# =====================
# 教学管理端（接入数据库实现）
# =====================


def _require_edu_admin(current_user: CurrentUser):
    if current_user.role != "edu_admin":
        raise HTTPException(status_code=403, detail="仅教学管理员可以执行此操作")


# 班级 CRUD
@app.post("/api/v1/classes", status_code=status.HTTP_201_CREATED)
def create_class(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)

    class_name = payload.get("class_name")
    if not class_name:
        raise HTTPException(status_code=400, detail="class_name 为必填字段")

    session = SessionLocal()
    try:
        existing = (
            session.query(Class)
            .filter(Class.class_name == class_name, Class.is_deleted == False)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="班级名称已存在")

        cls = Class(
            class_name=class_name,
            department=payload.get("department"),
            enrollment_year=payload.get("enrollment_year"),
            is_deleted=False,
        )
        session.add(cls)
        session.commit()
        session.refresh(cls)
        return {
            "id": cls.id,
            "class_name": cls.class_name,
            "department": cls.department,
            "enrollment_year": cls.enrollment_year,
        }
    finally:
        session.close()


@app.get("/api/v1/classes")
def list_classes(
    page: int = 1,
    pageSize: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)

    session = SessionLocal()
    try:
        q = session.query(Class).filter(Class.is_deleted == False)
        total_items = q.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        items = (
            q.order_by(Class.id)
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .all()
        )
        data = [
            {
                "id": c.id,
                "class_name": c.class_name,
                "department": c.department,
                "enrollment_year": c.enrollment_year,
            }
            for c in items
        ]
        return {
            "pagination": {
                "totalItems": total_items,
                "totalPages": total_pages,
                "currentPage": page,
                "pageSize": pageSize,
            },
            "items": data,
        }
    finally:
        session.close()


@app.get("/api/v1/classes/{id}")
def get_class(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        cls = session.query(Class).get(id)
        if not cls or cls.is_deleted:
            raise HTTPException(status_code=404, detail="班级不存在")
        return {
            "id": cls.id,
            "class_name": cls.class_name,
            "department": cls.department,
            "enrollment_year": cls.enrollment_year,
        }
    finally:
        session.close()


@app.put("/api/v1/classes/{id}")
def update_class(
    id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        cls = session.query(Class).get(id)
        if not cls or cls.is_deleted:
            raise HTTPException(status_code=404, detail="班级不存在")

        if "class_name" in payload and payload["class_name"] != cls.class_name:
            existing = (
                session.query(Class)
                .filter(
                    Class.class_name == payload["class_name"],
                    Class.is_deleted == False,
                )
                .first()
            )
            if existing:
                raise HTTPException(status_code=400, detail="班级名称已存在")
            cls.class_name = payload["class_name"]

        if "department" in payload:
            cls.department = payload["department"]
        if "enrollment_year" in payload:
            cls.enrollment_year = payload["enrollment_year"]

        session.commit()
        session.refresh(cls)
        return {
            "id": cls.id,
            "class_name": cls.class_name,
            "department": cls.department,
            "enrollment_year": cls.enrollment_year,
        }
    finally:
        session.close()


@app.delete("/api/v1/classes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        cls = session.query(Class).get(id)
        if not cls or cls.is_deleted:
            return
        cls.is_deleted = True
        session.commit()
        return
    finally:
        session.close()


# 学生 CRUD
@app.post("/api/v1/students", status_code=status.HTTP_201_CREATED)
def create_student(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)

    username = payload.get("username")
    full_name = payload.get("full_name")
    email = payload.get("email")
    class_id = payload.get("class_id")
    if not all([username, full_name, email, class_id]):
        raise HTTPException(status_code=400, detail="username, full_name, email, class_id 为必填字段")

    session = SessionLocal()
    try:
        if (
            session.query(User)
            .filter(User.username == username, User.is_deleted == False)
            .first()
        ):
            raise HTTPException(status_code=400, detail="用户名已存在")

        if (
            session.query(User)
            .filter(User.email == email, User.is_deleted == False)
            .first()
        ):
            raise HTTPException(status_code=400, detail="邮箱已存在")

        cls = session.query(Class).get(class_id)
        if not cls or cls.is_deleted:
            raise HTTPException(status_code=400, detail="班级不存在")

        user = User(
            username=username,
            password_hash=hash_password("InitialPassword123"),
            role="student",
            email=email,
            status="active",
            is_deleted=False,
        )
        session.add(user)
        session.flush()

        student = StudentProfile(
            user_id=user.id,
            student_id_number=username,
            full_name=full_name,
            class_id=class_id,
        )
        session.add(student)
        session.commit()
        session.refresh(student)

        return {
            "id": student.id,
            "username": username,
            "full_name": full_name,
            "email": email,
            "class_id": class_id,
        }
    finally:
        session.close()


@app.get("/api/v1/students")
def list_students(
    page: int = 1,
    pageSize: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        q = (
            session.query(StudentProfile, User)
            .join(User, StudentProfile.user_id == User.id)
            .filter(User.is_deleted == False)
        )
        total_items = q.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        rows = (
            q.order_by(StudentProfile.id)
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .all()
        )

        items = [
            {
                "id": sp.id,
                "username": u.username,
                "full_name": sp.full_name,
                "email": u.email,
                "class_id": sp.class_id,
            }
            for sp, u in rows
        ]
        return {
            "pagination": {
                "totalItems": total_items,
                "totalPages": total_pages,
                "currentPage": page,
                "pageSize": pageSize,
            },
            "items": items,
        }
    finally:
        session.close()


@app.get("/api/v1/students/{id}")
def get_student(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        sp = session.query(StudentProfile).get(id)
        if not sp:
            raise HTTPException(status_code=404, detail="学生不存在")
        user = session.query(User).get(sp.user_id)
        if not user or user.is_deleted:
            raise HTTPException(status_code=404, detail="关联用户不存在")
        return {
            "id": sp.id,
            "username": user.username,
            "full_name": sp.full_name,
            "email": user.email,
            "class_id": sp.class_id,
        }
    finally:
        session.close()


@app.put("/api/v1/students/{id}")
def update_student(
    id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        sp = session.query(StudentProfile).get(id)
        if not sp:
            raise HTTPException(status_code=404, detail="学生不存在")
        user = session.query(User).get(sp.user_id)
        if not user or user.is_deleted:
            raise HTTPException(status_code=404, detail="关联用户不存在")

        if "username" in payload and payload["username"] != user.username:
            if (
                session.query(User)
                .filter(User.username == payload["username"], User.is_deleted == False)
                .first()
            ):
                raise HTTPException(status_code=400, detail="用户名已存在")
            user.username = payload["username"]
            sp.student_id_number = payload["username"]

        if "email" in payload and payload["email"] != user.email:
            if (
                session.query(User)
                .filter(User.email == payload["email"], User.is_deleted == False)
                .first()
            ):
                raise HTTPException(status_code=400, detail="邮箱已存在")
            user.email = payload["email"]

        if "full_name" in payload:
            sp.full_name = payload["full_name"]
        if "class_id" in payload:
            cls = session.query(Class).get(payload["class_id"])
            if not cls or cls.is_deleted:
                raise HTTPException(status_code=400, detail="班级不存在")
            sp.class_id = payload["class_id"]

        session.commit()
        return {
            "id": sp.id,
            "username": user.username,
            "full_name": sp.full_name,
            "email": user.email,
            "class_id": sp.class_id,
        }
    finally:
        session.close()


@app.delete("/api/v1/students/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        sp = session.query(StudentProfile).get(id)
        if not sp:
            return
        user = session.query(User).get(sp.user_id)
        if user and not user.is_deleted:
            user.is_deleted = True
        session.commit()
        return
    finally:
        session.close()


# 教师 CRUD
@app.post("/api/v1/teachers", status_code=status.HTTP_201_CREATED)
def create_teacher(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)

    username = payload.get("username")
    full_name = payload.get("full_name")
    email = payload.get("email")
    title = payload.get("title")
    if not all([username, full_name, email]):
        raise HTTPException(status_code=400, detail="username, full_name, email 为必填字段")

    session = SessionLocal()
    try:
        if (
            session.query(User)
            .filter(User.username == username, User.is_deleted == False)
            .first()
        ):
            raise HTTPException(status_code=400, detail="用户名已存在")
        if (
            session.query(User)
            .filter(User.email == email, User.is_deleted == False)
            .first()
        ):
            raise HTTPException(status_code=400, detail="邮箱已存在")

        user = User(
            username=username,
            password_hash=hash_password("InitialPassword123"),
            role="teacher",
            email=email,
            status="active",
            is_deleted=False,
        )
        session.add(user)
        session.flush()

        tp = TeacherProfile(
            user_id=user.id,
            teacher_id_number=username,
            full_name=full_name,
            title=title,
        )
        session.add(tp)
        session.commit()
        session.refresh(tp)

        return {"id": tp.id, "full_name": tp.full_name, "title": tp.title}
    finally:
        session.close()


@app.get("/api/v1/teachers")
def list_teachers(
    page: int = 1,
    pageSize: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        q = (
            session.query(TeacherProfile, User)
            .join(User, TeacherProfile.user_id == User.id)
            .filter(User.is_deleted == False)
        )
        total_items = q.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        rows = (
            q.order_by(TeacherProfile.id)
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .all()
        )

        items = [
            {"id": tp.id, "full_name": tp.full_name, "title": tp.title}
            for tp, _ in rows
        ]
        return {
            "pagination": {
                "totalItems": total_items,
                "totalPages": total_pages,
                "currentPage": page,
                "pageSize": pageSize,
            },
            "items": items,
        }
    finally:
        session.close()


@app.get("/api/v1/teachers/{id}")
def get_teacher(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        tp = session.query(TeacherProfile).get(id)
        if not tp:
            raise HTTPException(status_code=404, detail="教师不存在")
        user = session.query(User).get(tp.user_id)
        if not user or user.is_deleted:
            raise HTTPException(status_code=404, detail="关联用户不存在")
        return {"id": tp.id, "full_name": tp.full_name, "title": tp.title}
    finally:
        session.close()


@app.put("/api/v1/teachers/{id}")
def update_teacher(
    id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        tp = session.query(TeacherProfile).get(id)
        if not tp:
            raise HTTPException(status_code=404, detail="教师不存在")
        user = session.query(User).get(tp.user_id)
        if not user or user.is_deleted:
            raise HTTPException(status_code=404, detail="关联用户不存在")

        if "username" in payload and payload["username"] != user.username:
            if (
                session.query(User)
                .filter(User.username == payload["username"], User.is_deleted == False)
                .first()
            ):
                raise HTTPException(status_code=400, detail="用户名已存在")
            user.username = payload["username"]
            tp.teacher_id_number = payload["username"]

        if "email" in payload and payload["email"] != user.email:
            if (
                session.query(User)
                .filter(User.email == payload["email"], User.is_deleted == False)
                .first()
            ):
                raise HTTPException(status_code=400, detail="邮箱已存在")
            user.email = payload["email"]

        if "full_name" in payload:
            tp.full_name = payload["full_name"]
        if "title" in payload:
            tp.title = payload["title"]

        session.commit()
        return {"id": tp.id, "full_name": tp.full_name, "title": tp.title}
    finally:
        session.close()


@app.delete("/api/v1/teachers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        tp = session.query(TeacherProfile).get(id)
        if not tp:
            return
        user = session.query(User).get(tp.user_id)
        if user and not user.is_deleted:
            user.is_deleted = True
        session.commit()
        return
    finally:
        session.close()


# 课程 CRUD（创建/更新/删除）
@app.post("/api/v1/courses", status_code=status.HTTP_201_CREATED)
def admin_create_course(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)

    course_code = payload.get("course_code")
    course_name = payload.get("course_name")
    credits = payload.get("credits")
    if not all([course_code, course_name, credits is not None]):
        raise HTTPException(status_code=400, detail="course_code, course_name, credits 为必填字段")

    session = SessionLocal()
    try:
        if (
            session.query(Course)
            .filter(Course.course_code == course_code, Course.is_deleted == 0)
            .first()
        ):
            raise HTTPException(status_code=400, detail="课程编号已存在")

        c = Course(
            course_code=course_code,
            course_name=course_name,
            credits=credits,
            description=payload.get("description"),
            department=payload.get("department"),
            prerequisites=payload.get("prerequisites"),
            is_deleted=0,
        )
        session.add(c)
        session.commit()
        session.refresh(c)
        return {
            "id": c.id,
            "course_code": c.course_code,
            "course_name": c.course_name,
            "credits": float(c.credits),
            "description": c.description,
            "department": c.department,
        }
    finally:
        session.close()


@app.put("/api/v1/courses/{id}")
def admin_update_course(
    id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        c = session.query(Course).get(id)
        if not c or c.is_deleted:
            raise HTTPException(status_code=404, detail="课程不存在")

        if "course_code" in payload and payload["course_code"] != c.course_code:
            if (
                session.query(Course)
                .filter(Course.course_code == payload["course_code"], Course.is_deleted == 0)
                .first()
            ):
                raise HTTPException(status_code=400, detail="课程编号已存在")
            c.course_code = payload["course_code"]

        for key in ["course_name", "credits", "description", "department", "prerequisites"]:
            if key in payload:
                setattr(c, key, payload[key])

        session.commit()
        session.refresh(c)
        return {
            "id": c.id,
            "course_code": c.course_code,
            "course_name": c.course_name,
            "credits": float(c.credits),
            "description": c.description,
            "department": c.department,
        }
    finally:
        session.close()


@app.delete("/api/v1/courses/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_course(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        c = session.query(Course).get(id)
        if not c or c.is_deleted:
            return
        c.is_deleted = 1
        session.commit()
        return
    finally:
        session.close()


# 教室 CRUD
@app.post("/api/v1/classrooms", status_code=status.HTTP_201_CREATED)
def create_classroom(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)

    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name 为必填字段")

    session = SessionLocal()
    try:
        if session.query(Classroom).filter(Classroom.name == name).first():
            raise HTTPException(status_code=400, detail="教室名称已存在")

        room = Classroom(
            name=name,
            location=payload.get("location"),
            capacity=payload.get("capacity"),
        )
        session.add(room)
        session.commit()
        session.refresh(room)
        return {
            "id": room.id,
            "name": room.name,
            "location": room.location,
            "capacity": room.capacity,
        }
    finally:
        session.close()


@app.get("/api/v1/classrooms")
def list_classrooms(
    page: int = 1,
    pageSize: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        q = session.query(Classroom)
        total_items = q.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        rooms = (
            q.order_by(Classroom.id)
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .all()
        )

        items = [
            {
                "id": r.id,
                "name": r.name,
                "location": r.location,
                "capacity": r.capacity,
            }
            for r in rooms
        ]
        return {
            "pagination": {
                "totalItems": total_items,
                "totalPages": total_pages,
                "currentPage": page,
                "pageSize": pageSize,
            },
            "items": items,
        }
    finally:
        session.close()


@app.get("/api/v1/classrooms/{id}")
def get_classroom(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        room = session.query(Classroom).get(id)
        if not room:
            raise HTTPException(status_code=404, detail="教室不存在")
        return {
            "id": room.id,
            "name": room.name,
            "location": room.location,
            "capacity": room.capacity,
        }
    finally:
        session.close()


@app.put("/api/v1/classrooms/{id}")
def update_classroom(
    id: int,
    payload: Dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        room = session.query(Classroom).get(id)
        if not room:
            raise HTTPException(status_code=404, detail="教室不存在")

        if "name" in payload and payload["name"] != room.name:
            if session.query(Classroom).filter(Classroom.name == payload["name"]).first():
                raise HTTPException(status_code=400, detail="教室名称已存在")
            room.name = payload["name"]

        if "location" in payload:
            room.location = payload["location"]
        if "capacity" in payload:
            room.capacity = payload["capacity"]

        session.commit()
        return {
            "id": room.id,
            "name": room.name,
            "location": room.location,
            "capacity": room.capacity,
        }
    finally:
        session.close()


@app.delete("/api/v1/classrooms/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(id: int, current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        room = session.query(Classroom).get(id)
        if not room:
            return
        session.delete(room)
        session.commit()
        return
    finally:
        session.close()


# 学期教学安排
@app.post("/api/v1/teaching-assignments", status_code=status.HTTP_201_CREATED)
def create_teaching_assignment(
    payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)
):
    _require_edu_admin(current_user)

    teacher_id = payload.get("teacher_id")
    course_id = payload.get("course_id")
    semester = payload.get("semester")
    if not all([teacher_id, course_id, semester]):
        raise HTTPException(status_code=400, detail="teacher_id, course_id, semester 为必填字段")

    session = SessionLocal()
    try:
        tp = session.query(TeacherProfile).get(teacher_id)
        if not tp:
            raise HTTPException(status_code=400, detail="教师不存在")
        course = (
            session.query(Course)
            .filter(Course.id == course_id, Course.is_deleted == 0)
            .first()
        )
        if not course:
            raise HTTPException(status_code=400, detail="课程不存在")

        ta = TeachingAssignment(
            teacher_id=teacher_id,
            course_id=course_id,
            semester=semester,
            is_deleted=0,
        )
        session.add(ta)
        session.commit()
        session.refresh(ta)
        return {
            "id": ta.id,
            "teacher_id": ta.teacher_id,
            "course_id": ta.course_id,
            "semester": ta.semester,
        }
    finally:
        session.close()


@app.post("/api/v1/course-schedules", status_code=status.HTTP_201_CREATED)
def create_course_schedule(
    payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)
):
    _require_edu_admin(current_user)

    teaching_id = payload.get("teaching_id")
    classroom_id = payload.get("classroom_id")
    day_of_week = payload.get("day_of_week")
    start_time_str = payload.get("start_time")
    end_time_str = payload.get("end_time")
    if not all([teaching_id, classroom_id, day_of_week, start_time_str, end_time_str]):
        raise HTTPException(status_code=400, detail="teaching_id, classroom_id, day_of_week, start_time, end_time 为必填字段")

    try:
        start_t = datetime.strptime(start_time_str, "%H:%M:%S").time()
        end_t = datetime.strptime(end_time_str, "%H:%M:%S").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="时间格式应为 HH:MM:SS")

    if start_t >= end_t:
        raise HTTPException(status_code=400, detail="开始时间必须早于结束时间")

    session = SessionLocal()
    try:
        ta = session.query(TeachingAssignment).get(teaching_id)
        if not ta or ta.is_deleted:
            raise HTTPException(status_code=400, detail="授课任务不存在")
        room = session.query(Classroom).get(classroom_id)
        if not room:
            raise HTTPException(status_code=400, detail="教室不存在")

        # 教室时间冲突检测
        existing = (
            session.query(CourseSchedule)
            .filter(
                CourseSchedule.classroom_id == classroom_id,
                CourseSchedule.day_of_week == day_of_week,
            )
            .all()
        )
        for cs in existing:
            if start_t < cs.end_time and end_t > cs.start_time:
                raise HTTPException(
                    status_code=409,
                    detail="该教室在该时间段已有排课",
                )

        schedule = CourseSchedule(
            teaching_id=teaching_id,
            classroom_id=classroom_id,
            day_of_week=day_of_week,
            start_time=start_t,
            end_time=end_t,
        )
        session.add(schedule)
        session.commit()
        session.refresh(schedule)
        return {
            "id": schedule.id,
            "teaching_id": schedule.teaching_id,
            "classroom_id": schedule.classroom_id,
            "day_of_week": schedule.day_of_week,
            "start_time": schedule.start_time.strftime("%H:%M:%S"),
            "end_time": schedule.end_time.strftime("%H:%M:%S"),
        }
    finally:
        session.close()


# 成绩审核与发布
@app.get("/api/v1/grades/pending-review")
def list_pending_review(current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    session = SessionLocal()
    try:
        # 查找存在未发布成绩的课程
        rows = (
            session.query(Course.id, Course.course_name)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .join(Grade, Grade.enrollment_id == Enrollment.id)
            .filter(Course.is_deleted == 0, Grade.is_deleted == False, Grade.status != "published")
            .distinct()
            .all()
        )

        results = []
        for course_id, course_name in rows:
            # 计算优秀率
            scores = [
                float(g.score)
                for g in (
                    session.query(Grade)
                    .join(Enrollment, Grade.enrollment_id == Enrollment.id)
                    .filter(
                        Enrollment.course_id == course_id,
                        Grade.is_deleted == False,
                        Grade.score != None,
                    )
                    .all()
                )
            ]
            warnings = []
            if scores:
                total = len(scores)
                excellent = sum(1 for s in scores if s >= 90)
                rate = excellent / total
                if rate >= 0.3:
                    warnings.append(
                        {
                            "type": "HIGH_EXCELLENT_RATE",
                            "message": f"优秀率 (90分以上) 达到 {rate * 100:.0f}%，超过预警阈值 30%。",
                        }
                    )

            results.append(
                {
                    "course_id": course_id,
                    "course_name": course_name,
                    "status": "pending_review",
                    "warnings": warnings,
                }
            )

        return results
    finally:
        session.close()


@app.post("/api/v1/grades/publish")
def publish_grades(payload: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    _require_edu_admin(current_user)
    course_ids = payload.get("course_ids") or []
    if not isinstance(course_ids, list):
        raise HTTPException(status_code=400, detail="course_ids 必须为数组")

    session = SessionLocal()
    try:
        grades = (
            session.query(Grade)
            .join(Enrollment, Grade.enrollment_id == Enrollment.id)
            .filter(Enrollment.course_id.in_(course_ids), Grade.is_deleted == False)
            .all()
        )
        for g in grades:
            g.status = "published"
        session.commit()
        return {"message": f"{len(course_ids)} 个课程的成绩已成功发布。"}
    finally:
        session.close()


# =====================
# 系统管理与日志（接入数据库实现）
# =====================


def _require_sys_admin(current_user: CurrentUser):
    if current_user.role != "sys_admin":
        raise HTTPException(status_code=403, detail="仅系统管理员可以执行此操作")


@app.get("/api/v1/logs")
def query_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
):
    _require_sys_admin(current_user)
    session = SessionLocal()
    try:
        q = session.query(Log).options(joinedload(Log.user))
        if user_id is not None:
            q = q.filter(Log.user_id == user_id)
        if action:
            q = q.filter(Log.action == action)

        start_dt = parse_iso_datetime(start_date) if start_date else None
        end_dt = parse_iso_datetime(end_date) if end_date else None
        if start_dt:
            q = q.filter(Log.created_at >= start_dt)
        if end_dt:
            q = q.filter(Log.created_at <= end_dt)

        total_items = q.count()
        total_pages = math.ceil(total_items / pageSize) if pageSize else 1
        logs = (
            q.order_by(Log.created_at.desc())
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .all()
        )

        items = []
        for lg in logs:
            items.append(
                {
                    "id": lg.id,
                    "user": {
                        "id": lg.user.id if lg.user else None,
                        "username": lg.user.username if lg.user else None,
                    },
                    "action": lg.action,
                    "details": lg.details,
                    "ip_address": lg.ip_address,
                    "created_at": lg.created_at.isoformat() + "Z",
                }
            )

        return {
            "pagination": {
                "totalItems": total_items,
                "totalPages": total_pages,
                "currentPage": page,
                "pageSize": pageSize,
            },
            "logs": items,
        }
    finally:
        session.close()


@app.post("/api/v1/system/backups", status_code=status.HTTP_202_ACCEPTED)
def create_backup(current_user: CurrentUser = Depends(get_current_user)):
    _require_sys_admin(current_user)
    task_id = f"backup-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    return {"message": "数据备份任务已启动。", "task_id": task_id}


@app.post("/api/v1/{resource_type}/{id}/restore")
def restore_resource(
    resource_type: str,
    id: int,
    current_user: CurrentUser = Depends(get_current_user),
):
    # 默认由教学管理员或系统管理员执行
    if current_user.role not in {"edu_admin", "sys_admin"}:
        raise HTTPException(status_code=403, detail="仅管理员可以恢复资源")

    model = RESTORABLE_MODELS.get(resource_type.lower())
    if not model:
        raise HTTPException(status_code=400, detail="不支持的资源类型")

    session = SessionLocal()
    try:
        obj = session.query(model).get(id)
        if not obj:
            raise HTTPException(status_code=404, detail="资源不存在")

        if not hasattr(obj, "is_deleted"):
            raise HTTPException(status_code=400, detail="该资源不支持软删除恢复")

        setattr(obj, "is_deleted", False)
        session.commit()
        return {"message": "资源已成功恢复。"}
    finally:
        session.close()
