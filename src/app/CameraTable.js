"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./camera.module.css";

const Add_Url = "https://camera-mon-backend-staging.web3.99cloudhosting.com/add_or_update_camera_master";
const List_Url = "https://camera-mon-backend-staging.web3.99cloudhosting.com/list_camera_master";
const Delete_Url = "https://camera-mon-backend-staging.web3.99cloudhosting.com/delete_camera_master?camera_id=";
const Zones_Url = "https://camera-mon-backend-staging.web3.99cloudhosting.com/list_camera_zones";

const CamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState({});
  const [formData, setFormData] = useState({
    id: "",
    camera_name: "",
    location: "",
    url: "",
    camera_w: "",
    camera_h: ""
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(List_Url)
      .then((res) => res.json())
      .then((data) => {
        setCameras(data.apiresponse.data);
      })
      .catch((err) => toast.error("Failed to fetch cameras!"));
  }, []);

  useEffect(() => {
    fetch(Zones_Url)
      .then((res) => res.json())
      .then((data) => {
        let zoneCounts = {};
        data.apiresponse.data.forEach(zone => {
          zoneCounts[zone.camera_id] = (zoneCounts[zone.camera_id] || 0) + 1;
        });
        setZones(zoneCounts);
      })
      // .catch(() => toast.error("Failed to fetch zones!"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      camera_id: editingId ? String(editingId) : "",
      camera_name: formData.camera_name,
      location: formData.location,
      url: formData.url,
      camera_w: formData.camera_w,
      camera_h: formData.camera_h
    };


    const res = await fetch(Add_Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    const responseData = await res.json();

    if (res.ok) {
      toast.success("Camera updated successfully!");
      setEditingId(null);
      setFormData({ id: "", camera_name: "", location: "", url: "", camera_w: "", camera_h: "" });

      fetch(List_Url)
        .then((res) => res.json())
        .then((data) => setCameras(data.apiresponse.data))
        .catch(() => toast.error("Failed to refresh camera list!"));
    } else {
      toast.error("Failed to save camera!");
    }
  };

  const handleDelete = async (id) => {
    console.log("Delete function called");

    if (zones[id]) {
        const confirmDelete = window.confirm("Deletion failed! Zones exist for this camera.");
        if (!confirmDelete) return;
        
        toast.warning("Cannot delete camera with existing zones!");
        return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this camera?");
    if (!confirmDelete) return;


    try {
        const res = await fetch(`${Delete_Url}${id}`, { method: "DELETE" });

        if (res.ok) {
            setCameras(cameras.filter((camera) => camera.camera_id !== id));
            toast.success("Camera deleted successfully!");
        } else {
            toast.error("Failed to delete camera!");
        }
    } catch (error) {
        console.error("Error deleting camera:", error);
        toast.error("Something went wrong!");
    }
};


  const handleEdit = (camera) => {
    setEditingId(camera.camera_id);
    setFormData({
      camera_id: camera.camera_id,
      camera_name: camera.camera_name,
      location: camera.location,
      url: camera.url,
      camera_w: camera.camera_w,
      camera_h: camera.camera_h,
    });
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className={styles.header}>Manage Cameras</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="Name"
          value={formData.camera_name || ''}
          onChange={(e) => setFormData({ ...formData, camera_name: e.target.value })}
          required
        />
        <input
          className={styles.input}
          type="text"
          placeholder="Width"
          value={formData.camera_w || ''}
          onChange={(e) => setFormData({ ...formData, camera_w: e.target.value })}
          required
        />
        <input
          className={styles.input}
          type="text"
          placeholder="Height"
          value={formData.camera_h || ''}
          onChange={(e) => setFormData({ ...formData, camera_h: e.target.value })}
        />
        <input
          className={styles.input}
          type="text"
          placeholder="Location"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
        <input
          className={styles.input}
          type="text"
          placeholder="URL"
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
        />
        <button className={`${styles.button} ${editingId ? styles.updateButton : styles.addButton}`} type="submit">
          {editingId ? "Update" : "Add"} Camera
        </button>
      </form>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>Name</th>
            <th className={styles.tableHeader}>Location</th>
            <th className={styles.tableHeader}>Resolution</th>
            <th className={styles.tableHeader}>Url</th>
            <th className={styles.tableHeader}>Zones</th>
            <th className={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(cameras) && cameras.map((camera) => (
            <tr key={camera.camera_id}>
              <td className={styles.tableCell}>{camera.camera_name}</td>
              <td className={styles.tableCell}>{camera.location}</td>
              <td className={styles.tableCell}>{camera.camera_w} x {camera.camera_h}</td>
              <td className={styles.tableCell}>{camera.url}</td>
              <td className={styles.tableCell}>{zones[camera.camera_id] || 0}</td>
              <td className={styles.tableCell}>
                <div className={styles.actionCell}>
                  <button className={styles.editButton} onClick={() => handleEdit(camera)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(camera.camera_id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CamerasPage;
