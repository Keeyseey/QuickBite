import React from 'react';
import "./UserAppReview.css";


const USER_APP_URL = "https://quickbite-frontend-j6bc.onrender.com"; // User App URL

const UserAppReview = () => {
    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h2 style={{ textAlign: 'center', margin: '10px 0' }}>User App Preview Mode</h2>
            <p style={{ textAlign: 'center', color: '#888' }}>
                This is a restricted preview. Admin cannot log in or view user accounts.
            </p>

            {/* Embed User App with preview flag */}
            <iframe
                src={`${USER_APP_URL}/?preview=true`}
                style={{ flex: 1, border: 'none', width: '100%' }}
                title="User App Preview"
            />
        </div>
    );
};

export default UserAppReview;
