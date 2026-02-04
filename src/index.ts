import express from "express";
import AuthRouter from "./routes/AuthRouter";
import ContestRouter from "./routes/ContestRouter";
const app = express();
app.use(express.json());

app.use("/api/auth/", AuthRouter);
app.use("/api/contests/", ContestRouter);
app.use("/api/problems/", ContestRouter);
app.listen(process.env.PORT);
