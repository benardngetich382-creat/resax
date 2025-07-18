// Initialize the jsPDF library
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Refresh data if viewing results tab
            if (tabId === 'view') {
                displayResults();
            }
        });
    });
    
    // Add subject functionality
    const addSubjectBtn = document.getElementById('addSubject');
    const subjectContainer = document.getElementById('subjectContainer');
    
    addSubjectBtn.addEventListener('click', () => {
        const newSubject = document.querySelector('.subject-entry').cloneNode(true);
        newSubject.querySelectorAll('input').forEach(input => input.value = '');
        subjectContainer.appendChild(newSubject);
        
        // Add event listener to remove button
        newSubject.querySelector('.remove-subject').addEventListener('click', () => {
            if (document.querySelectorAll('.subject-entry').length > 1) {
                newSubject.remove();
            } else {
                alert('You must have at least one learning area.');
            }
        });
    });
    
    // Add rubric range functionality
    const addRangeBtn = document.getElementById('addRange');
    const rubricRanges = document.getElementById('rubricRanges');
    
    addRangeBtn.addEventListener('click', () => {
        const newRange = document.querySelector('.rubric-range').cloneNode(true);
        newRange.querySelectorAll('input').forEach(input => input.value = '');
        rubricRanges.appendChild(newRange);
        
        // Add event listener to remove button
        newRange.querySelector('.remove-range').addEventListener('click', () => {
            if (document.querySelectorAll('.rubric-range').length > 1) {
                newRange.remove();
            } else {
                alert('You must have at least one rubric range.');
            }
        });
    });
    
    // Form submission for results
    const resultForm = document.getElementById('resultForm');
    resultForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const regNumber = document.getElementById('regNumber').value;
        const studentName = document.getElementById('studentName').value;
        const grade = document.getElementById('grade').value;
        
        const subjects = [];
        document.querySelectorAll('.subject-entry').forEach(entry => {
            const subject = entry.querySelector('.subject').value;
            const marks = parseFloat(entry.querySelector('.marks').value);
            const outOf = parseFloat(entry.querySelector('.outOf').value);
            
            subjects.push({
                subject,
                marks,
                outOf
            });
        });
        
        // Get existing results or initialize empty array
        let results = JSON.parse(localStorage.getItem('results')) || [];
        
        // Check if student already exists
        const existingIndex = results.findIndex(r => r.regNumber === regNumber && r.grade === grade);
        
        if (existingIndex >= 0) {
            // Update existing record
            results[existingIndex] = {
                regNumber,
                studentName,
                grade,
                subjects
            };
        } else {
            // Add new record
            results.push({
                regNumber,
                studentName,
                grade,
                subjects
            });
        }
        
        // Save to localStorage
        localStorage.setItem('results', JSON.stringify(results));
        
        // Calculate positions
        calculatePositions();
        
        alert('Results saved successfully!');
        resultForm.reset();
    });
    
    // Form submission for rubric settings
    const rubricForm = document.getElementById('rubricForm');
    rubricForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const rubricRanges = [];
        document.querySelectorAll('.rubric-range').forEach(range => {
            const from = parseFloat(range.querySelector('.from').value);
            const to = parseFloat(range.querySelector('.to').value);
            const score = parseFloat(range.querySelector('.score').value);
            const grade = range.querySelector('.grade').value;
            
            rubricRanges.push({
                from,
                to,
                score,
                grade
            });
        });
        
        // Save to localStorage
        localStorage.setItem('rubricRanges', JSON.stringify(rubricRanges));
        
        alert('Rubric settings saved successfully!');
        
        // Recalculate positions if results exist
        if (localStorage.getItem('results')) {
            calculatePositions();
        }
    });
    
    // Load rubric settings if they exist
    if (localStorage.getItem('rubricRanges')) {
        const savedRanges = JSON.parse(localStorage.getItem('rubricRanges'));
        const firstRange = document.querySelector('.rubric-range');
        
        // Clear existing ranges except the first one
        while (rubricRanges.children.length > 1) {
            rubricRanges.removeChild(rubricRanges.lastChild);
        }
        
        // Populate first range
        firstRange.querySelector('.from').value = savedRanges[0].from;
        firstRange.querySelector('.to').value = savedRanges[0].to;
        firstRange.querySelector('.score').value = savedRanges[0].score;
        firstRange.querySelector('.grade').value = savedRanges[0].grade;
        
        // Add additional ranges
        for (let i = 1; i < savedRanges.length; i++) {
            const newRange = firstRange.cloneNode(true);
            newRange.querySelector('.from').value = savedRanges[i].from;
            newRange.querySelector('.to').value = savedRanges[i].to;
            newRange.querySelector('.score').value = savedRanges[i].score;
            newRange.querySelector('.grade').value = savedRanges[i].grade;
            rubricRanges.appendChild(newRange);
            
            // Add event listener to remove button
            newRange.querySelector('.remove-range').addEventListener('click', () => {
                if (document.querySelectorAll('.rubric-range').length > 1) {
                    newRange.remove();
                } else {
                    alert('You must have at least one rubric range.');
                }
            });
        }
    }
    
    // Filter results functionality
    const filterGrade = document.getElementById('filterGrade');
    const searchStudent = document.getElementById('searchStudent');
    
    filterGrade.addEventListener('change', displayResults);
    searchStudent.addEventListener('input', displayResults);
    
    // Report generation grade selection
    const reportGrade = document.getElementById('reportGrade');
    const reportStudent = document.getElementById('reportStudent');
    
    reportGrade.addEventListener('change', function() {
        reportStudent.disabled = !this.value;
        
        if (this.value) {
            // Populate students dropdown
            const results = JSON.parse(localStorage.getItem('results')) || [];
            const gradeStudents = results.filter(r => r.grade === this.value);
            
            reportStudent.innerHTML = '<option value="">Select Student</option>';
            gradeStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.regNumber;
                option.textContent = `${student.studentName} (${student.regNumber})`;
                reportStudent.appendChild(option);
            });
        } else {
            reportStudent.innerHTML = '<option value="">Select a grade first</option>';
        }
    });
    
    // Generate single report
    const generateSingleReport = document.getElementById('generateSingleReport');
    generateSingleReport.addEventListener('click', function() {
        const regNumber = reportStudent.value;
        if (!regNumber) {
            alert('Please select a student');
            return;
        }
        
        generateReport(regNumber);
    });
    
    // Generate all reports for a grade
    const generateAllReports = document.getElementById('generateAllReports');
    generateAllReports.addEventListener('click', function() {
        const grade = reportGrade.value;
        if (!grade) {
            alert('Please select a grade');
            return;
        }
        
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const gradeStudents = results.filter(r => r.grade === grade);
        
        if (gradeStudents.length === 0) {
            alert('No students found for this grade');
            return;
        }
        
        if (confirm(`Generate reports for all ${gradeStudents.length} students in ${grade}?`)) {
            gradeStudents.forEach(student => {
                generateReport(student.regNumber, true);
            });
            alert('All reports generated successfully!');
        }
    });
    
    // Modal functionality
    const modal = document.getElementById('reportModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Download PDF button
    const downloadPdf = document.getElementById('downloadPdf');
    downloadPdf.addEventListener('click', generatePdf);
});

// Display results in the view tab
function displayResults() {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';
    
    const filterGrade = document.getElementById('filterGrade').value;
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    
    let results = JSON.parse(localStorage.getItem('results')) || [];
    
    // Apply filters
    if (filterGrade) {
        results = results.filter(r => r.grade === filterGrade);
    }
    
    if (searchTerm) {
        results = results.filter(r => 
            r.studentName.toLowerCase().includes(searchTerm) || 
            r.regNumber.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by grade and name
    results.sort((a, b) => {
        if (a.grade !== b.grade) {
            return a.grade.localeCompare(b.grade);
        }
        return a.studentName.localeCompare(b.studentName);
    });
    
    // Display results
    results.forEach(result => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${result.regNumber}</td>
            <td>${result.studentName}</td>
            <td>${result.grade}</td>
            <td>
                <button class="view-btn" data-reg="${result.regNumber}">View Details</button>
                <button class="report-btn" data-reg="${result.regNumber}">Generate Report</button>
            </td>
        `;
        
        resultsBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewStudentDetails(this.getAttribute('data-reg'));
        });
    });
    
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            generateReport(this.getAttribute('data-reg'));
        });
    });
}

// View student details
function viewStudentDetails(regNumber) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const student = results.find(r => r.regNumber === regNumber);
    
    if (!student) {
        alert('Student not found');
        return;
    }
    
    // Calculate averages and rubric scores
    const rubricRanges = JSON.parse(localStorage.getItem('rubricRanges')) || [];
    let totalRubricScore = 0;
    let subjectCount = 0;
    
    let detailsHTML = `
        <h3>${student.studentName} (${student.regNumber}) - ${student.grade}</h3>
        <table class="student-details">
            <thead>
                <tr>
                    <th>Learning Area</th>
                    <th>Marks</th>
                    <th>Out Of</th>
                    <th>Percentage</th>
                    <th>Rubric Score</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    student.subjects.forEach(subject => {
        const percentage = (subject.marks / subject.outOf) * 100;
        const rubricInfo = getRubricInfo(percentage, rubricRanges);
        
        detailsHTML += `
            <tr>
                <td>${subject.subject}</td>
                <td>${subject.marks}</td>
                <td>${subject.outOf}</td>
                <td>${percentage.toFixed(2)}%</td>
                <td>${rubricInfo.score}</td>
                <td>${rubricInfo.grade}</td>
            </tr>
        `;
        
        totalRubricScore += rubricInfo.score;
        subjectCount++;
    });
    
    const averageRubricScore = subjectCount > 0 ? (totalRubricScore / subjectCount).toFixed(2) : 0;
    
    detailsHTML += `
            </tbody>
        </table>
        <p><strong>Average Rubric Score:</strong> ${averageRubricScore}</p>
        <p><strong>Position in Class:</strong> ${student.position || 'Not calculated'}</p>
    `;
    
    // Show in modal
    const reportPreview = document.getElementById('reportPreview');
    reportPreview.innerHTML = detailsHTML;
    
    const modal = document.getElementById('reportModal');
    modal.style.display = 'block';
    
    // Hide download button for details view
    document.getElementById('downloadPdf').style.display = 'none';
}

// Generate report for a student
function generateReport(regNumber, silent = false) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const student = results.find(r => r.regNumber === regNumber);
    
    if (!student) {
        alert('Student not found');
        return;
    }
    
    const rubricRanges = JSON.parse(localStorage.getItem('rubricRanges')) || [];
    const gradeStudents = results.filter(r => r.grade === student.grade);
    
    // Calculate subject means
    const subjectMeans = {};
    const subjectCounts = {};
    
    gradeStudents.forEach(s => {
        s.subjects.forEach(sub => {
            if (!subjectMeans[sub.subject]) {
                subjectMeans[sub.subject] = 0;
                subjectCounts[sub.subject] = 0;
            }
            const percentage = (sub.marks / sub.outOf) * 100;
            subjectMeans[sub.subject] += percentage;
            subjectCounts[sub.subject]++;
        });
    });
    
    for (const subject in subjectMeans) {
        subjectMeans[subject] = subjectCounts[subject] > 0 ? subjectMeans[subject] / subjectCounts[subject] : 0;
    }
    
    // Generate report HTML
    let reportHTML = `
        <div class="report">
            <div class="report-header">
                <h2>SCHOOL EXAMINATION REPORT</h2>
                <p>${student.grade} - TERM 1, 2023</p>
            </div>
            
            <div class="student-info">
                <div>
                    <p><strong>Name:</strong> ${student.studentName}</p>
                    <p><strong>Registration No:</strong> ${student.regNumber}</p>
                </div>
                <div>
                    <p><strong>Grade:</strong> ${student.grade}</p>
                    <p><strong>Position:</strong> ${student.position || 'Not calculated'}</p>
                </div>
            </div>
            
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Learning Area</th>
                        <th>Marks Obtained</th>
                        <th>Out Of</th>
                        <th>Percentage</th>
                        <th>Rubric Score</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let totalRubricScore = 0;
    let subjectCount = 0;
    const chartData = {
        labels: [],
        studentScores: [],
        meanScores: []
    };
    
    student.subjects.forEach(subject => {
        const percentage = (subject.marks / subject.outOf) * 100;
        const rubricInfo = getRubricInfo(percentage, rubricRanges);
        
        reportHTML += `
            <tr>
                <td>${subject.subject}</td>
                <td>${subject.marks}</td>
                <td>${subject.outOf}</td>
                <td>${percentage.toFixed(2)}%</td>
                <td>${rubricInfo.score}</td>
                <td>${rubricInfo.grade}</td>
            </tr>
        `;
        
        totalRubricScore += rubricInfo.score;
        subjectCount++;
        
        // Add data for chart
        chartData.labels.push(subject.subject);
        chartData.studentScores.push(percentage);
        chartData.meanScores.push(subjectMeans[subject.subject] || 0);
    });
    
    const averageRubricScore = subjectCount > 0 ? (totalRubricScore / subjectCount).toFixed(2) : 0;
    
    reportHTML += `
                </tbody>
            </table>
            
            <p><strong>Average Rubric Score:</strong> ${averageRubricScore}</p>
            
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
            
            <div class="comments-section">
                <div class="comment-box">
                    <p><strong>Class Teacher's Comments:</strong></p>
                    <p>${getRandomComment(averageRubricScore)}</p>
                    <div class="signature-line">
                        <span>Signature: _________________________</span>
                        <span>Date: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="comment-box">
                    <p><strong>Principal's Comments:</strong></p>
                    <p>${getPrincipalComment(averageRubricScore)}</p>
                    <div class="signature-line">
                        <span>Signature: _________________________</span>
                        <span>Date: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="stamp-area">
                <p>OFFICIAL SCHOOL STAMP</p>
                <div style="height: 50px; border: 1px dashed #000; width: 150px;"></div>
            </div>
            
            <div class="footer-note">
                <p>This is a system generated report and is only valid with official school stamp.</p>
            </div>
        </div>
    `;
    
    // Show in modal
    const reportPreview = document.getElementById('reportPreview');
    reportPreview.innerHTML = reportHTML;
    
    // Create chart
    createPerformanceChart(chartData);
    
    const modal = document.getElementById('reportModal');
    modal.style.display = 'block';
    
    // Show d
