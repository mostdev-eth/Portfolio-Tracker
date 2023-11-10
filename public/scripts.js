// Function to save user input to the server
function saveData() {
    // Get input values
    const ticker = document.getElementById('ticker').value;
    const price = document.getElementById('price').value;
    const value = document.getElementById('value').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;

    // Check if any input is empty
    if (!ticker || !price || !value || !amount || !date) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Please fill out all the fields!";
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 4000); // Hide error message after 4 seconds
        return; // Exit function if any input is empty
    }

    // Prepare data object
    const data = {
        ticker: ticker,
        price: price,
        value: value,
        amount: amount,
        date: date
    };

    // Send data to server using fetch
    fetch('/saveData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Show success message
                const successMessage = document.getElementById('success-message');
                successMessage.textContent = "Data saved successfully!";
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 4000); // Hide success message after 4 seconds

                // Clear input fields
                document.getElementById('ticker').value = '';
                document.getElementById('price').value = '';
                document.getElementById('value').value = '';
                document.getElementById('amount').value = '';
                document.getElementById('date').value = '';
            } else {
                // Show error message from server
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = "Error saving data: " + data.message;
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 4000); // Hide error message after 4 seconds
            }
        })
        .catch(error => {
            // Show error message if fetch fails
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = "Error: " + error;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 4000); // Hide error message after 4 seconds
        });
}


// Function to refresh prices from the CoinMarketCap API
function refreshPrices() {
    fetch('/getData')
        .then(response => response.json())
        .then(data => {
            const tickers = data.map(item => item.ticker).join(',');
            return fetch(`/getPrices?tickers=${tickers}`);
        })
        .then(response => response.json())
        .then(pricesData => {
            populateDashboard(pricesData); // Use the populateDashboard function here
        })
        .catch(error => {
            console.error("Error fetching prices:", error);
        });
}

// Function to populate the dashboard with current prices
function populateDashboard(pricesData) {
    const dashboardTable = document.getElementById('dashboardTable');

    // Clear any existing rows
    dashboardTable.innerHTML = '';

    // Iterate over the pricesData object
    for (let ticker in pricesData.data) {
        const price = pricesData.data[ticker].quote.USD.price;

        // Create a new row and cells
        const row = dashboardTable.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);

        // Populate the cells with ticker and price
        cell1.textContent = ticker;
        cell2.textContent = `$${price.toFixed(2)}`;  // Format the price to 2 decimal places
    }
}

// Function to populate the portfolios section with tables for each ticker
function populateTables() {
    console.log("Populating tables..."); // Add this line
    fetch('/getData')
        .then(response => response.json())
        .then(transactionsData => {
            fetch('prices.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    return response.json();
                })
                .then(pricesData => {
                    console.log("prices data = ", pricesData);
                    // Check if 'BTC' data is present in pricesData
                    if (pricesData && pricesData.data && pricesData.data.BTC) {
                        const portfoliosDiv = document.getElementById('portfolios');
                        portfoliosDiv.innerHTML = ''; // Clear the portfolios section

                        // Group transactions by ticker
                        let groupedTransactions = {};
                        transactionsData.forEach(transaction => {
                            if (!groupedTransactions[transaction.ticker]) {
                                groupedTransactions[transaction.ticker] = [];
                            }
                            groupedTransactions[transaction.ticker].push(transaction);
                        });

                        // Variables for summary section
                        let Invested = 0;
                        let PresentValue = 0;
                        let Profit = 0;

                        for (let ticker in groupedTransactions) {
                            // Create a title for the table using the ticker
                            const currentPrice = pricesData.data[ticker].quote.USD.price.toFixed(2);
                            const tableTitle = document.createElement('h3');
                            tableTitle.textContent = `${ticker} - $${currentPrice}`; // Updated to include current price
                            portfoliosDiv.appendChild(tableTitle); // Append the title to the portfoliosDiv

                            const table = document.createElement('table');
                            const headerRow = table.insertRow();
                            headerRow.innerHTML = '<th>Ticker</th><th>Price ATB</th><th>Cost</th><th>Amount</th><th>Date</th><th>P/L</th>';

                            let totalValue = 0;
                            let totalAmount = 0;
                            let totalPL = 0;
                            let totalPrice = 0;

                            groupedTransactions[ticker].forEach(transaction => {
                                const dataRow = table.insertRow();
                                const cell1 = dataRow.insertCell(0);
                                const cell2 = dataRow.insertCell(1);
                                const cell3 = dataRow.insertCell(2);
                                const cell4 = dataRow.insertCell(3);
                                const cell5 = dataRow.insertCell(4);
                                const cell6 = dataRow.insertCell(5);

                                cell1.innerHTML = transaction.ticker;
                                cell2.innerHTML = transaction.price;
                                cell3.innerHTML = transaction.value;
                                cell4.innerHTML = transaction.amount;
                                cell5.innerHTML = transaction.date;

                                // Calculate P/L and set cell content
                                const pl = ((pricesData.data[transaction.ticker].quote.USD.price * transaction.amount) - (transaction.price * transaction.amount)).toFixed(2);
                                const plPercentage = ((pl * 100) / transaction.value).toFixed(2); // Calculate P/L percentage
                                cell6.innerHTML = `${pl} (${plPercentage}%)`;

                                // Set color based on P/L
                                if (pl < 0) {
                                    cell6.style.color = 'red'; // Set text color to red for negative P/L
                                } else {
                                    cell6.style.color = 'green'; // Set text color to green for positive or zero P/L
                                }

                                totalValue += parseFloat(transaction.value);
                                totalAmount += parseFloat(transaction.amount);
                                totalPL += parseFloat(pl);
                                totalPrice += parseFloat(transaction.price);
                            });

                            // Summary Description Row
                            const summaryDescRow = table.insertRow();
                            summaryDescRow.classList.add('summary-row');  // Add the class here
                            summaryDescRow.innerHTML = '<td>Summary</td><td>Average Price</td><td>Total Cost</td><td>Total Amount</td><td>Current Value</td><td>Total P/L</td>';

                            // Summary Values Row
                            const summaryValuesRow = table.insertRow();
                            summaryValuesRow.classList.add('summary-row');  // Add the class here
                            summaryValuesRow.insertCell(0).innerHTML = '';
                            summaryValuesRow.insertCell(1).innerHTML = (totalPrice / groupedTransactions[ticker].length).toFixed(2);
                            summaryValuesRow.insertCell(2).innerHTML = totalValue.toFixed(2);
                            summaryValuesRow.insertCell(3).innerHTML = totalAmount;
                            summaryValuesRow.insertCell(4).innerHTML = (totalAmount * pricesData.data[ticker].quote.USD.price).toFixed(2);
                            const totalPLPercentage = ((totalPL * 100) / totalValue).toFixed(2); // Calculate total P/L percentage
                            summaryValuesRow.insertCell(5).innerHTML = `${totalPL.toFixed(2)} (${totalPLPercentage}%)`;

                            // Set color based on total P/L
                            if (totalPL < 0) {
                                summaryValuesRow.cells[5].style.color = 'red'; // Set text color to red for negative total P/L
                            } else {
                                summaryValuesRow.cells[5].style.color = 'green'; // Set text color to green for positive or zero total P/L
                            }

                            portfoliosDiv.appendChild(table);

                            // Update global variables for summary section
                            Invested += totalValue;
                            PresentValue += totalAmount * pricesData.data[ticker].quote.USD.price;
                            Profit += parseFloat(totalPL);
                        }

                        // Update total summary section with current values
                        const statsTable = document.getElementById('statsTable');
                        const investedCell = statsTable.rows[0].cells[1];
                        const presentValueCell = statsTable.rows[1].cells[1];
                        const profitCell = statsTable.rows[2].cells[1];

                        investedCell.textContent = `${Invested.toFixed(2)}`;
                        presentValueCell.textContent = PresentValue.toFixed(2);
                        profitCell.textContent = `${Profit.toFixed(2)} (${((Profit * 100) / Invested).toFixed(2)}%)`;

                        // Color coding for Profit in total summary section
                        profitCell.style.color = Profit < 0 ? 'red' : 'green'; // Set text color based on Profit value

                        // Display summary section
                        const statsSection = document.getElementById('statsSection');
                        statsSection.style.display = 'block'; // Make the section visible after populating tables
                    } else {
                        console.error("Error: 'BTC' data not found in prices.json");
                    }
                })
                .catch(error => {
                    console.error("Error parsing prices.json:", error);
                });
        })
        .catch(error => {
            console.error("Error fetching transactions data:", error);
        });
}










// Function to create the portfolio value graph
async function createPortfolioValueGraph() {
    try {
        // Fetch transactions data
        const transactionsResponse = await fetch('/getData');
        const transactionsData = await transactionsResponse.json();

        // Fetch prices data
        const pricesResponse = await fetch('prices.json');
        const pricesData = await pricesResponse.json();

        // Prepare data for the graph
        const graphData = [];
        const currentValueData = []; // Y-axis data for current portfolio value
        const purchaseValueData = []; // Y-axis data for portfolio value at purchase

        let totalInvestment = 0;
        let totalCurrentValue = 0;

        // Group transactions by date and calculate total investment and current value on each date
        const groupedTransactions = groupTransactionsByDate(transactionsData);
        for (const date in groupedTransactions) {
            const dateTransactions = groupedTransactions[date];
            const dateTotalInvestment = dateTransactions.reduce((total, transaction) => {
                const transactionValue = transaction.amount * transaction.price;
                return total + transactionValue;
            }, 0);
            totalInvestment += dateTotalInvestment;
            const dateTotalCurrentValue = dateTransactions.reduce((total, transaction) => {
                const currentValue = transaction.amount * parseFloat(pricesData.data[transaction.ticker].quote.USD.price);
                return total + currentValue;
            }, 0);
            totalCurrentValue += dateTotalCurrentValue;

            const formattedDate = new Date(date).toLocaleDateString();
            graphData.push({ date: formattedDate, value: totalInvestment.toFixed(2) });
            currentValueData.push(totalCurrentValue.toFixed(2));
            purchaseValueData.push(totalInvestment.toFixed(2));
        }

        // Calculate chart height as 60% of the screen height
        const screenHeight = window.innerHeight;
        const chartHeight = screenHeight * 0.6;

        // Set the height of the chartSection div
        const chartSection = document.getElementById('chartSection');
        chartSection.style.height = `${chartHeight}px`;

        // Draw the graph using Chart.js with custom height


        const ctx = document.getElementById('portfolioValueChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: graphData.map(item => item.date),
                datasets: [{
                    label: 'Portfolio Value',
                    data: currentValueData,
                    backgroundColor: 'rgba(70, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }, {
                    label: 'Purchase Value',
                    data: purchaseValueData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'right', // Place y-axis to the right
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                },
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                layout: {
                    padding: {
                        bottom: 20 // Add bottom padding to the legend
                    }
                },
                aspectRatio: 10,
                height: chartHeight
            }
        });


    } catch (error) {
        console.error("Error creating portfolio value graph:", error);
    }
}


function toggleChartVisibility() {
    const chartSection = document.getElementById('chartSection');
    const arrowIcon = document.getElementById('arrowIcon');

    if (chartSection.style.display === 'none' || chartSection.style.display === '') {
        chartSection.style.display = 'block';
        createPortfolioValueGraph(); // Generate chart when it's visible
        arrowIcon.textContent = '▼'; // Down arrow indicating expanded state
    } else {
        chartSection.style.display = 'none';
        arrowIcon.textContent = '►'; // Right arrow indicating collapsed state
    }
}


// function toggleChartVisibility() {
//     const chartSection = document.getElementById('chartSection');
//     chartSection.style.maxHeight = chartSection.style.maxHeight === '0px' ? '500px' : '0';
// }

// Helper function to group transactions by date
function groupTransactionsByDate(transactions) {
    return transactions.reduce((grouped, transaction) => {
        const date = transaction.date.split('T')[0]; // Extracting date without time
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(transaction);
        return grouped;
    }, {});
}

// Call the functions when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    refreshPrices(); // Automatically refresh prices when the page is loaded

    document.getElementById('populateTablesBtn').addEventListener('click', () => {
        populateTables();
        createPortfolioValueGraph(); // Generate chart after populating tables
    });

    document.getElementById('refreshPricesBtn').addEventListener('click', () => {
        refreshPrices();
    });

    // Refresh prices every 60 seconds
    // setInterval(refreshPrices, 60000);
});
