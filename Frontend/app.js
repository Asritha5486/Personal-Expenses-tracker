// frontend/app.js - FINAL COMPLETE VERSION

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = authToken ? 'block' : 'none';

    // 1. Check API Status (Server & DB)
    checkApiStatus();

    // 2. Initial Setup based on login status
    if (authToken) {
        showDashboard();
        fetchAndRenderCharts();
    } else {
        showLogin();
    }
    
    // 3. Setup Event Listeners
    document.getElementById('login-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});

// --- UI Management ---

function showLogin() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('transaction-manager').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
}

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('transaction-manager').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'block';
}

// --- API Status Check ---

// frontend/app.js (Inside checkApiStatus function)

async function checkApiStatus() {
    const statusElement = document.getElementById('api-status');
    try {
        const response = await fetch(`${API_BASE_URL}/test`);
        const data = await response.json();
        
        statusElement.textContent = `API Status: ${data.message}`;
        
        // FIX: Change successful color to WHITE for high contrast against the dark header
        statusElement.style.color = data.status === 'ok' ? 'white' : 'red'; 
        
    } catch (error) {
        statusElement.textContent = 'API Status: Connection Failed! Is Node.js Server Running?';
        // Use a high-contrast red for failure
        statusElement.style.color = 'red';
    }
}

// --- Authentication & Transaction Logic ---

async function handleAuthSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const isRegister = document.getElementById('auth-mode').value === 'register';
    const endpoint = isRegister ? 'register' : 'login';
    const userData = { 
        username: form.elements['username-auth'].value, 
        password: form.elements['password-auth'].value 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/users/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();

        if (response.ok) {
            if (!isRegister) {
                authToken = data.token;
                localStorage.setItem('token', authToken);
                alert('Login Successful!');
                showDashboard();
                fetchAndRenderCharts();
            } else {
                alert('Registration Successful! Please log in.');
                document.getElementById('auth-mode').value = 'login';
            }
        } else {
            alert(`Authentication Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Auth request failed:', error);
        alert('Could not connect to the authentication server.');
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('token');
    alert('Logged out.');
    showLogin();
}

async function handleTransactionSubmit(event) {
    event.preventDefault();
    if (!authToken) return alert('Please log in to submit transactions.');

    const form = event.target;
    const newTransaction = {
        amount: parseFloat(form.amount.value),
        type: form.type.value,
        category: form.category.value,
        description: form.description.value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(newTransaction),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            form.reset();
            fetchAndRenderCharts();
        } else {
            alert(`Error logging transaction: ${data.message}`);
        }
    } catch (error) {
        console.error('Transaction failed:', error);
        alert('Transaction failed due to server error.');
    }
}


// --- D3 Fetching and Rendering ---

function updateKPIs(monthlySummaryData) {
    // Get the data for the current month (last item in the sorted array)
    const currentMonthData = monthlySummaryData.length > 0 ? monthlySummaryData[monthlySummaryData.length - 1] : { total_income: 0, total_expense: 0 };
    
    // Data is guaranteed to be parsed floats here
    const income = currentMonthData.total_income;
    const expense = currentMonthData.total_expense;
    const netBalance = income - expense;

    const netBalanceEl = document.getElementById('net-balance');
    const totalExpenseEl = document.getElementById('total-expense');
    const totalIncomeEl = document.getElementById('total-income');

    // Update text content
    netBalanceEl.textContent = `$${netBalance.toFixed(2)}`;
    totalExpenseEl.textContent = `$${expense.toFixed(2)}`;
    totalIncomeEl.textContent = `$${income.toFixed(2)}`;

    // Update colors
    netBalanceEl.className = netBalance >= 0 ? 'amount positive' : 'amount negative';
}


async function fetchAndRenderCharts() {
    if (!authToken) return;

    try {
        const headers = { 'Authorization': `Bearer ${authToken}` };
        
        // 1. Fetch Pie Chart Data (Category Breakdown)
        const breakdownResponse = await fetch(`${API_BASE_URL}/reports/category-breakdown`, { headers });
        const breakdownData = await breakdownResponse.json();

        // 2. Fetch Bar Chart Data (Monthly Summary)
        const summaryResponse = await fetch(`${API_BASE_URL}/reports/monthly-summary`, { headers });
        let summaryData = await summaryResponse.json();

        // **CRITICAL FIX:** Ensure all numerical data is parsed from string to float
        summaryData.forEach(d => {
            d.total_income = parseFloat(d.total_income) || 0;
            d.total_expense = parseFloat(d.total_expense) || 0;
        });

        // 3. Render all components
        updateKPIs(summaryData);
        renderPieChart(breakdownData);
        renderBarChart(summaryData);
        
    } catch (error) {
        console.error('Failed to fetch report data:', error);
    }
}


/**
 * Renders the Pie Chart for Category Breakdown (With Labels)
 */
function renderPieChart(data) {
    d3.select("#pie-chart").selectAll("*").remove(); 
    
    if (data.length === 0) {
        d3.select("#pie-chart").append("text").attr("x", 150).attr("y", 150).attr("text-anchor", "middle").text("No Expense Data Found.");
        return;
    }

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select("#pie-chart")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .value(d => parseFloat(d.total_spent))
        .sort(null); 

    const data_ready = pie(data);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.category))
        .range(d3.schemeCategory10);

    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius * 0.8);
    
    // Build slices and tooltips
    svg
        .selectAll('slices')
        .data(data_ready)
        .join('path')
        .attr('d', arcGenerator)
        .attr('fill', d => color(d.data.category))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.8)
        .append("title") 
        .text(d => `${d.data.category}: $${parseFloat(d.data.total_spent).toFixed(2)}`);

    // Add labels (Category names)
    svg
        .selectAll('allLabels')
        .data(data_ready)
        .join('text')
        .text(d => d.data.category) 
        .attr("transform", d => {
             // Position text slightly offset from the center of the arc
             const pos = arcGenerator.centroid(d);
             const midAngle = Math.atan2(pos[1], pos[0]);
             const x = Math.cos(midAngle) * (radius * 0.75);
             const y = Math.sin(midAngle) * (radius * 0.75);
             return `translate(${x},${y})`;
        })
        .style("text-anchor", "middle")
        .style("font-size", 10)
        .style("font-weight", "bold")
        .style("fill", "black"); // Black text stands out against color slices
}


/**
 * Renders the Bar Chart for Monthly Summary (Income vs. Expense)
 */
function renderBarChart(data) {
    d3.select("#bar-chart").selectAll("*").remove(); 
    
    if (data.length === 0 || data.length === 1) {
        d3.select("#bar-chart").append("text").attr("x", 150).attr("y", 150).attr("text-anchor", "middle").text("Need more monthly history for comparison.");
        return;
    }
    
    const margin = {top: 20, right: 20, bottom: 40, left: 50};
    const containerWidth = 450;
    const containerHeight = 350;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select("#bar-chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Data structure for grouped bars
    const keys = ['total_income', 'total_expense'];
    
    // Scale Y (Max value for Y axis)
    const yMax = d3.max(data, d => Math.max(d.total_income, d.total_expense));
    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .range([height, 0]);
    
    // Scale X (Months) - Band scale for groups (months)
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.2);

    // Scale X Sub (Inside each month group) - Band scale for subgroups (income/expense)
    const xSubScale = d3.scaleBand()
        .domain(keys)
        .range([0, xScale.bandwidth()])
        .padding(0.05);
    
    // Color Scale
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#43a047', '#e53935']); // Income (Green), Expense (Red)

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Y Axis
    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format("$.2s"))); // Format currency

    // Draw the Grouped Bars
    const group = svg.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${xScale(d.month)}, 0)`);

    group.selectAll("rect")
        .data(d => keys.map(key => ({key, value: d[key], month: d.month})))
        .join("rect")
            .attr("x", d => xSubScale(d.key))
            .attr("y", d => yScale(d.value))
            .attr("width", xSubScale.bandwidth())
            .attr("height", d => height - yScale(d.value))
            .attr("fill", d => color(d.key))
            .append("title")
            .text(d => `${d.key.replace('total_', '')} (${d.month}): $${d.value.toFixed(2)}`);

    // Add Legend
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d.key.replace('total_', '').toUpperCase());
}