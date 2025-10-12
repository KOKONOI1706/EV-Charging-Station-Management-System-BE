import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import packageRoutes from "./routes/packageRoute"; // thêm .js nếu dùng module: NodeNext

dotenv.config(); // load .env trước
import "./config/db"; // connect DB sau khi có env

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (_, res) => res.send("🚗 EV Charging Station API Running!"));
app.use("/api/packages", packageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
