import express from "express";
import AuthRouter from "./routes/AuthRouter";
const app = express();
app.use(express.json());

app.use("/api/auth/", AuthRouter);

app.listen(process.env.PORT || 3000);
