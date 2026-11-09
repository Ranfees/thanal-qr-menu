import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0
    },

    image: {
      url: {
        type: String,
        default: ""
      },
      publicId: {
        type: String,
        default: ""
      }
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    milkType: {
      type: String,
      enum: ["with-milk", "without-milk", "not-applicable"],
      default: "not-applicable"
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
