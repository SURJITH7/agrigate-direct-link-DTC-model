import express from "express";
import Product from "../models/Product.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { isFarmer, isAdmin } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({ storage: storage });

// Get all products
router.get("/", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      // Unauthenticated users can see approved products
      const products = await Product.find({ status: "approved" })
        .populate({
          path: "farmerId",
          select: "farmName farmAddress locationName latitude longitude",
        })
        .lean();

      // The frontend expects a `farmer` object, not `farmerId`.
      const transformedProducts = products.map((p) => {
        const { farmerId, ...rest } = p;
        return { ...rest, farmer: farmerId };
      });
      return res.json(transformedProducts);
    }

    // Authenticated users
    if (req.user.role === "admin") {
      // Admins see all products with farmer info
      const products = await Product.find({}).populate(
        "farmerId",
        "farmName fullName",
      );
      res.json(products);
    } else if (req.user.role === "farmer") {

  console.log("==============");
  console.log("Logged in user:");
  console.log(req.user);

  const allProducts = await Product.find({});
  console.log("All Products:");
  console.log(allProducts);

  const products = await Product.find({ farmerId: req.user._id });

  console.log("Products for this farmer:");
  console.log(products);

  res.json(products);
} else {
      // A consumer should see all 'approved' products
      // We also want to populate the farmer's name for display
      const products = await Product.find({ status: "approved" })
        .populate({
          path: "farmerId",
          select: "farmName farmAddress locationName latitude longitude",
        })
        .lean();

      // The frontend expects a `farmer` object, not `farmerId`.
      const transformedProducts = products.map((p) => {
        const { farmerId, ...rest } = p;
        return { ...rest, farmer: farmerId };
      });
      res.json(transformedProducts);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Add new product
router.post("/", isFarmer, upload.single("image"), async (req, res) => {
  try {
    const productData = { ...req.body, farmerId: req.user._id };
    if (req.file) {
      productData.image = `/images/${req.file.filename}`; // Store the URL path
    }
    const product = new Product(productData);

    await product.save();
    // Emit socket event to the farmer's room for new product additions
    io.to(`farmer_${product.farmerId}`).emit('farmer_product_added', {
      product: product.toObject(),
      message: 'Your product has been added successfully',
    });
    
    res.status(201).json({
      ...product.toObject(),
      message: "Product created and pending admin review",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({ path: "farmerId", select: "farmName" })
    .lean();
  if (!product) return res.status(404).json({ error: "Not found" });

  // A consumer can view any product.
  // A farmer can only view their own products, this is for security.
  if (
    req.user.role === "farmer" &&
    product.farmerId._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const { farmerId, ...rest } = product;
  res.json({ ...rest, farmer: farmerId });
});

// Update product
router.put("/:id", isFarmer, upload.single("image"), async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  if (product.farmerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const updateData = { ...req.body };
  if (req.file) {
    updateData.image = `/images/${req.file.filename}`;
  }

  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });
  res.json(product);
});

// Delete product
router.delete("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });

  // Admin can delete any product, farmer can only delete their own
  if (
    req.user.role !== "admin" &&
    product.farmerId.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ error: "Not authorized" });
  }
  await product.deleteOne();
  res.json({ message: "Product deleted successfully" });
});

// PUT: Admin updates a product's status (manual approval)
router.put("/:id/status", isAdmin, async (req, res) => {
  try {
    const { status, approvalNotes } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate status
    if (!["approved", "pending", "rejected"].includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status value. Status can only be 'approved', 'pending', or 'rejected'.",
      });
    }

    product.status = status;
    product.approvedBy = req.user._id; // Track which admin approved it
    if (approvalNotes) {
      product.approvalNotes = `[MANUAL] ${approvalNotes}`;
    }

    await product.save();

    // Populate farmer details before emitting to consumers so frontend can calculate distance
    await product.populate({
      path: "farmerId",
      select: "farmName farmAddress locationName latitude longitude",
    });
    const productPayload = {
      ...product.toObject(),
      farmer: product.farmerId,
    };

    if (status === 'approved') {
      io.to(`farmer_${product.farmerId}`).emit('product_approved', {
        product: product.toObject(),
        message: `Your product "${product.name}" has been approved and is now live!`,
      });
      io.emit('product_available', {
        product: productPayload,
        message: `New product available: ${product.name}`,
      });
    } else if (status === 'rejected') {
      io.to(`farmer_${product.farmerId}`).emit('product_rejected', {
        product: product.toObject(),
        message: `Your product "${product.name}" has been rejected. Please check the approval notes.`,
      });
    }

    console.log(`✓ Product manually ${status} by admin: ${product.name}`);

    res.json({
      ...product.toObject(),
      message: `Product status updated to ${status}`,
    });
  } catch (err) {
    console.error("Failed to update product status:", err.message);
    res.status(500).json({ message: "Failed to update product status" });
  }
});

// PUT: Admin sets commission percentage for a product
router.put("/:id/commission", isAdmin, async (req, res) => {
  try {
    const { commission } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate commission value
    if (commission === undefined || commission === null) {
      return res.status(400).json({
        message: "Commission percentage is required",
      });
    }

    const commissionNumber = Number(commission);
    if (isNaN(commissionNumber) || commissionNumber < 2 || commissionNumber > 5) {
      return res.status(400).json({
        message: "Commission must be a number between 2 and 5 percent",
      });
    }

    product.commission = commissionNumber;
    await product.save();

    console.log(
      `✓ Product commission updated: ${product.name} - ${commissionNumber}%`,
    );

    res.json({
      ...product.toObject(),
      message: `Commission set to ${commissionNumber}%`,
    });
  } catch (err) {
    console.error("Failed to update product commission:", err.message);
    res.status(500).json({ message: "Failed to update product commission" });
  }
});

export default router;
