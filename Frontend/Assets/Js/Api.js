const API_URL = 'http://127.0.0.1:5000/api';

window.AppAPI = {
    signupUser: async function(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Could not connect to the server.' };
        }
    },
    loginUser: async function(email, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Could not connect to the server.' };
        }
    },
    getSummary: async function(options) {
        const formData = new FormData();
        
        // Append text or file, but not both
        if (options.file) {
            formData.append('file', options.file);
        } else if (options.text) {
            formData.append('text', options.text);
        }
        
        // Append all other options
        formData.append('format', options.format);
        formData.append('language', options.language);
        formData.append('length', options.length);

        try {
            const response = await fetch(`${API_URL}/summarize`, {
                method: 'POST',
                body: formData, // FormData sets its own headers, no need for 'Content-Type'
            });
            return await response.json();
        } catch (error) {
            console.error('Summarization API Error:', error);
            return { success: false, message: 'Could not connect to the backend server.' };
        }
    }
};
