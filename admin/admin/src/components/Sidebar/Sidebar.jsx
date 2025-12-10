import React from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option">
          <img src={assets.add_icon} alt="" />
          <p>Add Items</p>
        </NavLink>

        <NavLink to='/list' className="sidebar-option">
          <img src={assets.food_list_icon} alt="" />
          <p>List Items</p>
        </NavLink>

        <NavLink to='/orders' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Orders</p>
        </NavLink>

        <NavLink to='/add-rider' className="sidebar-option">
          <img src={assets.rider_icon} alt="" />
          <p>Add Rider</p>
        </NavLink>

        <NavLink to='/rider-list' className="sidebar-option">
          <img src={assets.rider_list} alt="" />
          <p>List of Riders</p>
        </NavLink>

        {/* New: Review User App */}
        <NavLink to='/review-user-app' className="sidebar-option">
          <img src={assets.review_icon} alt="" />
          <p>Review User App</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
