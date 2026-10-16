// window.addEventListener('beforeunload', function (e) {
//     navigator.sendBeacon('backend/api/logout.php');
// });

let allBills = [];

    document.addEventListener("DOMContentLoaded", function() {
        fetchBills();
    });

    function fetchBills() {
        fetch('backend/api/get_bills.php')
            .then(response => response.json())
            .then(data => {
                allBills = data;
                displayBills(allBills);
            })
            .catch(error => {
                console.error('Error fetching bills:', error);
                document.getElementById('billsTableBody').innerHTML = `<tr><td colspan="6" class="no-data" style="color: #e53e3e;">Failed to load bill data.</td></tr>`;
            });
    }

    function displayBills(bills) {
        const tbody = document.getElementById('billsTableBody');
        tbody.innerHTML = '';

        if (bills.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">No bills found.</td></tr>`;
            return;
        }

        bills.forEach(bill => {
           
            let status = bill.payment_status || bill.status || 'Paid';
            let badgeClass = status.toLowerCase() === 'paid' ? 'badge-paid' : 'badge-pending';
            let statusBadge = `<span class="badge ${badgeClass}">${status}</span>`;

          
            let billNo = bill.bill_number || bill.bill_no || bill.id || bill.bill_id;
            let shopName = bill.shop_name ? ` (${bill.shop_name})` : '';

            let row = `
                <tr>
                    <td><strong>#${billNo}</strong>${shopName}</td>
                    <td>${bill.bill_date ?? '-'}</td>
                    <td>LKR ${Number(bill.total_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>LKR ${Number(bill.net_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>${bill.notes || '-'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

   
    function filterBills() {
        const searchText = document.getElementById('searchInput').value.toLowerCase();
        
        const filtered = allBills.filter(bill => {
            const billNo = String(bill.bill_no ?? bill.id ?? bill.bill_id).toLowerCase();
            const billDate = String(bill.bill_date || '').toLowerCase();
            const notes = String(bill.notes || '').toLowerCase();
            const shopName = String(bill.shop_name || '').toLowerCase();
            
            return billNo.includes(searchText) || 
                   billDate.includes(searchText) || 
                   notes.includes(searchText) || 
                   shopName.includes(searchText);
        });

        displayBills(filtered);
    }