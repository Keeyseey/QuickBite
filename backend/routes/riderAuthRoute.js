import express from "express";
import { riderLogin } from "../controllers/riderAuthController.js";

const riderAuthRouter = express.Router();

riderAuthRouter.post("/login", riderLogin);

export default riderAuthRouter;
