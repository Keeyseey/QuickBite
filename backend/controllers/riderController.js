import userModel from "../models/userModel.js";

// GET rider profile
export const getRiderProfile = async (req, res) => {
  try {
    if (!req.rider)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const rider = await userModel
      .findOne({ _id: req.rider._id, role: "rider" })
      .select("-password");

    if (!rider)
      return res.status(404).json({ success: false, message: "Rider not found" });

    res.json({ success: true, data: rider });
  } catch (err) {
    console.error("Get Rider Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE rider profile
export const updateRiderProfile = async (req, res) => {
  try {
    if (!req.rider)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, phone } = req.body;
    if (!name || !phone)
      return res
        .status(400)
        .json({ success: false, message: "Name and phone are required" });

    // Handle profile image upload via multer
    let profileImagePath = req.rider.profileImage; // fallback to existing
    if (req.file) {
      // Save the uploaded file path
      profileImagePath = `/images/${req.file.filename}`; // matches express.static in server
    }

    const updatedRider = await userModel
      .findOneAndUpdate(
        { _id: req.rider._id, role: "rider" },
        {
          name,
          phone,
          profileImage: profileImagePath,
        },
        { new: true }
      )
      .select("-password");

    res.json({ success: true, data: updatedRider });
  } catch (err) {
    console.error("Update Rider Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
