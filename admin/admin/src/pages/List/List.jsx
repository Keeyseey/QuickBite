import React, { useState, useEffect, useContext } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const List = () => {
  const { url, adminToken } = useContext(AdminContext);
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', category: '', price: '' });

  const fetchList = async () => {
    if (!adminToken) return toast.error('Admin not logged in!');
    try {
      const res = await axios.get(`${url}/api/food/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.data.success) setList(res.data.data);
      else toast.error('Error fetching list');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch list');
    }
  };

  const removeFood = async (foodId) => {
    if (!adminToken) return toast.error('Admin not logged in!');
    try {
      const res = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchList();
      } else {
        toast.error(res.data.message || 'Error removing food');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove food');
    }
  };

  const startEdit = (item) => {
    setEditId(item._id);
    setEditData({ name: item.name, category: item.category, price: item.price });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const saveEdit = async () => {
    if (!adminToken) return toast.error('Admin not logged in!');
    try {
      const res = await axios.put(
        `${url}/api/food/update`,
        { id: editId, ...editData },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) {
        toast.success('Food updated successfully');
        setEditId(null);
        fetchList();
      } else toast.error(res.data.message || 'Error updating food');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update food');
    }
  };

  const cancelEdit = () => setEditId(null);

  useEffect(() => {
    fetchList();
  }, [adminToken]);

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => (
          <div key={index} className="list-table-format">
            <img src={`${url}/images/${item.image}`} alt="" />
            {editId === item._id ? (
              <>
                <input type="text" name="name" value={editData.name} onChange={handleEditChange} />
                <input type="text" name="category" value={editData.category} onChange={handleEditChange} />
                <input type="number" name="price" value={editData.price} onChange={handleEditChange} />
                <div>
                  <button onClick={saveEdit} className="cursor">Save</button>
                  <button onClick={cancelEdit} className="cursor">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p>₱{item.price}</p>
                <div>
                  <span onClick={() => startEdit(item)} className="cursor">Edit</span>
                  <span onClick={() => removeFood(item._id)} className="cursor">Delete</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
