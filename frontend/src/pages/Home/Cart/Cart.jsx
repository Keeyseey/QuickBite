import React, { useContext, useEffect, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cart = ({ reviewMode = false }) => {
  const { cartItems, foodList, removeFromCart, getTotalCartAmount, url, user, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [hasUsedPromo, setHasUsedPromo] = useState(false);
  const [userPromoList, setUserPromoList] = useState([]); // For claimed but unused promos

  const promoCodes = {
    SAVE10: 0.1,
    SAVE20: 0.2,
    FREESHIP: 2
  };

  // Fetch user's promo info safely
  useEffect(() => {
    if (reviewMode) return;

    const fetchPromoStatus = async () => {
      if (!user?._id || !token) return; // Guard for undefined user
      try {
        const res = await axios.get(`${url}/api/user/promo-status/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Check if user has claimed or used promo codes
        const hasUsed = res.data.hasUsedPromo === true;
        setHasUsedPromo(hasUsed);
        setUserPromoList(res.data.unusedPromos || []); // Array of unused promo codes

        // Show welcome popup if first-time user (hasn't used promo yet)
        if (!hasUsed && (!res.data.unusedPromos || res.data.unusedPromos.length === 0)) {
          setShowPromoPopup(true);
        }
      } catch (err) {
        console.error('Error fetching promo status:', err);
      }
    };

    fetchPromoStatus();
  }, [user, token, url, reviewMode]);

  const handleApplyPromo = async (codeInput = null) => {
    if (reviewMode) {
      alert('Promo codes are disabled in Preview Mode.');
      return;
    }

    const code = (codeInput || promoCode).toUpperCase().trim();
    if (!promoCodes[code]) {
      setDiscount(0);
      setMessage('Invalid promo code');
      return;
    }

    let amt = 0;
    if (code === 'FREESHIP') {
      amt = 2;
      setMessage('Free delivery applied!');
    } else {
      amt = getTotalCartAmount() * promoCodes[code];
      setMessage(`Promo applied! You saved ₱${amt.toFixed(2)}`);
    }
    setDiscount(amt);
    setShowPromoPopup(false);

    // Update user's promo usage
    if (user?._id && token) {
      try {
        await axios.post(
          `${url}/api/user/use-promo/${user._id}`,
          { promoCode: code, discount: amt },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHasUsedPromo(true);
        // Remove from unused promo list if exists
        setUserPromoList((prev) => prev.filter((p) => p !== code));
      } catch (err) {
        console.error('Error updating promo status:', err);
      }
    }
  };

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const total = subtotal + deliveryFee - discount;

  const cartEntries = Object.keys(cartItems)
    .map((pid) => {
      const item = foodList.find((f) => f._id === pid);
      if (!item) return null;
      return { ...item, quantity: cartItems[pid] };
    })
    .filter(Boolean);

  return (
    <div className="cart">
      {reviewMode && (
        <div
          style={{
            background: '#ffdddd',
            color: '#b30000',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}
        >
          🔒 Preview Mode Active — Cart actions disabled
        </div>
      )}

      {/* Welcome Promo Popup */}
      {showPromoPopup && !reviewMode && (
        <div className="promo-popup">
          <div className="promo-popup-content">
            <h3>Welcome! Use a promo code for a discount</h3>
            <p>Available promo codes for first-time users:</p>
            <ul>
              {Object.keys(promoCodes).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button onClick={() => handleApplyPromo()}>Apply</button>
            <button className="close-btn" onClick={() => setShowPromoPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* User Claimed Unused Promo Codes */}
      {userPromoList.length > 0 && !reviewMode && (
        <div className="promo-claimed-popup">
          <h4>Your available promo codes:</h4>
          <ul>
            {userPromoList.map((code) => (
              <li key={code}>
                {code}{' '}
                <button onClick={() => handleApplyPromo(code)} style={{ marginLeft: '8px' }}>
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cart Items */}
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {cartEntries.length > 0 ? (
          cartEntries.map((item) => (
            <div key={item._id}>
              <div className="cart-items-title cart-items-item">
                <img src={url + '/images/' + item.image} alt={item.name} />
                <p>{item.name}</p>
                <p>₱{item.price}</p>
                <p>{item.quantity}</p>
                <p>₱{item.price * item.quantity}</p>
                <p
                  onClick={() => !reviewMode && removeFromCart(item._id)}
                  className="cross"
                  style={{ cursor: reviewMode ? 'not-allowed' : 'pointer', opacity: reviewMode ? 0.5 : 1 }}
                >
                  x
                </p>
              </div>
              <hr />
            </div>
          ))
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>

      {/* Cart Totals & Promo Input */}
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₱{subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₱{deliveryFee}</p>
            </div>
            <hr />
            {discount > 0 && (
              <div className="cart-total-details">
                <p>Discount</p>
                <p>₱{discount.toFixed(2)}</p>
              </div>
            )}
            <div className="cart-total-details">
              <b>Total</b>
              <b>₱{total.toFixed(2)}</b>
            </div>
          </div>
          <button
            onClick={() => !reviewMode && navigate('/order')}
            disabled={reviewMode}
            style={{ cursor: reviewMode ? 'not-allowed' : 'pointer', opacity: reviewMode ? 0.5 : 1 }}
          >
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            <div className="cart-promocode-input">
              <input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={reviewMode}
              />
              <button
                onClick={() => handleApplyPromo()}
                disabled={reviewMode}
                style={{ cursor: reviewMode ? 'not-allowed' : 'pointer', opacity: reviewMode ? 0.5 : 1 }}
              >
                Submit
              </button>
            </div>
            {message && (
              <p style={{ marginTop: '5px', color: discount > 0 ? 'green' : 'red' }}>{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
