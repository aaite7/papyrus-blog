/*------------------------------------------------------------------
[Dark Mode Logic]

Project:    Minimalist Blog
Author:     Your Name or Team
Version:    1.0
-------------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('dark-mode-toggle');
    const body = document.body;

    if (!toggleButton) {
        console.error("Dark mode toggle button not found. Make sure an element with id='dark-mode-toggle' exists.");
        return;
    }

    // Function to apply the saved theme
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            toggleButton.textContent = '☀'; // Sun icon for light mode
        } else {
            body.classList.remove('dark-mode');
            toggleButton.textContent = '☾'; // Moon icon for dark mode
        }
    };

    // Check for a saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // If no theme is saved, check the user's OS preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Event listener for the toggle button
    toggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        applyTheme(newTheme);
        // Save the user's preference to localStorage
        localStorage.setItem('theme', newTheme);
    });

    // Listen for changes in OS theme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        const newTheme = event.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
});
