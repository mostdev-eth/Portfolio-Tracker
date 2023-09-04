// Function to save user input to the server
function saveData() {
    const ticker = document.getElementById('ticker').value;
    const price = document.getElementById('price').value;
    const value = document.getElementById('value').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;

    const data = {
        ticker: ticker,
        price: price,
        value: value,
        amount: amount,
        date: date
    };

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
                console.log("Data saved successfully.");
                // Clear input fields
                document.getElementById('ticker').value = '';
                document.getElementById('price').value = '';
                document.getElementById('value').value = '';
                document.getElementById('amount').value = '';
                document.getElementById('date').value = '';
            } else {
                console.error("Error saving data:", data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
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
    fetch('/getData')
        .then(response => response.json())
        .then(transactionsData => {
            return fetch('prices.json')
                .then(response => response.json())
                .then(pricesData => {
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
                            cell6.innerHTML = ((pricesData.data[transaction.ticker].quote.USD.price * transaction.amount) - (transaction.price * transaction.amount)).toFixed(2); // P/L calculation

                            totalValue += parseFloat(transaction.value);
                            totalAmount += parseFloat(transaction.amount);
                            totalPL += (pricesData.data[transaction.ticker].quote.USD.price * transaction.amount) - (transaction.price * transaction.amount);
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
                        summaryValuesRow.insertCell(4).innerHTML = (totalAmount * pricesData.data[ticker].quote.USD.price).toFixed(2);;
                        summaryValuesRow.insertCell(5).innerHTML = totalPL.toFixed(2);

                        portfoliosDiv.appendChild(table);
                    }
                });
        })
        .catch(error => {
            console.error("Error populating tables:", error);
        });
}



// Add event listeners or other initialization logic if needed
document.addEventListener('DOMContentLoaded', function () {
    // This will run when the page is fully loaded
    refreshPrices(); // Initial load of prices
});
