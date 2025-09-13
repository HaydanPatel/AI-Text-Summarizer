// Wait for the entire HTML page to be loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // Helper function for showing a custom modal.
    function showModal(message) {
        let modal = document.getElementById('custom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                text-align: center;
                max-width: 80%;
            `;
            const modalMessage = document.createElement('p');
            modalMessage.id = 'modal-message';
            modalMessage.style.marginBottom = '15px';
            modal.appendChild(modalMessage);
            const closeButton = document.createElement('button');
            closeButton.innerText = 'OK';
            closeButton.style.cssText = `
                width: auto;
                padding: 8px 20px;
                background: linear-gradient(45deg, #3498db, #2ecc71);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;
            closeButton.onclick = () => modal.remove();
            modal.appendChild(closeButton);
            document.body.appendChild(modal);
        }
        document.getElementById('modal-message').innerText = message;
        modal.style.display = 'block';
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await AppAPI.signupUser(username, email, password);

            showModal(response.message);
            if (response.success) {
                window.location.href = './login.html';
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await AppAPI.loginUser(email, password);
            
            showModal(response.message);
            if(response.success) {
                window.location.href = './dashboard.html';
            }
        });
    }
});
