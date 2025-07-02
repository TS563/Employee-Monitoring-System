import React from 'react';
import style from './Livefeed.module.css';

const Toolbox = ({ onRectangleMark }) => {
  // const handleSave = async () => {
  //     if (!selectedCamera) {
  //       toast.error("No camera selected!");
  //       return;
  //     }
    
  //     const cameraId = cameraMap[selectedCamera]; 
  //     if (!cameraId) {
  //       toast.error("Camera ID not found for selected URL!");
  //       return;
  //     }
    
  //     for (const [index, rect] of rectangles.entries()) {
  //       const payload = {
  //         camera_id: cameraId, 
  //         rightb_x: Math.round(rect.x + rect.width), 
  //         rightb_y: Math.round(rect.y + rect.height),
  //         topl_x: Math.round(rect.x),
  //         topl_y: Math.round(rect.y),
  //         zone_name: `Zone ${index + 1}`
  //       };
    
  //       console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));
    
  //       try {
  //         const response = await fetch(Zone_Url, {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify(payload),
  //         });
    
  //         const result = await response.json();
  //         console.log("📩 API Response:", result);
    
  //         if (!response.ok) {
  //           console.error("❌ Failed to save zone:", result);
  //           toast.error(`❌ Error: ${result.message || "Failed to save zone!"}`);
  //         }
  //       } catch (error) {
  //         toast.error("🔥 Fetch error:", error);
  //         toast.error("❌ Error saving zone!");
  //       }
  //     }
    
  //     toast.success("All Zones Saved");
  //   };
  return (
    <div className={style.kit}>
      <h3 style={{color:'black'}}>Marking Tools</h3>
      <button className={style.button} onClick={onRectangleMark}>
        Mark Rectangle
      </button>

      {/* <button className={style.specialCase} onClick={handleSave}>
          Save
        </button> */}
    </div>
  );
};

export default Toolbox;
