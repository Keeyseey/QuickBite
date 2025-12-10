import userModel from "../models/userModel.js";

// Add to cart
const addToCart = async (req, res) => {
  if (!req.userId) 
    return res.status(401).json({ success: false, message: "Login to add items" });

  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let cartData = user.cartData || {};
    const { pid } = req.body; // frontend sends pid
    if (!pid) return res.status(400).json({ success: false, message: "Product ID required" });

    cartData[pid] = (cartData[pid] || 0) + 1;

    await userModel.findByIdAndUpdate(req.userId, { cartData });
    res.json({ success: true, message: "Added to cart", cartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  if (!req.userId) 
    return res.status(401).json({ success: false, message: "Login to remove items" });

  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let cartData = user.cartData || {};
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ success: false, message: "Product ID required" });

    if (cartData[pid] > 0) cartData[pid] -= 1;
    if (cartData[pid] <= 0) delete cartData[pid];

    await userModel.findByIdAndUpdate(req.userId, { cartData });
    res.json({ success: true, message: "Removed from cart", cartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get cart
const getCart = async (req, res) => {
  if (!req.userId) return res.json({ success: true, cartData: {} }); // guest sees empty cart

  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cartData = user.cartData || {};
    res.json({ success: true, cartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { addToCart, removeFromCart, getCart };
