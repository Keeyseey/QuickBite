import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

// Initialize AutoIncrement with mongoose
const AutoIncrement = AutoIncrementFactory(mongoose);

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  barangay: { type: String },
  purok: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipcode: { type: String, required: true },
});

// ⭐ Exact customer pinned location
const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  label: { type: String }, // Optional readable text
});

// ⭐ Rider information for assignment
const riderInfoSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "rider" },
  name: { type: String },
  phone: { type: String },
});

// ⭐ For tracking important timestamps
const statusTimelineSchema = new mongoose.Schema({
  foodProcessingAt: { type: Date },
  pickedUpAt: { type: Date },
  outForDeliveryAt: { type: Date },
  deliveredAt: { type: Date },
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  items: [
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    }
  ],

  amount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },

  address: { type: addressSchema, required: true },

  // ⭐ Save pinned map location of customer
  location: { type: locationSchema, required: true },

  // ⭐ Rider assigned to this order
  rider: { type: riderInfoSchema, default: null },

  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },

  // ⭐ Status timeline (auto-fill optional on controller)
  timeline: { type: statusTimelineSchema, default: {} },

  orderNumber: { type: Number, unique: true },

  // ✅ Delivery proof image (URL or filename)
  deliveryProof: { type: String, default: null }
});

// Auto-increment orderNumber
orderSchema.plugin(AutoIncrement, { inc_field: "orderNumber" });

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
