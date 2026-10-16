
// Initialize expense date field with today's date
document.addEventListener('DOMContentLoaded', function () {
    const expenseDateField = document.getElementById('expense-date');
    if (expenseDateField && !expenseDateField.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        expenseDateField.value = `${year}-${month}-${day}`;
    }
});
