const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  try {
    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB connected:", connection.connection.host);
    return connection;
  } catch (error) {
    console.error("\n===== MONGODB DIAGNOSTICS =====");
    console.error("Name:", error.name);
    console.error("Message:", error.message);

    const servers = error.reason?.servers;

    if (servers) {
      for (const [host, server] of servers) {
        console.error("\nServer:", host);
        console.error("Server type:", server.type);
        console.error(
          "Underlying error:",
          server.error?.message || "No underlying error reported",
        );
      }
    }

    console.error("\n===== END DIAGNOSTICS =====");
    throw error;
  }
}

module.exports = connectDB;
