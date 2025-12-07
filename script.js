// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initSlideshow();
    initMobileMenu();
    initImageModal();
    initNavLinks();
    initPhotoGalleries();
    initPhotoUpload();
});

// 全局变量
let uploadedPhotos = [];
let userPhotoGalleries = {
    spring: [],
    summer: [],
    autumn: [],
    winter: []
};

// 7. 照片上传功能
function initPhotoUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const generateBtn = document.getElementById('generateBtn');
    const photoCount = document.getElementById('photoCount');
    const totalSize = document.getElementById('totalSize');
    const previewGrid = document.getElementById('previewGrid');
    const previewPlaceholder = document.getElementById('previewPlaceholder');

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 点击上传按钮触发文件选择
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 拖拽事件处理
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // 文件选择事件处理
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 处理选择的文件
    function handleFiles(files) {
        const filesArray = Array.from(files);
        
        // 检查文件数量限制
        if (uploadedPhotos.length + filesArray.length > 1000) {
            alert('最多只能上传1000张照片');
            return;
        }
        
        // 过滤只保留图片文件
        const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
        
        // 添加到上传列表
        imageFiles.forEach(file => {
            processPhoto(file);
        });
        
        updateUploadInfo();
        updatePreview();
    }

    // 处理单张照片
    function processPhoto(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // 创建图片对象
            const img = new Image();
            img.onload = () => {
                // 提取EXIF信息
                extractEXIF(file, img, (exifData) => {
                    const photo = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        file: file,
                        url: e.target.result,
                        width: img.width,
                        height: img.height,
                        size: file.size,
                        exif: exifData,
                        season: getSeasonFromDate(exifData.date),
                        location: exifData.location
                    };
                    
                    uploadedPhotos.push(photo);
                    updateUploadInfo();
                    updatePreview();
                });
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    // 8. 提取EXIF信息
    function extractEXIF(file, img, callback) {
        const exifData = {
            date: null,
            location: null,
            camera: null,
            make: null,
            model: null
        };
        
        // 使用EXIF.js提取元数据
        EXIF.getData(img, function() {
            // 获取拍摄日期
            const dateTaken = EXIF.getTag(this, "DateTimeOriginal") || 
                             EXIF.getTag(this, "DateTimeDigitized") || 
                             file.lastModifiedDate;
            
            if (dateTaken) {
                exifData.date = new Date(dateTaken);
            } else {
                exifData.date = new Date(file.lastModified);
            }
            
            // 获取相机信息
            exifData.make = EXIF.getTag(this, "Make") || "未知";
            exifData.model = EXIF.getTag(this, "Model") || "未知";
            exifData.camera = `${exifData.make} ${exifData.model}`;
            
            // 获取地理位置（需要相机支持GPS）
            const gpsLat = EXIF.getTag(this, "GPSLatitude");
            const gpsLatRef = EXIF.getTag(this, "GPSLatitudeRef");
            const gpsLon = EXIF.getTag(this, "GPSLongitude");
            const gpsLonRef = EXIF.getTag(this, "GPSLongitudeRef");
            
            if (gpsLat && gpsLon) {
                const latitude = convertGPSCoordinate(gpsLat, gpsLatRef);
                const longitude = convertGPSCoordinate(gpsLon, gpsLonRef);
                exifData.location = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            } else {
                exifData.location = "未知地点";
            }
            
            callback(exifData);
        });
    }

    // 转换GPS坐标
    function convertGPSCoordinate(coordinate, ref) {
        let [deg, min, sec] = coordinate;
        let decimalDegrees = deg + (min / 60) + (sec / 3600);
        
        if (ref === "S" || ref === "W") {
            decimalDegrees = -decimalDegrees;
        }
        
        return decimalDegrees;
    }

    // 根据日期获取季节
    function getSeasonFromDate(date) {
        if (!date) return 'spring';
        
        const month = date.getMonth() + 1;
        
        if (month >= 3 && month <= 5) {
            return 'spring';
        } else if (month >= 6 && month <= 8) {
            return 'summer';
        } else if (month >= 9 && month <= 11) {
            return 'autumn';
        } else {
            return 'winter';
        }
    }

    // 更新上传信息
    function updateUploadInfo() {
        // 计算总大小
        const totalBytes = uploadedPhotos.reduce((sum, photo) => sum + photo.size, 0);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
        
        // 更新显示
        photoCount.textContent = `已选择 ${uploadedPhotos.length} 张照片`;
        totalSize.textContent = `总大小: ${totalMB} MB`;
        
        // 启用/禁用生成按钮
        generateBtn.disabled = uploadedPhotos.length === 0;
    }

    // 更新预览
    function updatePreview() {
        if (uploadedPhotos.length === 0) {
            previewPlaceholder.style.display = 'block';
            previewGrid.style.display = 'none';
            return;
        }
        
        previewPlaceholder.style.display = 'none';
        previewGrid.style.display = 'grid';
        
        // 清空现有预览
        previewGrid.innerHTML = '';
        
        // 添加新预览
        uploadedPhotos.forEach((photo, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${photo.url}" alt="照片 ${index + 1}">
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            
            // 添加删除功能
            const removeBtn = previewItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(removeBtn.dataset.index);
                uploadedPhotos.splice(index, 1);
                updateUploadInfo();
                updatePreview();
            });
            
            previewGrid.appendChild(previewItem);
        });
    }

    // 清空选择
    clearBtn.addEventListener('click', () => {
        uploadedPhotos = [];
        fileInput.value = '';
        updateUploadInfo();
        updatePreview();
    });

    // 生成相册
    generateBtn.addEventListener('click', () => {
        generateUserGallery();
    });
}

// 9. 生成用户相册
function generateUserGallery() {
    // 重置用户相册
    userPhotoGalleries = {
        spring: [],
        summer: [],
        autumn: [],
        winter: []
    };
    
    // 根据季节分类照片
    uploadedPhotos.forEach((photo, index) => {
        const season = photo.season;
        const photoData = {
            title: `照片 ${index + 1}`,
            location: photo.location,
            imgId: photo.id, // 使用唯一ID
            url: photo.url, // 使用本地URL
            date: photo.exif.date,
            camera: photo.exif.camera
        };
        
        userPhotoGalleries[season].push(photoData);
    });
    
    // 重新生成相册
    renderUserPhotoGalleries();
    
    // 显示成功消息
    alert(`相册生成成功！共 ${uploadedPhotos.length} 张照片，已按季节分类。`);
    
    // 滚动到春季相册
    document.getElementById('spring').scrollIntoView({ behavior: 'smooth' });
}

// 10. 渲染用户相册
function renderUserPhotoGalleries() {
    // 遍历所有季节，生成照片集
    for (const [season, photos] of Object.entries(userPhotoGalleries)) {
        const galleryContainer = document.getElementById(`${season}Grid`);
        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            
            // 为每个照片创建HTML结构
            photos.forEach((photo, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="${photo.url}" 
                         alt="${photo.title}" 
                         class="photo-img">
                    <div class="photo-overlay">
                        <h3 class="photo-title">${photo.title}</h3>
                        <p class="photo-location">${photo.location}</p>
                        ${photo.date ? `<p class="photo-date">${photo.date.toLocaleDateString()}</p>` : ''}
                    </div>
                `;
                
                galleryContainer.appendChild(photoItem);
            });
        }
    }
}

// 重写initPhotoGalleries函数，支持用户照片
function initPhotoGalleries() {
    // 遍历所有季节，生成照片集
    for (const [season, photos] of Object.entries(photoGalleries)) {
        const galleryContainer = document.getElementById(`${season}Grid`);
        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            
            // 为每个照片创建HTML结构
            photos.forEach((photo, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="https://picsum.photos/600/400?random=${photo.imgId}" 
                         alt="${photo.title}" 
                         class="photo-img">
                    <div class="photo-overlay">
                        <h3 class="photo-title">${photo.title}</h3>
                        <p class="photo-location">${photo.location}</p>
                    </div>
                `;
                
                galleryContainer.appendChild(photoItem);
            });
        }
    }
}

// 1. 图片轮播功能
function initSlideshow() {
    const slideshow = document.getElementById('heroSlideshow');
    const slides = document.querySelectorAll('.slideshow-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicatorsContainer = document.getElementById('slideshowIndicators');
    let currentSlide = 0;
    let slideInterval;

    // 创建轮播指示器
    slides.forEach((_, index) => {
        const indicator = document.createElement('span');
        indicator.className = 'indicator';
        if (index === 0) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    const indicators = document.querySelectorAll('.indicator');

    // 切换到指定幻灯片
    function goToSlide(index) {
        // 移除当前激活状态
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');

        // 更新当前幻灯片索引
        currentSlide = index;
        if (currentSlide < 0) {
            currentSlide = slides.length - 1;
        } else if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        // 添加新的激活状态
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    // 下一张幻灯片
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // 上一张幻灯片
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // 自动轮播
    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动轮播
    function stopSlideInterval() {
        clearInterval(slideInterval);
    }

    // 事件监听器
    prevBtn.addEventListener('click', () => {
        stopSlideInterval();
        prevSlide();
        startSlideInterval();
    });

    nextBtn.addEventListener('click', () => {
        stopSlideInterval();
        nextSlide();
        startSlideInterval();
    });

    // 鼠标悬停时停止轮播，离开时继续
    slideshow.addEventListener('mouseenter', stopSlideInterval);
    slideshow.addEventListener('mouseleave', startSlideInterval);

    // 初始化自动轮播
    startSlideInterval();
}

// 2. 移动端菜单功能
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        // 切换汉堡菜单图标
        const bars = menuToggle.querySelectorAll('.bar');
        bars[0].classList.toggle('change');
        bars[1].classList.toggle('change');
        bars[2].classList.toggle('change');
    });

    // 点击导航链接后关闭菜单
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const bars = menuToggle.querySelectorAll('.bar');
            bars.forEach(bar => bar.classList.remove('change'));
        });
    });
}

// 3. 图片模态框功能
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const closeModal = document.querySelector('.close-modal');

    // 为所有图片项添加点击事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('photo-img')) {
            const photoItem = e.target.closest('.photo-item');
            const imgSrc = e.target.src;
            const imgAlt = e.target.alt;
            const photoTitle = photoItem.querySelector('.photo-title')?.textContent || '';
            const photoLocation = photoItem.querySelector('.photo-location')?.textContent || '';
            
            modal.style.display = 'flex';
            modal.classList.add('show');
            modalImg.src = imgSrc;
            modalImg.alt = imgAlt;
            modalCaption.textContent = `${photoTitle} - ${photoLocation}`;
        }
    });

    // 关闭模态框
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });

    // 按ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
}

// 4. 导航链接激活状态
function initNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // 监听滚动事件，更新激活的导航链接
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // 点击导航链接平滑滚动
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 5. 照片集数据
const photoGalleries = {
    spring: [
        { title: '樱花盛开', location: '日本 · 东京', imgId: 11 },
        { title: '油菜花海', location: '中国 · 婺源', imgId: 12 },
        { title: '郁金香', location: '荷兰 · 阿姆斯特丹', imgId: 13 },
        { title: '桃花林', location: '中国 · 西藏', imgId: 14 },
        { title: '樱花隧道', location: '日本 · 京都', imgId: 15 },
        { title: '梨花雪', location: '中国 · 河北', imgId: 16 }
    ],
    summer: [
        { title: '海滩日落', location: '泰国 · 普吉岛', imgId: 21 },
        { title: '高山湖泊', location: '瑞士 · 阿尔卑斯山', imgId: 22 },
        { title: '热带雨林', location: '马来西亚 · 沙巴', imgId: 23 },
        { title: '瀑布', location: '冰岛 · 黄金瀑布', imgId: 24 },
        { title: '草原', location: '中国 · 内蒙古', imgId: 25 },
        { title: '海岸线', location: '葡萄牙 · 阿尔加维', imgId: 26 }
    ],
    autumn: [
        { title: '枫叶大道', location: '加拿大 · 多伦多', imgId: 31 },
        { title: '银杏林', location: '中国 · 北京', imgId: 32 },
        { title: '红枫谷', location: '中国 · 南京', imgId: 33 },
        { title: '秋日森林', location: '德国 · 黑森林', imgId: 34 },
        { title: '稻田', location: '中国 · 云南', imgId: 35 },
        { title: '红叶寺', location: '日本 · 奈良', imgId: 36 }
    ],
    winter: [
        { title: '雪景', location: '瑞士 · 苏黎世', imgId: 41 },
        { title: '冰雕', location: '中国 · 哈尔滨', imgId: 42 },
        { title: '滑雪场', location: '美国 · 阿斯彭', imgId: 43 },
        { title: '温泉', location: '日本 · 北海道', imgId: 44 },
        { title: '北极光', location: '冰岛 · 雷克雅未克', imgId: 45 },
        { title: '冬樱', location: '日本 · 冲绳', imgId: 46 }
    ]
};

// 6. 初始化照片集
function initPhotoGalleries() {
    // 遍历所有季节，生成照片集
    for (const [season, photos] of Object.entries(photoGalleries)) {
        const galleryContainer = document.getElementById(`${season}Grid`);
        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            
            // 为每个照片创建HTML结构
            photos.forEach((photo, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="https://picsum.photos/600/400?random=${photo.imgId}" 
                         alt="${photo.title}" 
                         class="photo-img">
                    <div class="photo-overlay">
                        <h3 class="photo-title">${photo.title}</h3>
                        <p class="photo-location">${photo.location}</p>
                    </div>
                `;
                
                galleryContainer.appendChild(photoItem);
            });
        }
    }
}

// 7. 窗口大小变化时的响应
window.addEventListener('resize', () => {
    // 确保在窗口大小变化时，轮播图正常显示
    const slideshow = document.getElementById('heroSlideshow');
    if (slideshow) {
        const activeSlide = slideshow.querySelector('.slideshow-slide.active');
        if (activeSlide) {
            activeSlide.style.opacity = '0';
            setTimeout(() => {
                activeSlide.style.opacity = '1';
            }, 100);
        }
    }
});

// 8. 页面加载动画
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});