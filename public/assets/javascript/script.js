window.addEventListener('load', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await axios.get('/api/getUsername', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        document.getElementById('username').textContent = response.data.username;
    } catch (error) {
        console.error(error);
        // Handle error appropriately (e.g., redirect to login)
    }
});
