import React from 'react';
import style from './Livefeed.module.css';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToolKit = ({ }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [rectangles, setRectangles] = useState([]);
    const [dragMode, setDragMode] = useState(false);
    const [selectedRect, setSelectedRect] = useState(null);
    const [fetchedZones, setFetchedZones] = useState([]); 
    const canvasRef = useRef(null);
    const videoRef = useRef(new Image());

    useEffect(() => {
        if (!isStreaming) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          return;
        }
    
        if (!selectedCamera) {
          toast.error("No camera selected");
          return;
        }
        videoRef.current.src = selectedCamera;
        videoRef.current.crossOrigin = "anonymous";
    
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
    
        const drawFrame = () => {
          if (!isStreaming) return;
    
          if (videoRef.current.complete) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
            fetchedZones.forEach((zone, index) => {
              ctx.strokeStyle = selectedRect === index ? "green" : "blue";
              ctx.lineWidth = 2;
              ctx.strokeRect(
                zone.topl_x,
                zone.topl_y,
                zone.rightb_x - zone.topl_x,
                zone.rightb_y - zone.topl_y
              );
            });
    
            rectangles.forEach((rect, index) => {
              ctx.strokeStyle = selectedRect === index ? "green" : "red";
              ctx.lineWidth = 2;
              ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            });
          }
          requestAnimationFrame(drawFrame);
        };
    
        drawFrame();
      }, [isStreaming, selectedCamera, rectangles, selectedRect, fetchedZones]);

      const clearAllRectangles = () => {
        setRectangles([]);
        setSelectedRect(null);
      };

      const deleteSelectedRectangle = () => {
        if (selectedRect !== null) {
          setRectangles(rectangles.filter((_, index) => index !== selectedRect));
          setSelectedRect(null);
        }
      };

      const handlePreviewZones = async () => {
          if (!selectedCamera) {
            toast.error("No camera selected!");
            return;
          }
      
          const cameraId = cameraMap[selectedCamera];
          if (!cameraId) {
            toast.error("Camera ID not found for selected URL!");
            return;
          }
      
          try {
            const response = await fetch(
              `https://camera-mon-backend-staging.web3.99cloudhosting.com/list_camera_zones?camera_id=${cameraId}`
            );
            const data = await response.json();
      
            if (data.apiresponse && data.apiresponse.data) {
              setFetchedZones(data.apiresponse.data);
            } else {
              toast.error("No zones found for this camera!");
              setFetchedZones([]);
            }
          } catch (error) {
            toast.error("Error fetching zones:", error);
          }
        };

        const handleDeleteZones = async () => {
            if (!selectedCamera) {
              toast.error("No camera selected!");
              return;
            }
        
            if (fetchedZones.length === 0) {
              toast.error("No zones to delete!");
              return;
            }
        
            const confirmDelete = window.confirm(
              "Are you sure you want to delete all zones?"
            );
            if (!confirmDelete) return;
        
            for (const zone of fetchedZones) {
              try {
                const response = await fetch(
                  `https://camera-mon-backend-staging.web3.99cloudhosting.com/delete_camera_zones?zone_id=${zone.zone_id}`,
                  {
                    method: "DELETE",
                  }
                );
        
                const result = await response.json();
                console.log("📩 Delete API Response:", result);
        
                if (!response.ok) {
                  console.error("❌ Failed to delete zone:", result);
                }
              } catch (error) {
                toast.error("🔥 Error deleting zone:", error);
              }
            }
        
            setFetchedZones([]);
        
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
            toast.success("All Zones Deleted");
          };

        const handleDeleteSelectedZone = async () => {
            if (selectedRect === null) {
              toast.error("No zone selected for deletion!");
              return;
            }
        
            const selectedZone = fetchedZones[selectedRect];
        
            if (!selectedZone) {
              toast.error("Selected zone not found!");
              return;
            }
        
            const confirmDelete = window.confirm(
              `Are you sure you want to delete Zone ${selectedRect + 1}?`
            );
            if (!confirmDelete) return;
        
            try {
              const response = await fetch(
                `https://camera-mon-backend-staging.web3.99cloudhosting.com/delete_camera_zones?zone_id=${selectedZone.zone_id}`,
                { method: "DELETE" }
              );
        
              const result = await response.json();
              console.log("📩 Delete API Response:", result);
        
              if (!response.ok) {
                console.error("❌ Failed to delete selected zone:", result);
              } else {
                toast.success("✅ Selected zone deleted successfully!");
        
                setFetchedZones((prevZones) =>
                  prevZones.filter((_, index) => index !== selectedRect)
                );
        
                setSelectedRect(null);
              }
            } catch (error) {
              toast.error("🔥 Error deleting selected zone:", error);
            }
          };
        
    
  return (
    <div>
        <ToastContainer position="top-right" autoClose={3000} />
        <button className={`${style.button} ${style.startButton}`} onClick={() => setIsStreaming(true)}>
          Start Feed
        </button>
        <button className={`${style.button} ${style.stopButton}`} onClick={clearAllRectangles}>
          Clear All
        </button>
        {selectedRect !== null && (
          <button className={`${style.button} ${style.deleteButton}`} onClick={deleteSelectedRectangle}>
            Delete Selected
          </button>
        )}
        <button className={`${style.button} ${style.dragButton}`} onClick={() => setDragMode(!dragMode)}>
          {dragMode ? "Disable Drag Mode" : "Enable Drag Mode"}
        </button>

        <button className={style.button} onClick={handlePreviewZones}>
          Preview Zones
        </button>
        <button className={style.button} onClick={handleDeleteZones}>
          Delete All Zones
        </button>
        <button className={style.button} onClick={handleDeleteSelectedZone}>
          Delete Selected Zone
        </button>



      </div>
    
  );
};

export default ToolKit;