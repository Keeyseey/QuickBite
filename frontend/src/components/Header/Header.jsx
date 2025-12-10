import React from 'react'
import './Header.css'

const Header = () => {
  return (
    <div className='header'>
      <div className="header-contents">
        <h2>Hungry? Let’s Fix That!</h2>
        <p>Skip the long lines and order straight from your phone! Our school canteen delivery app lets you explore delicious snacks, meals, and drinks anytime. Pick your favorites, place the order, and get your food fast and hassle-free.</p>
        <button onClick={() => {document.getElementById("explore-menu")?.scrollIntoView({behavior: "smooth"});}}>View Menu</button>
      </div>
    </div>
  )
}

export default Header
