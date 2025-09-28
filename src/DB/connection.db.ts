import chalk from "chalk";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI as string, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(chalk.bgBlue(`MongoDB Connected : ${conn.connection.host}`));
  } catch (error) {
    console.log(
      chalk.bgRed(`MongoDB fail Connected ${(error as Error).message}`)
    );
  }
};

export default connectDB;
