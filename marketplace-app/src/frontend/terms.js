document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });
});
