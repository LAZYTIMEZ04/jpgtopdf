function toggleNav() {
            const nav = document.getElementById('navSidebar');
            const overlay = document.getElementById('navOverlay');
            
            nav.classList.toggle('show');
            overlay.classList.toggle('show');
        }

        function closeNav() {
            const nav = document.getElementById('navSidebar');
            const overlay = document.getElementById('navOverlay');
            
            nav.classList.remove('show');
            overlay.classList.remove('show');
        }

        // Handle file input
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const files = e.target.files;
            const fileCount = document.getElementById('fileCount');
            const previewGrid = document.getElementById('previewGrid');
            const convertBtn = document.getElementById('convertBtn');
            
            if (files.length > 0) {
                fileCount.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-check-circle me-2"></i>เลือกไฟล์แล้ว ${files.length} ไฟล์</div>`;
                convertBtn.disabled = false;
                
                // Clear previous previews
                previewGrid.innerHTML = '';
                
                // Show file previews
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const div = document.createElement('div');
                            div.className = 'col-md-3 col-sm-6 mb-3';
                            div.innerHTML = `
                                <div class="card h-100">
                                    <div class="position-relative">
                                        <img src="${e.target.result}" class="card-img-top" style="height: 200px; object-fit: cover;">
                                        <div class="position-absolute top-0 end-0 m-2">
                                            <span class="badge bg-primary">${index + 1}</span>
                                        </div>
                                    </div>
                                    <div class="card-body p-2">
                                        <small class="text-muted d-block text-truncate" title="${file.name}">
                                            <i class="fa-solid fa-image me-1"></i>${file.name}
                                        </small>
                                        <small class="text-success">
                                            <i class="fa-solid fa-weight-scale me-1"></i>${(file.size / 1024 / 1024).toFixed(2)} MB
                                        </small>
                                    </div>
                                </div>
                            `;
                            previewGrid.appendChild(div);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                previewGrid.className = 'row mt-3';
            } else {
                fileCount.innerHTML = '';
                previewGrid.innerHTML = '';
                convertBtn.disabled = true;
            }
        });

        // Clear all files
        function clearAll() {
            document.getElementById('fileInput').value = '';
            document.getElementById('fileCount').innerHTML = '';
            document.getElementById('previewGrid').innerHTML = '';
            document.getElementById('convertBtn').disabled = true;
            document.getElementById('progressContainer').style.display = 'none';
        }

        // Convert to PDF function
        async function convertToPDF() {
            const files = document.getElementById('fileInput').files;
            const pageSize = document.getElementById('pageSize').value;
            const orientation = document.getElementById('orientation').value;
            const quality = parseFloat(document.getElementById('quality').value);
            const pdfName = document.getElementById('pdfName').value || 'my-images';
            
            if (files.length === 0) {
                alert('กรุณาเลือกไฟล์รูปภาพก่อน');
                return;
            }

            // Show progress bar
            const progressContainer = document.getElementById('progressContainer');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const convertBtn = document.getElementById('convertBtn');
            
            progressContainer.style.display = 'block';
            convertBtn.disabled = true;
            
            try {
                // Initialize jsPDF
                const { jsPDF } = window.jspdf;
                
                // Set page dimensions based on size and orientation
                const pageSizes = {
                    'a4': [210, 297],
                    'a3': [297, 420],
                    'letter': [216, 279],
                    'legal': [216, 356]
                };
                
                let [width, height] = pageSizes[pageSize];
                if (orientation === 'landscape') {
                    [width, height] = [height, width];
                }
                
                const pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: pageSize
                });

                // Process each image
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // Update progress
                    const progress = ((i + 1) / files.length) * 90; // 90% for processing, 10% for download
                    progressFill.style.width = progress + '%';
                    progressText.textContent = Math.round(progress) + '%';
                    
                    if (file.type.startsWith('image/')) {
                        // Convert file to base64
                        const base64 = await fileToBase64(file);
                        
                        // Create image element to get dimensions
                        const img = new Image();
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.src = base64;
                        });
                        
                        // Calculate image dimensions to fit page
                        const imgWidth = img.width;
                        const imgHeight = img.height;
                        const ratio = Math.min((width - 20) / imgWidth, (height - 20) / imgHeight);
                        
                        const finalWidth = imgWidth * ratio;
                        const finalHeight = imgHeight * ratio;
                        
                        // Center the image on page
                        const x = (width - finalWidth) / 2;
                        const y = (height - finalHeight) / 2;
                        
                        // Add new page for each image (except first)
                        if (i > 0) {
                            pdf.addPage();
                        }
                        
                        // Add image to PDF
                        pdf.addImage(base64, 'JPEG', x, y, finalWidth, finalHeight, '', 'MEDIUM');
                        
                        // Small delay to prevent browser freezing
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // Final progress update
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                
                // Download the PDF
                await new Promise(resolve => setTimeout(resolve, 300));
                pdf.save(`${pdfName}.pdf`);
                
                // Success message
                setTimeout(() => {
                    alert(`✅ แปลงและดาวน์โหลดสำเร็จ!\n\nไฟล์: ${pdfName}.pdf\nจำนวนหน้า: ${files.length}\nขนาด: ${pageSize.toUpperCase()}\nการจัดวาง: ${orientation === 'portrait' ? 'แนวตั้ง' : 'แนวนอน'}`);
                    
                    // Reset progress bar
                    progressContainer.style.display = 'none';
                    progressFill.style.width = '0%';
                    progressText.textContent = '0%';
                    convertBtn.disabled = false;
                }, 500);
                
            } catch (error) {
                console.error('Error converting to PDF:', error);
                alert('เกิดข้อผิดพลาดในการแปลงไฟล์ กรุณาลองใหม่อีกครั้ง');
                
                // Reset progress bar on error
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
                convertBtn.disabled = false;
            }
        }

        // Helper function to convert file to base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Handle drag and drop
        const uploadArea = document.querySelector('.upload-area');
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#4f46e5';
            this.style.background = '#f0f9ff';
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ccc';
            this.style.background = '#f9fafb';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ccc';
            this.style.background = '#f9fafb';
            
            const files = e.dataTransfer.files;
            document.getElementById('fileInput').files = files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            document.getElementById('fileInput').dispatchEvent(event);
        });
