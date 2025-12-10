import express from "express";
import { addFood, listFood, removeFood, updateFood } from "../controllers/foodController.js";
import multer from "multer";
import Food from "../models/foodModel.js"; // make sure your Food model is imported


const foodRouter = express.Router();

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Existing routes
// Default GET route: /api/food
foodRouter.get("/", listFood);
foodRouter.post("/add", upload.single("image"), addFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", removeFood);
foodRouter.put("/update", updateFood);

// ✅ New Search Route
// GET /api/food/search?query=burger
foodRouter.get("/search", async (req, res) => {
  const query = req.query.query || "";

  try {
    const foods = await Food.find({
      name: { $regex: query, $options: "i" } // case-insensitive search
    });

    if (foods.length === 0) {
      return res.status(404).json({ message: "Food not available" });
    }

    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default foodRouter;
