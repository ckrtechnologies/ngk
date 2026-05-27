import { Router } from "express";
import { registerUser, loginUser, addVehicleToGarage, getUserById, addSearchHistory, getUsers, addVehicleToWatchlist, removeFromWatchlist, updateUser, deleteUser, readNotifications, updatePassword, sendOtp, verifyOtp } from "../controller/userController.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.put("/updatePassword", updatePassword);
userRouter.post("/sendOtp", sendOtp);
userRouter.post("/verifyOtp", verifyOtp);
userRouter.get("/user/:id", getUserById);
userRouter.get("/users", getUsers);
userRouter.put("/addVehicleToGarage/:id", addVehicleToGarage);
userRouter.put("/addSearchHistory/:id", addSearchHistory);
userRouter.put("/addVehicleToWatchlist/:id", addVehicleToWatchlist);
userRouter.delete("/removeFromWatchlist/:id/:partId", removeFromWatchlist);
userRouter.put("/updateUser/:id", updateUser);
userRouter.delete("/deleteUser/:id", deleteUser);
userRouter.put("/readNotifications/:id", readNotifications);

export default userRouter;