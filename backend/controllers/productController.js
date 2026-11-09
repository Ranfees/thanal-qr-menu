import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

// 1. GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const { category, milkType, isFeatured, isAvailable, search } = req.query;

    const filter = {};

    // Filter by category
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID"
        });
      }

      filter.category = category;
    }

    // Filter by milk type
    if (milkType) {
      filter.milkType = milkType;
    }

    // Filter featured products
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === "true";
    }

    // Filter available products
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    // Search products by name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};


// 2. GET SINGLE PRODUCT
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(id)
      .populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};


// 3. CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      milkType,
      isFeatured,
      isAvailable,
      displayOrder
    } = req.body;

    // Validate product name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required"
      });
    }

    // Validate price
    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product price is required"
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid price"
      });
    }

    // Validate category ID
    if (!category || !mongoose.isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: "A valid category is required"
      });
    }

    // Check whether category exists
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    if (!categoryExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot add products to an inactive category"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      price: Number(price),
      category,
      image,
      milkType,
      isFeatured,
      isAvailable,
      displayOrder
    });

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct
    });

  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product"
    });
  }
};


// 4. UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const {
      name,
      description,
      price,
      category,
      image,
      milkType,
      isFeatured,
      isAvailable,
      displayOrder
    } = req.body;

    const updates = {};

    // Update only fields provided by the client
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty"
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (price !== undefined) {
      if (
        price === null ||
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid price"
        });
      }

      updates.price = Number(price);
    }

    // Validate new category if provided
    if (category !== undefined) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID"
        });
      }

      const categoryExists = await Category.findById(category);

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      if (!categoryExists.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign an inactive category"
        });
      }

      updates.category = category;
    }

    // Update image fields without overwriting the entire image object
    if (image !== undefined) {
      if (image === null || typeof image !== "object" || Array.isArray(image)) {
        return res.status(400).json({
          success: false,
          message: "Invalid image data"
        });
      }

      if (image.url !== undefined) updates["image.url"] = image.url;
      if (image.publicId !== undefined) updates["image.publicId"] = image.publicId;
    }

    if (milkType !== undefined) {
      updates.milkType = milkType;
    }

    if (isFeatured !== undefined) {
      updates.isFeatured = isFeatured;
    }

    if (isAvailable !== undefined) {
      updates.isAvailable = isAvailable;
    }

    if (displayOrder !== undefined) {
      updates.displayOrder = displayOrder;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      {
        returnDocument: "after",
        runValidators: true
      }
    ).populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};


// 5. DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};
