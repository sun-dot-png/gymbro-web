const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const savetheme = localStorage.getItem('theme');

if (savetheme === 'light'){
    document.body.classList.add('light-mode');
    themeIcon.textContent = '☀️';
}else{
    document.body.classList.remove('light-mode');
    themeIcon.textContent = '🌙';
}


themeToggleBtn.addEventListener('click', () => {
    
    document.body.classList.toggle('light-mode');

    if (document.body.classList.contains('light-mode')) {
        themeIcon.textContent = '☀️'; 
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
});
