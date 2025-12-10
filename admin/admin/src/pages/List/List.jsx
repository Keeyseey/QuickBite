import React, { useState, useEffect, useContext } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext'; // ✅ import AdminContext

const List = ({ url }) => {
  const { adminToken } = useContext(AdminContext); // ✅ get adminToken
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', category: '', price: '' });

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`, {
        headers: { Authorization: `Bearer ${adminToken}` }, // ✅ add token
      });
      if (response.data.success) setList(response.data.data);
      else toast.error('Error fetching list');
    } catch (err) {
      console.error(err);
      toast.error('Error fetching list');
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        { headers: { Authorization: `Bearer ${adminToken}` } } // ✅ add token
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchList();
      } else toast.error(response.data.message);
    } catch (err) {
      console.error(err);
      toast.error('Error removing food');
    }
  };

  const saveEdit = async () => {
    try {
      const response = await axios.put(
        `${url}/api/food/update`,
        { id: editId, ...editData },
        { headers: { Authorization: `Bearer ${adminToken}` } } // ✅ add token
      );
      if (response.data.success) {
        toast.success('Food updated successfully');
        setEditId(null);
        fetchList();
      } else toast.error('Error updating food');
    } catch (err) {
      console.error(err);
      toast.error('Error updating food');
    }
  };

  useEffect(() => {
    fetchList();
  }, [adminToken]); // ✅ refetch if token changes

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
                <input type="text" name="name" value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})} className="edit-input"/>
                <input type="text" name="category" value={editData.category} onChange={(e)=>setEditData({...editData,category:e.target.value})} className="edit-input"/>
                <input type="number" name="price" value={editData.price} onChange={(e)=>setEditData({...editData,price:e.target.value})} className="edit-input"/>
                <div>
                  <button onClick={saveEdit} className="cursor">Save</button>
                  <button onClick={() => setEditId(null)} className="cursor">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p>₱{item.price}</p>
                <div>
                  <span onClick={() => { setEditId(item._id); setEditData({name:item.name, category:item.category, price:item.price}); }} className="cursor">Edit</span>
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
