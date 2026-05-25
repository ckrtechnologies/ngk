import { Router } from "express";
import { addEnquiry, getEnquiry, updateStatus, addMessage } from "../controller/enquiryController.js";

const enquiryRouter = Router();

enquiryRouter.post("/add", addEnquiry);
enquiryRouter.get("/getEnquiry/:userId", getEnquiry);
enquiryRouter.put("/updateStatus/:id", updateStatus);
enquiryRouter.post("/addMessage/:id", addMessage);

export default enquiryRouter;