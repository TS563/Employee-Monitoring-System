"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import style from "./Livefeed.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {DeleteFilled,DragOutlined,SaveFilled,WarningFilled,} from "@ant-design/icons";
import { VideoCameraOutlined } from "@ant-design/icons";
import { ClearOutlined } from "@ant-design/icons";
import { EditFilled } from "@ant-design/icons";
import { SnippetsOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { Switch, Space} from "antd";
import { startMonitoring, stopMonitoring } from "../utils/motion";


const List_Url =
  "https://camera-mon-backend-staging.web3.99cloudhosting.com/list_camera_master";
const Zone_Url =
  "https://camera-mon-backend-staging.web3.99cloudhosting.com/add_or_update_camera_zones";
const Zones_Url =
  "https://camera-mon-backend-staging.web3.99cloudhosting.com/list_camera_zones";


const LiveFeed = () => {
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameraList, setCameraList] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(new Image());
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const canvasOutputRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [rectangles, setRectangles] = useState([]);
  const [selectedRect, setSelectedRect] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cameraMap, setCameraMap] = useState({});
  const [fetchedZones, setFetchedZones] = useState([]);
  const [zones, setZones] = useState({});
  const [aiStatus, setAiStatus] = useState("");
  const [initializationTime, setInitializationTime] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch(List_Url);
        const data = await response.json();

        if (data.apiresponse && data.apiresponse.data) {
          setCameraList(data.apiresponse.data);
        }
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };
    fetchCameras();
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    if (!selectedCamera) {
      console.error("No camera selected");
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

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch(List_Url);
        const data = await response.json();

        if (data.apiresponse && data.apiresponse.data) {
          setCameraList(data.apiresponse.data);

          const cameraMapping = {};
          data.apiresponse.data.forEach((camera) => {
            cameraMapping[camera.url] = camera.camera_id;
          });

          setCameraMap(cameraMapping);
        }
      } catch (error) {
        toast.error("Error fetching cameras:", error);
      }
    };

    fetchCameras();
  }, []);

  const startAction = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoneIndex = fetchedZones.findIndex(
      ({ topl_x, topl_y, rightb_x, rightb_y }) =>
        mouseX >= topl_x &&
        mouseX <= rightb_x &&
        mouseY >= topl_y &&
        mouseY <= rightb_y
    );

    if (zoneIndex !== -1) {
      setSelectedRect(zoneIndex);
      return;
    }

    const clickedIndex = rectangles.findIndex(
      ({ x, y, width, height }) =>
        mouseX > x && mouseX < x + width && mouseY > y && mouseY < y + height
    );

    if (clickedIndex !== -1 && dragMode) {
      setSelectedRect(clickedIndex);
      setIsDragging(true);
      setDragOffset({
        x: mouseX - rectangles[clickedIndex].x,
        y: mouseY - rectangles[clickedIndex].y,
      });
    } else if (!dragMode) {
      setStartX(mouseX);
      setStartY(mouseY);
      setIsDrawing(true);
      setRectangles([
        ...rectangles,
        { x: mouseX, y: mouseY, width: 0, height: 0 },
      ]);
    }
  };

  const performAction = (e) => {
    if (!isDrawing && !isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDrawing) {
      setRectangles((prevRectangles) => {
        const newRectangles = [...prevRectangles];
        newRectangles[newRectangles.length - 1] = {
          ...newRectangles[newRectangles.length - 1],
          width: mouseX - startX,
          height: mouseY - startY,
        };
        return newRectangles;
      });
    }

    if (isDragging && selectedRect !== null) {
      setRectangles((prevRectangles) => {
        const updatedRectangles = [...prevRectangles];
        updatedRectangles[selectedRect] = {
          ...updatedRectangles[selectedRect],
          x: mouseX - dragOffset.x,
          y: mouseY - dragOffset.y,
        };
        return updatedRectangles;
      });
    }
  };

  const endAction = () => {
    setIsDrawing(false);
    setIsDragging(false);
  };

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

  const handleSave = async () => {
    if (!selectedCamera) {
      toast.error("No camera selected!");
      return;
    }

    const cameraId = cameraMap[selectedCamera];
    if (!cameraId) {
      toast.error("Camera ID not found for selected URL!");
      return;
    }

    for (const [index, rect] of rectangles.entries()) {
      const payload = {
        camera_id: cameraId,
        rightb_x: Math.round(rect.x + rect.width),
        rightb_y: Math.round(rect.y + rect.height),
        topl_x: Math.round(rect.x),
        topl_y: Math.round(rect.y),
        zone_name: `Zone ${index + 1}`,
      };

      console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));

      try {
        const response = await fetch(Zone_Url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log("📩 API Response:", result);

        if (!response.ok) {
          console.error("❌ Failed to save zone:", result);
          toast.error(`❌ Error: ${result.message || "Failed to save zone!"}`);
        }
      } catch (error) {
        toast.error("🔥 Fetch error:", error);
        toast.error("❌ Error saving zone!");
      }
    }

    toast.success("All Zones Saved");
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
        toast.success("Selected zone deleted successfully!");

        setFetchedZones((prevZones) =>
          prevZones.filter((_, index) => index !== selectedRect)
        );

        setSelectedRect(null);
      }
    } catch (error) {
      toast.error("🔥 Error deleting selected zone:", error);
    }
  };

  useEffect(() => {
    const fetchZoneCounts = () => {
      fetch(Zones_Url)
        .then((res) => res.json())
        .then((data) => {
          const counts = {};
          if (data.apiresponse?.data) {
            data.apiresponse.data.forEach((zone) => {
              counts[zone.camera_id] = (counts[zone.camera_id] || 0) + 1;
            });
          }
          setZones(counts);
        });
      // .catch(() => toast.error("Failed to fetch zones!"));
    };

    fetchZoneCounts();

    const interval = setInterval(fetchZoneCounts, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAI = (checked) => {
    if (checked) {
      setIsAIEnabled(true); 
      setTimeout(() => handleStartAI(), 100); 
    } else {
      handleStopAI();
    }
  };

  const connectWebSocket = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      toast.error('Failed to establish WebSocket connection after multiple attempts');
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected successfully to:', wsUrl);
        setIsWsConnected(true);
        setWsConnection(ws);
        reconnectAttemptsRef.current = 0;
        toast.success('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'rtsp') {
            if (data.status === 'processing' && canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (data.data && data.data.frame) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                };
                img.src = 'data:image/png;base64,' + data.data.frame;
              }
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket state:', ws.readyState);
        setIsWsConnected(false);
        setWsConnection(null);
        toast.error('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsWsConnected(false);
        setWsConnection(null);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      toast.error('Failed to create WebSocket connection');
      return null;
    }
  }, []);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  const handleStartAI = async () => {
    if (!selectedCamera) {
      toast.error("No camera selected!");
      return;
    }

    if (rectangles.length === 0) {
      toast.error("No zones marked!");
      return;
    }

    if (!isWsConnected || !wsConnection) {
      toast.error("WebSocket connection not established!");
      return;
    }

    setIstializinInig(true);
    const startTime = Date.now();
    const timer = setInterval(() => {
      setInitializationTime(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);

    console.log("Starting AI monitoring...");
    toast.success("AI monitoring started!");
    
    // Send RTSP stream initialization message
    wsConnection.send(JSON.stringify({
      type: 'rtsp',
      action: 'start',
      cameraUrl: selectedCamera,
      zones: rectangles
    }));

    startMonitoring(videoRef.current, canvasOutputRef.current, rectangles, (status) => {
      console.log("AI Status:", status);
      setAiStatus(status);
      if (status !== "Initializing") {
        clearInterval(timer);
        setInitializationTime(0);
        setIsInitializing(false);
      }
    });

    setIsAIEnabled(true);
  };

  const handleStopAI = () => {
    if (wsConnection && isWsConnected) {
      wsConnection.send(JSON.stringify({
        type: 'rtsp',
        action: 'stop'
      }));
    }
    stopMonitoring();
    setIsAIEnabled(false);
    setAiStatus("");
    setInitializationTime(0);
    setIsInitializing(false);
  };

  return (
    <div className={style.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className={style.header}>AI Motion Detection Feed</h2>

      <div className={style.controls}>
        <label>Select Camera: </label>
        <select
          className={style.select}
          onChange={(e) => {
            const selected = cameraList.find(
              (cam) => cam.camera_id === e.target.value
            );
            if (selected) {
              setSelectedCamera(selected.url);
            }
          }}
        >
          <option value="">-- Choose a Camera --</option>
          {cameraList.map((camera) => (
            <option key={camera.camera_id} value={camera.camera_id}>
              {camera.camera_name}
            </option>
          ))}
        </select>

        <div className={style.zoneCounter}>
          zones: <strong>{zones[cameraMap[selectedCamera]] || 0}</strong>
        </div>
      </div>

      <div className={style.Toolkit}>
        <h1 style={{color: "black"}}>Tool Box </h1>
        <Tooltip title="Start streaming the live video feed from the selected camera">
          <button
            className={`${style.button} ${style.startButton}`}
            onClick={() => setIsStreaming(true)}
          >
            <VideoCameraOutlined style={{ fontsize: "15px", color: "black" }} />{" "}
            Start Feed
          </button>
        </Tooltip>

        <Tooltip title="Remove all rectangles drawn on the video feed.">
          <button
            className={`${style.button} ${style.stopButton}`}
            onClick={clearAllRectangles}
          >
            <ClearOutlined style={{ fontsize: "15px", color: "black" }} /> Clear
            All Drawn Rectangle
          </button>
        </Tooltip>

        <Tooltip title="Delete the currently selected rectangle marked red from the video feed">
          <button
            className={`${style.button} ${style.deleteButton}`}
            onClick={deleteSelectedRectangle}
          >
            <DeleteFilled style={{ fontsize: "15px", color: "red" }} /> Delete
            Selected
          </button>
        </Tooltip>

        <Tooltip title="Toggle drag mode to move rectangles on the video feed.">
          <button
            className={`${style.button} ${style.dragButton}`}
            onClick={() => setDragMode(!dragMode)}
          >
            <DragOutlined style={{ fontSize: "15px", color: "black" }} />{" "}
            {dragMode ? "Disable Drag Mode" : "Enable Drag Mode"}
          </button>
        </Tooltip>

        <h3 style={{color: "black"}}> Zone Functions </h3>

        <Tooltip title="View all zones saved for the selected camera">
          <button className={style.button} onClick={handlePreviewZones}>
            <SnippetsOutlined /> Preview Saved Zones
          </button>
        </Tooltip>

        <Tooltip title="Permanently delete all zones saved for the selected camera">
          <button className={style.button} onClick={handleDeleteZones}>
            <WarningFilled /> Delete All Zones
          </button>
        </Tooltip>

        <Tooltip title="Delete the currently selected zone marked in blue from the saved zones ">
          <button className={style.button} onClick={handleDeleteSelectedZone}>
            <DeleteFilled style={{ fontsize: "15px", color: "blue" }} /> Delete
            Selected Zone
          </button>
        </Tooltip>

        <div className={style.AI}>
          <Tooltip title="Enable AI to monitor the selected camera feed for motion detection.">
            <Space direction="vertical">
              <Switch 
                checked={isAIEnabled}
                checkedChildren="AI enabled"
                unCheckedChildren="AI disabled"
                onChange={handleToggleAI}
                disabled={!selectedCamera || rectangles.length === 0}
              />
            </Space>
          </Tooltip>
          
          {isAIEnabled && (
            <div className={style.aiStatus}>
              {isInitializing ? (
                <div className={style.initializing}>
                  Initializing AI... {initializationTime}s
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      <div
        style={{
          position: "relative",
          width: "640px",
          height: "360px",
          border: "1px solid black",
        }}
      >
        <canvas
          ref={canvasRef}
          width="640"
          height="360"
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          onMouseDown={startAction}
          onMouseMove={performAction}
          onMouseUp={endAction}
        />
      </div>

      <div className={style.kit}>
        <h3 style={{ color: "black" }}>Marking Tools</h3>

        <Tooltip title="Enable rectangle drawing mode to mark areas on the video feed">
          <button
            className={style.button}
            onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
          >
            <EditFilled />{" "}
            {isDrawingEnabled
              ? "Disable Rectangle Drawing"
              : "Make Rectangles "}
          </button>
        </Tooltip>
      </div>

      <div
        style={{ width: "130px", cursor: "pointer" }}
        onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
      >
        <Tooltip title="save all the zones">
          <button className={style.specialCase} onClick={handleSave}>
            <SaveFilled />
            Save
          </button>
        </Tooltip>
      </div>

      {isAIEnabled && selectedCamera && (
        <div
          style={{
            position: "relative",
            width: "640px",
            height: "360px",
            border: "1px solid black",
            marginTop: "20px",
          }}
        >
          <canvas
            ref={canvasOutputRef}
            width="640"
            height="360"
            style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          />
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
