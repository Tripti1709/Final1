// Certificate Generation and Application Logic

class CertificateApp {
    constructor() {
        this.videoCompleted = false;
        this.currentCertificateData = null;
        this.init();
    }

    init() {
        this.setupVideoPlayer();
        this.setupForm();
        this.setupModal();
        this.setupPhotoUpload();
    }

    setupVideoPlayer() {
        const video = document.getElementById('trainingVideo');
        const progressBar = document.getElementById('progressBar');
        const timeDisplay = document.getElementById('timeDisplay');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const completionOverlay = document.getElementById('completionOverlay');

        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
                
                // Update time display
                timeDisplay.textContent = `${this.formatTime(video.currentTime)} / ${this.formatTime(video.duration)}`;
                
                // Check if video is 95% complete
                if (progress >= 95 && !this.videoCompleted) {
                    this.completeVideo();
                }
            }
        });

        video.addEventListener('loadedmetadata', () => {
            timeDisplay.textContent = `0:00 / ${this.formatTime(video.duration)}`;
        });

        // Prevent seeking ahead
        video.addEventListener('seeking', () => {
            if (video.currentTime > video.duration * 0.95) {
                video.currentTime = Math.min(video.currentTime, video.duration * 0.95);
            }
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    completeVideo() {
        this.videoCompleted = true;
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const completionOverlay = document.getElementById('completionOverlay');
        const form = document.getElementById('certificateForm');
        const submitButton = document.querySelector('.submit-button');

        // Update status
        statusIndicator.className = 'status-dot status-complete';
        statusText.textContent = 'Video completed - Form unlocked';

        // Show completion overlay
        completionOverlay.classList.remove('hidden');
        setTimeout(() => {
            completionOverlay.classList.add('hidden');
        }, 3000);

        // Unlock form
        form.classList.remove('form-locked');
        form.classList.add('form-unlocked');
        submitButton.disabled = false;
    }

    setupForm() {
        const form = document.getElementById('certificateForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.generateCertificate();
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    validateForm() {
        const form = document.getElementById('certificateForm');
        const formData = new FormData(form);
        let isValid = true;

        // Required fields validation
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}Error`);
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (!value) {
            errorMessage = 'This field is required';
            isValid = false;
        } else {
            // Specific validation rules
            switch (fieldName) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errorMessage = 'Please enter a valid email address';
                        isValid = false;
                    }
                    break;
                case 'phone':
                    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                    if (!phoneRegex.test(value) || value.length < 10) {
                        errorMessage = 'Please enter a valid phone number';
                        isValid = false;
                    }
                    break;
                case 'firstName':
                case 'lastName':
                    if (value.length < 2) {
                        errorMessage = 'Name must be at least 2 characters long';
                        isValid = false;
                    }
                    break;
            }
        }

        // Update UI
        if (isValid) {
            field.classList.remove('error');
            errorElement.textContent = '';
        } else {
            field.classList.add('error');
            errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    clearError(field) {
        const errorElement = document.getElementById(`${field.name}Error`);
        field.classList.remove('error');
        errorElement.textContent = '';
    }

    setupPhotoUpload() {
        const photoInput = document.getElementById('photo');
        const photoPreview = document.getElementById('photoPreview');

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
                    photoPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                photoPreview.classList.add('hidden');
                photoPreview.innerHTML = '';
            }
        });
    }

    generateCertificate() {
        const form = document.getElementById('certificateForm');
        const formData = new FormData(form);
        
        const certificateData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            photo: formData.get('photo'),
            certificateId: this.generateCertificateId()
        };

        this.currentCertificateData = certificateData;
        this.createCertificateCanvas(certificateData);
    }

    generateCertificateId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `MD-${timestamp}-${random}`;
    }

    createCertificateCanvas(certificateData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Load certificate template
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        
        templateImg.onload = () => {
            // Set canvas dimensions to match template
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;
            
            // Draw template
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            
            // Add user photo if uploaded
            if (certificateData.photo && certificateData.photo.size > 0) {
                this.addUserPhoto(ctx, canvas, certificateData);
            } else {
                this.addTextToCertificate(ctx, canvas, certificateData);
            }
        };

        templateImg.onerror = () => {
            // Fallback: create basic certificate
            this.createBasicCertificate(ctx, canvas, certificateData);
        };

        templateImg.src = 'certificate-template.png'; // <-- Replace with your image path
    }

    addUserPhoto(ctx, canvas, certificateData) {
        const userImg = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            userImg.onload = () => {
                // Position user photo in the designated blank area
                const photoX = canvas.width * 0.41; // 41% from left
                const photoY = canvas.height * 0.14; // 14% from top
                const photoWidth = canvas.width * 0.18; // 18% of canvas width
                const photoHeight = canvas.height * 0.23; // 23% of canvas height

                // Store photo position for text alignment
                this.photoPosition = {
                    x: photoX,
                    y: photoY,
                    width: photoWidth,
                    height: photoHeight
                };

                // Render photo with proper scaling
                ctx.save();
                
                // Add border
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 2;
                ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);
                
                // Clip to photo area
                ctx.beginPath();
                ctx.rect(photoX, photoY, photoWidth, photoHeight);
                ctx.clip();
                
                // Calculate scaling to maintain aspect ratio
                const imgAspectRatio = userImg.width / userImg.height;
                const areaAspectRatio = photoWidth / photoHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspectRatio > areaAspectRatio) {
                    drawHeight = photoHeight;
                    drawWidth = photoHeight * imgAspectRatio;
                    drawX = photoX - (drawWidth - photoWidth) / 2;
                    drawY = photoY;
                } else {
                    drawWidth = photoWidth;
                    drawHeight = photoWidth / imgAspectRatio;
                    drawX = photoX;
                    drawY = photoY - (drawHeight - photoHeight) / 2;
                }
                
                // Draw image with high quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
                
                ctx.restore();
                
                this.addTextToCertificate(ctx, canvas, certificateData);
            };
            userImg.src = e.target.result;
        };
        
        reader.readAsDataURL(certificateData.photo);
    }

    addTextToCertificate(ctx, canvas, certificateData) {
        // Set font styling for certificate text
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;

        const fullName = `${certificateData.firstName} ${certificateData.lastName}`;
        const phone = certificateData.phone;
        const today = new Date();
        const validDate = new Date();
        validDate.setMonth(validDate.getMonth() + 6);

        // Position text below photo with consistent spacing
        const centerX = this.photoPosition ? 
            this.photoPosition.x + (this.photoPosition.width / 2) : 
            canvas.width * 0.5;
        
        const spacingGap = 25; // 25px gap between image and text
        let startY = this.photoPosition ? 
            this.photoPosition.y + this.photoPosition.height + spacingGap : 
            canvas.height * 0.43;
        
        const lineHeight = 30;

        // Add user information
        ctx.fillText(`Name - ${fullName}`, centerX, startY);
        ctx.fillText(`Phone No - ${phone}`, centerX, startY + lineHeight);
        ctx.fillText(`Date - ${today.toLocaleDateString('en-GB')}`, centerX, startY + lineHeight * 2);
        ctx.fillText(`Valid Until - ${validDate.toLocaleDateString('en-GB')}`, centerX, startY + lineHeight * 3);

        // Add certificate ID
        ctx.font = '14px Arial, sans-serif';
        ctx.fillStyle = '#555555';
        ctx.shadowBlur = 1;
        ctx.fillText(`Certificate ID: ${certificateData.certificateId}`, centerX, canvas.height * 0.95);

        this.downloadCertificate(canvas, certificateData);
    }

    createBasicCertificate(ctx, canvas, certificateData) {
        // Fallback basic certificate
        canvas.width = 1024;
        canvas.height = 768;
        
        // Background
        ctx.fillStyle = '#97DDE8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        ctx.strokeStyle = '#134D80';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Title
        ctx.fillStyle = '#134D80';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICATE', canvas.width / 2, 100);
        
        // Subtitle
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Mother Dairy Safety Training', canvas.width / 2, 150);
        
        // User info
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px Arial';
        const fullName = `${certificateData.firstName} ${certificateData.lastName}`;
        
        ctx.fillText('This certifies that', canvas.width / 2, 250);
        ctx.fillText(fullName, canvas.width / 2, 300);
        ctx.fillText('has successfully completed the safety training', canvas.width / 2, 350);
        
        // Add dates and details
        const today = new Date();
        const validDate = new Date();
        validDate.setMonth(validDate.getMonth() + 6);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Phone: ${certificateData.phone}`, canvas.width / 2, 500);
        ctx.fillText(`Date: ${today.toLocaleDateString('en-GB')}`, canvas.width / 2, 530);
        ctx.fillText(`Valid Until: ${validDate.toLocaleDateString('en-GB')}`, canvas.width / 2, 560);
        ctx.fillText(`Certificate ID: ${certificateData.certificateId}`, canvas.width / 2, 590);
        
        this.downloadCertificate(canvas, certificateData);
    }

    downloadCertificate(canvas, certificateData) {
        // Create high-quality download
        const dataURL = canvas.toDataURL('image/png', 1.0);
        
        const link = document.createElement('a');
        link.download = `mother-dairy-certificate-${certificateData.firstName}-${certificateData.lastName}.png`;
        link.href = dataURL;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success modal
        this.showSuccessModal(certificateData);
    }

    showSuccessModal(certificateData) {
        const modal = document.getElementById('successModal');
        const certificateIdSpan = document.getElementById('certificateId');
        
        certificateIdSpan.textContent = certificateData.certificateId;
        modal.classList.remove('hidden');
    }

    setupModal() {
        const modal = document.getElementById('successModal');
        const closeButton = document.getElementById('closeModal');
        const downloadAgain = document.getElementById('downloadAgain');
        const generateNew = document.getElementById('generateNew');

        closeButton.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        downloadAgain.addEventListener('click', () => {
            if (this.currentCertificateData) {
                this.createCertificateCanvas(this.currentCertificateData);
            }
        });

        generateNew.addEventListener('click', () => {
            modal.classList.add('hidden');
            document.getElementById('certificateForm').reset();
            document.getElementById('photoPreview').classList.add('hidden');
            this.currentCertificateData = null;
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CertificateApp();
});// ...existing code...
templateImg.src = 'attached_assets/certificate-template_1753773632653.png'; // <-- Replace with your image path
// ...existing code...