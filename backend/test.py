from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
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
