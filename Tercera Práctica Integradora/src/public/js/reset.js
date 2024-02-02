const form = document.getElementById('resetForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const obj = {};
    data.forEach((value, key) => obj[key] = value);
    const responseUser= await fetch('/api/users/reset', {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    });
       if (responseUser.ok) { window.location.replace('/')}; 
        }
        )