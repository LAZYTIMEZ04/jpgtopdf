
        let selectedFiles = [];
        
        // Setup file input handler
        document.getElementById('fileInput').addEventListener('change', handleFiles);
        
        // Setup drag and drop
        const uploadArea = document.querySelector('.upload-area');
        
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
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                handleFileArray(files);
            }
        });
        
        function handleFiles(event) {
            const files = Array.from(event.target.files);
            handleFileArray(files);
        }
        
        function handleFileArray(files) {
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    selectedFiles.push({
                        file: file,
                        id: Date.now() + Math.random()
                    });
                }
            });
            updatePreview();
            updateFileCount();
            updateConvertButton();
        }
        
        function updatePreview() {
            const previewGrid = document.getElementById('previewGrid');
            previewGrid.innerHTML = '';
            
            selectedFiles.forEach((fileObj, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button class="remove-btn" onclick="removeFile(${fileObj.id})">×</button>
                    `;
                    previewGrid.appendChild(previewItem);
                };
                reader.readAsDataURL(fileObj.file);
            });
        }
        
        function updateFileCount() {
            const fileCount = document.getElementById('fileCount');
            const count = selectedFiles.length;
            if (count > 0) {
                fileCount.textContent = `เลือกไฟล์แล้ว ${count} ไฟล์`;
                fileCount.style.display = 'block';
            } else {
                fileCount.style.display = 'none';
            }
        }
        
        function updateConvertButton() {
            const convertBtn = document.getElementById('convertBtn');
            convertBtn.disabled = selectedFiles.length === 0;
        }
        
        function removeFile(id) {
            selectedFiles = selectedFiles.filter(fileObj => fileObj.id !== id);
            updatePreview();
            updateFileCount();
            updateConvertButton();
        }
        
        function clearAll() {
            selectedFiles = [];
            document.getElementById('fileInput').value = '';
            updatePreview();
            updateFileCount();
            updateConvertButton();
        }
        
        function showProgress() {
            document.getElementById('progressBar').style.display = 'block';
        }
        
        function hideProgress() {
            document.getElementById('progressBar').style.display = 'none';
        }
        
        function updateProgress(percent) {
            document.getElementById('progressFill').style.width = percent + '%';
        }
        
        async function convertToPDF() {
            if (selectedFiles.length === 0) return;
            
            const convertBtn = document.getElementById('convertBtn');
            convertBtn.disabled = true;
            convertBtn.innerHTML = '⏳ กำลังแปลง...';
            
            showProgress();
            
            try {
                const { jsPDF } = window.jspdf;
                const pageSize = document.getElementById('pageSize').value;
                const orientation = document.getElementById('orientation').value;
                const quality = parseFloat(document.getElementById('quality').value);
                const pdfName = document.getElementById('pdfName').value || 'my-images';
                
                const pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: pageSize
                });
                
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const availableWidth = pageWidth - (margin * 2);
                const availableHeight = pageHeight - (margin * 2);
                
                for (let i = 0; i < selectedFiles.length; i++) {
                    const fileObj = selectedFiles[i];
                    
                    // Update progress
                    const progress = ((i + 1) / selectedFiles.length) * 100;
                    updateProgress(progress);
                    
                    // Add new page for each image (except first)
                    if (i > 0) {
                        pdf.addPage();
                    }
                    
                    try {
                        const imageData = await getImageData(fileObj.file, quality);
                        const img = new Image();
                        
                        await new Promise((resolve, reject) => {
                            img.onload = () => {
                                try {
                                    const imgWidth = img.width;
                                    const imgHeight = img.height;
                                    const imgRatio = imgWidth / imgHeight;
                                    const pageRatio = availableWidth / availableHeight;
                                    
                                    let finalWidth, finalHeight;
                                    
                                    if (imgRatio > pageRatio) {
                                        // Image is wider relative to page
                                        finalWidth = availableWidth;
                                        finalHeight = availableWidth / imgRatio;
                                    } else {
                                        // Image is taller relative to page
                                        finalHeight = availableHeight;
                                        finalWidth = availableHeight * imgRatio;
                                    }
                                    
                                    const x = margin + (availableWidth - finalWidth) / 2;
                                    const y = margin + (availableHeight - finalHeight) / 2;
                                    
                                    pdf.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight);
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            img.onerror = reject;
                            img.src = imageData;
                        });
                        
                    } catch (error) {
                        console.error('Error processing image:', error);
                    }
                    
                    // Small delay to prevent browser freezing
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Save PDF
                pdf.save(`${pdfName}.pdf`);
                
                // Show success message
                convertBtn.innerHTML = '✅ แปลงสำเร็จ!';
                setTimeout(() => {
                    convertBtn.innerHTML = '📄 แปลงเป็น PDF';
                    convertBtn.disabled = false;
                }, 2000);
                
            } catch (error) {
                console.error('Error creating PDF:', error);
                convertBtn.innerHTML = '❌ เกิดข้อผิดพลาด';
                setTimeout(() => {
                    convertBtn.innerHTML = '📄 แปลงເป็น PDF';
                    convertBtn.disabled = false;
                }, 2000);
            }
            
            hideProgress();
        }
        
        function getImageData(file, quality) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.drawImage(img, 0, 0);
                        
                        const dataURL = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataURL);
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }