from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import secrets
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Enum, ForeignKey, DECIMAL, and_, or_, asc, desc
from sqlalchemy.orm import sessionmaker, relationship, joinedload, declarative_base
import math

DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/Web-Programming-Course-Project?charset=utf8mb4"

Base = declarative_base()

# ORM Models
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
# 允许CORS，前端本地开发端口5500
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
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

def hash_password(salt: str, password: str) -> str:
    # 简单示例：salt + password，用 SHA-256 生成哈希
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

# 以内存字典模拟一个用户库；实际项目应使用数据库并加盐哈希存储
_demo_salt = secrets.token_hex(16)
_demo_password_plain = "InitialPassword123"
_demo_password_hash = hash_password(_demo_salt, _demo_password_plain)

user_store: Dict[str, Dict[str, Any]] = {
    "20210001": {
        "id": 10,
        "username": "20210001",
        "role": "student",
        "salt": _demo_salt,
        "password_hash": _demo_password_hash,
        "force_password_change": True,
        "failed_attempts": 0,
        "locked_until": None,
    }
}

@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    urec = user_store.get(payload.username)
    if not urec:
        # 用户不存在，统一返回 401
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "用户名或密码错误。"}
        })

    # 锁定检查
    locked_until = urec.get("locked_until")
    now = datetime.utcnow()
    if locked_until and now < locked_until:
        raise HTTPException(status_code=423, detail={
            "error": {"code": "ACCOUNT_LOCKED", "message": "账户已锁定，请在 5 分钟后重试。"}
        })

    # 验证密码
    expected_hash = urec["password_hash"]
    salt = urec["salt"]
    if hash_password(salt, payload.password) != expected_hash:
        urec["failed_attempts"] = int(urec.get("failed_attempts", 0)) + 1
        if urec["failed_attempts"] >= MAX_FAILED_ATTEMPTS:
            urec["locked_until"] = now + LOGIN_LOCK_DURATION
            raise HTTPException(status_code=423, detail={
                "error": {"code": "ACCOUNT_LOCKED", "message": "账户已锁定，请在 5 分钟后重试。"}
            })
        # 未达到锁定阈值，返回 401
        raise HTTPException(status_code=401, detail={
            "error": {"code": "UNAUTHORIZED", "message": "用户名或密码错误。"}
        })

    # 登录成功：重置失败计数与锁定
    urec["failed_attempts"] = 0
    urec["locked_until"] = None

    # 生成演示用令牌（生产环境请使用 JWT 并设置过期时间等）
    token = secrets.token_urlsafe(32)
    return LoginResponse(
        token=token,
        user=LoginUserInfo(
            id=urec["id"],
            username=urec["username"],
            role=urec["role"],
            force_password_change=bool(urec.get("force_password_change", True))
        )
    )


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
    # 骨架：不解析文件，直接返回示例摘要；生产环境需解析CSV/XLS并写入数据库
    return {
        "summary": {
            "total": 2,
            "created": 1,
            "failed": 0,
            "existing": 1
        },
        "details": [
            {
                "student_id_number": "20210002",
                "status": "existing",
                "message": "用户已存在"
            }
        ]
    }


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

@app.post("/api/v1/enrollments", status_code=status.HTTP_201_CREATED)
def create_enrollment(payload: Dict[str, Any]):
    # 期望字段：course_id, semester
    return {
        "id": 55,
        "student_id": 10,
        "course_id": payload.get("course_id", 101),
        "semester": payload.get("semester", "2025-2026-1"),
        "enrollment_date": "2025-09-01T10:00:00Z"
    }

@app.get("/api/v1/me/enrollments")
def list_my_enrollments(semester: Optional[str] = None):
    return [
        {
            "enrollment_id": 55,
            "semester": semester or "2025-2026-1",
            "course": {
                "id": 101,
                "course_code": "CS101",
                "course_name": "计算机科学导论",
                "credits": 4.0,
                "teachers": [
                    {"id": 1, "full_name": "张三"}
                ]
            }
        }
    ]

@app.get("/api/v1/me/enrollments/{enrollment_id}/tasks")
def list_enrollment_tasks(enrollment_id: int, status: Optional[str] = None):
    return [
        {
            "task_progress_id": 123,
            "status": status or "todo",
            "material": {"id": 88, "material_type": "document", "title": "第一章：计算机历史.pdf"}
        },
        {
            "task_progress_id": 124,
            "status": status or "todo",
            "material": {"id": 89, "material_type": "video", "title": "第二章：冯·诺依曼结构.mp4"}
        }
    ]

@app.get("/api/v1/me/grades/summary")
def get_grades_summary(semester: Optional[str] = None):
    summary_sem = semester or "2025-2026-1"
    return {
        summary_sem: {
            "courses": [
                {"course_name": "计算机科学导论", "credits": 4.0, "final_score": 92.5, "gpa": 4.0},
                {"course_name": "高等数学I", "credits": 3.0, "final_score": 85.0, "gpa": 3.7}
            ],
            "semester_gpa": 3.87,
            "total_credits": 7.0
        }
    }

@app.get("/api/v1/me/enrollments/{enrollment_id}/grades")
def get_enrollment_grades(enrollment_id: int):
    return {
        "course_name": "计算机科学导论",
        "final_score": 92.5,
        "grade_items": [
            {"item_name": "作业1", "weight": 0.15, "score": 90.0},
            {"item_name": "作业2", "weight": 0.15, "score": 95.0},
            {"item_name": "期中考试", "weight": 0.30, "score": 88.0},
            {"item_name": "期末考试", "weight": 0.40, "score": 94.0}
        ]
    }


# =====================
# 教师端：课程与成绩管理（骨架实现）
# =====================

@app.get("/api/v1/me/teaching-assignments")
def list_my_teaching_assignments(semester: Optional[str] = None):
    return [
        {
            "teaching_assignment_id": 33,
            "semester": semester or "2025-2026-1",
            "course": {"id": 101, "course_code": "CS101", "course_name": "计算机科学导论"}
        }
    ]

@app.post("/api/v1/courses/{course_id}/materials", status_code=status.HTTP_201_CREATED)
async def upload_course_materials(course_id: int,
                                  material_type: str = Form(...),
                                  title: str = Form(...),
                                  file: UploadFile = File(...),
                                  display_order: Optional[int] = Form(None)):
    return {
        "id": 90,
        "course_id": course_id,
        "material_type": material_type,
        "title": title,
        "file_path_or_content": f"/uploads/courses/{course_id}/materials/{file.filename}",
        "display_order": display_order or 0,
        "uploaded_by": 1
    }

@app.patch("/api/v1/courses/{course_id}/config")
def update_course_config(course_id: int, payload: Dict[str, Any]):
    return {
        "course_id": course_id,
        "description": payload.get("description", ""),
        "config": {
            "allow_comments": payload.get("allow_comments", True),
            "allow_notes": payload.get("allow_notes", False)
        }
    }

@app.post("/api/v1/courses/{course_id}/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(course_id: int, payload: Dict[str, Any]):
    return {
        "id": 25,
        "course_id": course_id,
        "title": payload.get("title", "新的作业/考试"),
        "type": payload.get("type", "assignment"),
        "deadline": payload.get("deadline")
    }

@app.get("/api/v1/assignments/{assignment_id}/submissions")
def list_submissions(assignment_id: int):
    return [
        {
            "submission_id": 201,
            "student": {"id": 10, "full_name": "王五"},
            "submitted_at": "2025-10-14T20:00:00Z",
            "status": "graded",
            "score": 90.0
        }
    ]

@app.post("/api/v1/courses/{course_id}/grade-items", status_code=status.HTTP_201_CREATED)
def create_grade_item(course_id: int, payload: Dict[str, Any]):
    return {
        "id": 41,
        "course_id": course_id,
        "item_name": payload.get("item_name", "期中考试"),
        "weight": payload.get("weight", 0.30)
    }

@app.put("/api/v1/grades/{grade_id}")
def update_grade(grade_id: int, payload: Dict[str, Any]):
    return {
        "id": grade_id,
        "enrollment_id": 55,
        "grade_item_id": 41,
        "score": payload.get("score", 95.5),
        "status": "graded"
    }

@app.post("/api/v1/grade-items/{item_id}/grades/batch-upload")
async def batch_upload_grades(item_id: int, file: UploadFile = File(...)):
    return {
        "summary": {"total": 50, "updated": 48, "failed": 2},
        "details": [
            {"student_id_number": "20219999", "status": "failed", "message": "学生未选修该课程"}
        ]
    }


# =====================
# 教学管理端（骨架实现）
# =====================

# 班级 CRUD
@app.post("/api/v1/classes", status_code=status.HTTP_201_CREATED)
def create_class(payload: Dict[str, Any]):
    return {"id": 1, **payload}

@app.get("/api/v1/classes")
def list_classes(page: int = 1, pageSize: int = 10):
    return {"pagination": {"totalItems": 1, "totalPages": 1, "currentPage": page, "pageSize": pageSize},
            "items": [{"id": 1, "class_name": "网络工程2101班", "department": "信息科学与技术学院", "enrollment_year": 2021}]}

@app.get("/api/v1/classes/{id}")
def get_class(id: int):
    return {"id": id, "class_name": "网络工程2101班", "department": "信息科学与技术学院", "enrollment_year": 2021}

@app.put("/api/v1/classes/{id}")
def update_class(id: int, payload: Dict[str, Any]):
    return {"id": id, **payload}

@app.delete("/api/v1/classes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(id: int):
    return

# 学生 CRUD
@app.post("/api/v1/students", status_code=status.HTTP_201_CREATED)
def create_student(payload: Dict[str, Any]):
    return {"id": 1, **payload}

@app.get("/api/v1/students")
def list_students(page: int = 1, pageSize: int = 10):
    return {"pagination": {"totalItems": 1, "totalPages": 1, "currentPage": page, "pageSize": pageSize},
            "items": [{"id": 1, "username": "20210003", "full_name": "孙七", "email": "sunqi@example.edu", "class_id": 1}]}

@app.get("/api/v1/students/{id}")
def get_student(id: int):
    return {"id": id, "username": "20210003", "full_name": "孙七", "email": "sunqi@example.edu", "class_id": 1}

@app.put("/api/v1/students/{id}")
def update_student(id: int, payload: Dict[str, Any]):
    return {"id": id, **payload}

@app.delete("/api/v1/students/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(id: int):
    return

# 教师 CRUD
@app.post("/api/v1/teachers", status_code=status.HTTP_201_CREATED)
def create_teacher(payload: Dict[str, Any]):
    return {"id": 1, **payload}

@app.get("/api/v1/teachers")
def list_teachers(page: int = 1, pageSize: int = 10):
    return {"pagination": {"totalItems": 1, "totalPages": 1, "currentPage": page, "pageSize": pageSize},
            "items": [{"id": 1, "full_name": "张三", "title": "教授"}]}

@app.get("/api/v1/teachers/{id}")
def get_teacher(id: int):
    return {"id": id, "full_name": "张三", "title": "教授"}

@app.put("/api/v1/teachers/{id}")
def update_teacher(id: int, payload: Dict[str, Any]):
    return {"id": id, **payload}

@app.delete("/api/v1/teachers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(id: int):
    return

# 课程 CRUD（补齐创建/更新/删除）
@app.post("/api/v1/courses", status_code=status.HTTP_201_CREATED)
def admin_create_course(payload: Dict[str, Any]):
    return {"id": 105, **payload}

@app.put("/api/v1/courses/{id}")
def admin_update_course(id: int, payload: Dict[str, Any]):
    return {"id": id, **payload}

@app.delete("/api/v1/courses/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_course(id: int):
    return

# 教室 CRUD
@app.post("/api/v1/classrooms", status_code=status.HTTP_201_CREATED)
def create_classroom(payload: Dict[str, Any]):
    return {"id": 5, **payload}

@app.get("/api/v1/classrooms")
def list_classrooms(page: int = 1, pageSize: int = 10):
    return {"pagination": {"totalItems": 1, "totalPages": 1, "currentPage": page, "pageSize": pageSize},
            "items": [{"id": 5, "name": "A101", "capacity": 60}]}

@app.get("/api/v1/classrooms/{id}")
def get_classroom(id: int):
    return {"id": id, "name": "A101", "capacity": 60}

@app.put("/api/v1/classrooms/{id}")
def update_classroom(id: int, payload: Dict[str, Any]):
    return {"id": id, **payload}

@app.delete("/api/v1/classrooms/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(id: int):
    return

# 学期教学安排
@app.post("/api/v1/teaching-assignments", status_code=status.HTTP_201_CREATED)
def create_teaching_assignment(payload: Dict[str, Any]):
    return {"id": 34, **payload}

@app.post("/api/v1/course-schedules", status_code=status.HTTP_201_CREATED)
def create_course_schedule(payload: Dict[str, Any]):
    return {"id": 77, **payload}

# 成绩审核与发布
@app.get("/api/v1/grades/pending-review")
def list_pending_review():
    return [
        {
            "course_id": 101,
            "course_name": "计算机科学导论",
            "status": "pending_review",
            "warnings": [
                {"type": "HIGH_EXCELLENT_RATE", "message": "优秀率 (90分以上) 达到 45%，超过预警阈值 30%。"}
            ]
        }
    ]

@app.post("/api/v1/grades/publish")
def publish_grades(payload: Dict[str, Any]):
    count = len(payload.get("course_ids", []))
    return {"message": f"{count} 个课程的成绩已成功发布。"}


# =====================
# 系统管理与日志（骨架实现）
# =====================

@app.get("/api/v1/logs")
def query_logs(user_id: Optional[int] = None,
               action: Optional[str] = None,
               start_date: Optional[str] = None,
               end_date: Optional[str] = None,
               page: int = 1,
               pageSize: int = 10):
    return {
        "pagination": {"totalItems": 1, "totalPages": 1, "currentPage": page, "pageSize": pageSize},
        "logs": [
            {
                "id": 1001,
                "user": {"id": 1, "username": "admin"},
                "action": action or "USER_LOGIN_FAILURE",
                "details": "用户 'test' 尝试登录失败",
                "ip_address": "192.168.1.100",
                "created_at": "2025-12-20T10:00:00Z"
            }
        ]
    }

@app.post("/api/v1/system/backups", status_code=status.HTTP_202_ACCEPTED)
def create_backup():
    task_id = f"backup-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    return {"message": "数据备份任务已启动。", "task_id": task_id}

@app.post("/api/v1/{resource_type}/{id}/restore")
def restore_resource(resource_type: str, id: int):
    return {"message": "资源已成功恢复。", "resource_type": resource_type, "id": id}
