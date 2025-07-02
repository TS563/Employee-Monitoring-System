
"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const [popupVisible, setPopupVisible] = useState(null); 
  const popupRef = useRef(null); 

  const handleButtonClick = (buttonName) => {
    setPopupVisible(buttonName); 
  };

  const handleClosePopup = () => {
    setPopupVisible(null); 
  };

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        handleClosePopup();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderPopupContent = () => {
    switch (popupVisible) {
      case 'Instructions':
        return (
          <div>
            <strong>How to Use:</strong> <br />
            1. Add camera details in the Cameras table. <br />
            2. Select a camera from the dropdown in the Live Feed section. <br />
            3. Click on "Start Feed" to begin streaming. <br />
            4. You can now utilize integrated features such as defining zones on the feed, adjusting their positions, deleting them, and saving your selections. <br />
            5. Once saved, zones can be previewed using the "Preview" button and deleted if necessary.
          </div>
        );
      
      case 'Collaboration':
        return (
          <div>
            <strong>Collaboration:</strong> <br />
            This project is developed in collaboration with <strong>RedGrape Technologies (Pvt. Ltd.)</strong>. <br />
            <strong>Mentored by: Rajesh Mallah</strong>
          </div>
        );

      case 'about project':
        return (
          <div>
            <strong>About the Project:</strong> <br />
            This project was developed as part of an internship and final-year academic work. It is intended for non-commercial use only.
          </div>
        );

      case 'contact':
        return (
          <div>
            <strong>Contact Information:</strong> <br />
            Developed by: <strong>Tanish Sharma</strong> <br />
            Email: <a href="mailto:tanish.ksharma424@gmail.com">tanish.ksharma424@gmail.com</a>
          </div>
        );

      default:
        return null;
    }
};


  return (
    <div className="Nav">
      <div>
        <img src="/icon.png" style={{ height: '68px' }} alt="Logo" />
      </div>
      <div className="Nav-logo">Employee Monitoring System</div>

      <div className="nav-buttons">
        <a href="/">Home</a>
        <a onClick={() => handleButtonClick('Instructions')}>Instructions</a>
        <a onClick={() => handleButtonClick('Collaboration')}>Collaboration</a>
        <a onClick={() => handleButtonClick('about project')}>About Project</a>
        <a onClick={() => handleButtonClick('contact')}>Contact</a>
      </div>

      
      {popupVisible && (
        <div className="popup" ref={popupRef}>
          <div className="popup-content">
            {renderPopupContent()}
            <button style={{colour: "black"}} onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
