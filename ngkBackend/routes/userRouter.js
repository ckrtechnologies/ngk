import { Router } from "express";
import { registerUser, loginUser, addVehicleToGarage, getUserById, addSearchHistory, getUsers, addVehicleToWatchlist, removeFromWatchlist, updateUser, deleteUser } from "../controller/userController.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/user/:id", getUserById);
userRouter.get("/users", getUsers);
userRouter.put("/addVehicleToGarage/:id", addVehicleToGarage);
userRouter.put("/addSearchHistory/:id", addSearchHistory);
userRouter.put("/addVehicleToWatchlist/:id", addVehicleToWatchlist);
userRouter.delete("/removeFromWatchlist/:id/:partId", removeFromWatchlist);
userRouter.put("/updateUser/:id", updateUser);
userRouter.delete("/deleteUser/:id", deleteUser);

export default userRouter;