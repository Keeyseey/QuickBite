import foodModel from "../models/foodModel.js";
import sharp from "sharp";
import fs from "fs";

// add food item
const addFood = async (req, res) => {
  let image_filename = req.file ? req.file.filename : "";

  try {
    if (req.file) {
      const inputPath = `uploads/${image_filename}`;
      const outputPath = `uploads/resized-${image_filename}`;

      // Resize image to 360x280
      await sharp(inputPath)
        .resize(360, 280)
        .toFile(outputPath);

      // Delete original file
      fs.unlinkSync(inputPath);

      // Replace filename with resized version
      image_filename = `resized-${image_filename}`;
    }

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_filename
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding food" });
  }
};

// get/list all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    res.json({ success: false, message: "Cannot fetch food list" });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);

    if (!food) {
      return res.json({ success: false, message: "Food not found" });
    }

    fs.unlink(`uploads/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// update food item
export const updateFood = async (req, res) => {
  try {
    const { id, name, category, price } = req.body;

    const updated = await foodModel.findByIdAndUpdate(
      id,
      { name, category, price },
      { new: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.json({ success: false, message: "Update failed" });
  }
};

export const searchFood = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, message: "Query is required", data: [] });
  }

  try {
    const foods = await foodModel.find({
      name: { $regex: query, $options: "i" } // case-insensitive search
    });

    if (!foods || foods.length === 0) {
      return res.status(404).json({ success: false, message: "Food not available", data: [] });
    }

    res.json({ success: true, data: foods }); // ✅ match frontend structure
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", data: [] });
  }
};

export { addFood, listFood, removeFood};
