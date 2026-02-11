// 轮播图组件

class Carousel {
    constructor(container, images) {
        this.container = container;
        this.images = images || [];
        this.currentIndex = 0;
        this.autoPlayInterval = null;
        this.init();
    }

    init() {
        if (!this.images || this.images.length === 0) {
            this.renderNoImage();
            return;
        }

        this.render();
        this.startAutoPlay();
    }

    render() {
        const html = `
            <div class="carousel-slides" id="carouselSlides">
                ${this.images.map((img, index) => `
                    <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                        <img src="${img}" alt="课程轮播图${index + 1}" onerror="this.parentElement.innerHTML='<div class=\\'carousel-slide no-image\\'>图片加载失败</div>'">
                    </div>
                `).join('')}
            </div>
            ${this.images.length > 1 ? `
                <button class="carousel-nav prev" onclick="carousel.prev()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-nav next" onclick="carousel.next()">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="carousel-controls">
                    ${this.images.map((_, index) => `
                        <div class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="carousel.goTo(${index})"></div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        this.container.innerHTML = html;
    }

    renderNoImage() {
        this.container.innerHTML = `
            <div class="carousel-slides">
                <div class="carousel-slide no-image">
                    暂无图片
                </div>
            </div>
        `;
    }

    goTo(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentIndex = index;
        const slides = this.container.querySelector('.carousel-slides');
        if (slides) {
            slides.style.transform = `translateX(-${index * 100}%)`;
        }
        
        this.updateDots();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.goTo(this.currentIndex);
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.goTo(this.currentIndex);
    }

    updateDots() {
        const dots = this.container.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoPlay(interval = 5000) {
        if (this.images.length <= 1) return;
        
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.next();
        }, interval);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    destroy() {
        this.stopAutoPlay();
        this.container.innerHTML = '';
    }
}

// 获取课程轮播图
async function getCourseCarouselImages(courseId) {
    try {
        const materials = await apiRequest(`/courses/${courseId}/materials`);
        if (!materials || !Array.isArray(materials)) {
            return [];
        }
        
        // 筛选轮播图类型的资料
        const carouselImages = materials
            .filter(m => m.material_type === 'carousel_image' && !m.is_deleted)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map(m => m.file_path_or_content);
        
        return carouselImages;
    } catch (error) {
        console.error('获取轮播图失败:', error);
        return [];
    }
}

// 为课程卡片添加封面图
function renderCourseCover(course, coverElement) {
    if (!coverElement) return;
    
    // 如果课程有轮播图，使用第一张作为封面
    getCourseCarouselImages(course.id).then(images => {
        if (images && images.length > 0) {
            coverElement.innerHTML = `<img src="${images[0]}" alt="${course.course_name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-book-open\\'></i>'">`;
        } else {
            coverElement.innerHTML = '<i class="fas fa-book-open"></i>';
            coverElement.classList.add('no-image');
        }
    }).catch(() => {
        coverElement.innerHTML = '<i class="fas fa-book-open"></i>';
        coverElement.classList.add('no-image');
    });
}

// 全局轮播图实例（用于课程详情页）
let carousel = null;
