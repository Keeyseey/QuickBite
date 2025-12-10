import React, { useState, useEffect } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null); // Track which item is being edited
  const [editData, setEditData] = useState({ name: '', category: '', price: '' });

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error('Error fetching list');
    }
  };

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    } else {
      toast.error('Error removing food');
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
    const response = await axios.put(`${url}/api/food/update`, {
      id: editId,
      ...editData,
    });
    if (response.data.success) {
      toast.success('Food updated successfully');
      setEditId(null);
      fetchList();
    } else {
      toast.error('Error updating food');
    }
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  useEffect(() => {
    fetchList();
  }, []);

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
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="edit-input"
                />
                <input
                  type="text"
                  name="category"
                  value={editData.category}
                  onChange={handleEditChange}
                  className="edit-input"
                />
                <input
                  type="number"
                  name="price"
                  value={editData.price}
                  onChange={handleEditChange}
                  className="edit-input"
                />
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
