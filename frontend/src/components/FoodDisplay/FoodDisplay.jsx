import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import { RiderContext } from '../../context/RiderContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category }) => {
  const { food_list: storeFoodList } = useContext(StoreContext);
  const { foodList: riderFoodList } = useContext(RiderContext);

  // Use whichever context has data, fallback to empty array
  const list = Array.isArray(storeFoodList) && storeFoodList.length
    ? storeFoodList
    : Array.isArray(riderFoodList) && riderFoodList.length
      ? riderFoodList
      : [];

  const filteredList = list.filter(
    item => category === "All" || category === item.category
  );

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className="food-display-list">
        {filteredList.length > 0 ? (
          filteredList.map(item => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))
        ) : (
          <p>No food items available.</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
