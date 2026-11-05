const Product = require("../models/Product");

const getDashboardStats = async (req, res) => {
  try {
    // Fetch product statistics and inventory calculations together
    const [totalProducts, activeProducts, outOfStockProducts, inventory] =
      await Promise.all([
        // Total products
        Product.countDocuments({}),

        // Active products
        Product.countDocuments({ isActive: true }),

        // Products with zero or negative stock
        Product.countDocuments({ stock: { $lte: 0 } }),

        // Calculate inventory details
        Product.aggregate([
          {
            $group: {
              _id: null,

              totalUnits: {
                $sum: {
                  $ifNull: ["$stock", 0],
                },
              },

              totalInventoryValue: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$price", 0] },
                    { $ifNull: ["$stock", 0] },
                  ],
                },
              },
            },
          },
        ]),
      ]);

    // Default values when inventory is empty
    const summary = inventory[0] || {
      totalUnits: 0,
      totalInventoryValue: 0,
    };

    // Send dashboard statistics
    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",

      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalUnits: summary.totalUnits,
        totalInventoryValue: summary.totalInventoryValue,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
