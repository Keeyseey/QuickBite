import React, { useContext } from 'react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems = {}, addToCart, removeFromCart, url, isLoggedIn } = useContext(StoreContext);

  // Safely get quantity (default to 0 if undefined)
  const quantity = cartItems[id] || 0;

  // Handle add click safely
  const handleAdd = () => {
    if (!isLoggedIn) {
      alert("Please log in to add items to cart.");
      return;
    }
    addToCart(id);
  };

  // Handle remove click safely
  const handleRemove = () => {
    if (!isLoggedIn) return;
    removeFromCart(id);
  };

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        <img className='food-item-image' src={`${url}/images/${image}`} alt={name} />

        {quantity === 0 ? (
          <img
            className='add'
            onClick={handleAdd}
            src={assets.add_icon_white}
            alt="Add"
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={handleRemove}
              src={assets.remove_icon_red}
              alt="Remove"
            />
            <p>{quantity}</p>
            <img
              onClick={handleAdd}
              src={assets.add_icon_green}
              alt="Add"
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="Rating" />
        </div>
        <p className='food-item-desc'>{description}</p>
        <p className="food-item-price">₱{price}</p>
      </div>
    </div>
  );
};

export default FoodItem;
