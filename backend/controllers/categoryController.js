import Category from "../models/Category.js";
import Product from "../models/Product.js";

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories"
    });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const category = await Category.create({
      name: name.trim(),
      slug,
      description,
      displayOrder
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category"
    });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty"
        });
      }

      updates.name = name.trim();
      updates.slug = name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (description !== undefined) updates.description = description;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update category"
    });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const productExists = await Product.exists({
      category: category._id
    });

    if (productExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a category that contains products"
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete category"
    });
  }
};