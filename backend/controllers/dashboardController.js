const Product = require("../models/Product");

const getDashboardStats = async (req, res) => {
  try {
    const [totalProducts, activeProducts, outOfStockProducts, inventory] =
      await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ stock: { $lte: 0 } }),
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalUnits: {
                $sum: { $ifNull: ["$stock", 0] },
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

    const summary = inventory[0] || {
      totalUnits: 0,
      totalInventoryValue: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalUnits: summary.totalUnits,
        totalInventoryValue: summary.totalInventoryValue,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard statistics",
    });
  }
};

module.exports = { getDashboardStats };
