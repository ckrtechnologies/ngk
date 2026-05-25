
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRouter.js";
import enquiryRouter from "./routes/enquiryRouter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter)

app.use("/api/enquiry", enquiryRouter)

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(3000, () => {
    console.log("Server started on port",  3000);
});