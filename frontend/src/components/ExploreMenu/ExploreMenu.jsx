import React from 'react'
import './ExploreMenu.css'
import { menu_list } from '../../assets/assets'

const ExploreMenu = ({category,setCategory}) => {

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our menu</h1>
      <p className='explore-menu-text'>Dive into a lineup of snacks, meals, and drinks made just for your school day cravings. Whether you're in the mood for something cheesy, sweet, or refreshing, we’ve got it all right here. Scroll, pick, enjoy!</p>
        <div className="explore-menu-list">
          {menu_list.map((item,index)=>{
              return (
                  <div onClick={()=>setCategory(prev=>prev===item.menu_name?"All":item.menu_name)} key={index} className="explore-menu-list-item">
                      <img className={category===item.menu_name?"active":""}src={item.menu_image} alt="" />
                      <p>{item.menu_name}</p>
                  </div>
              )
          })}
      </div>
      <hr />
    </div>
  )
}

export default ExploreMenu
