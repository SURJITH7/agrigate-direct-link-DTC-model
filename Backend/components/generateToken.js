import jwt from "jsonwebtoken";

// If res is provided, set cookie. If returnToken is true, return token string.
const generateToken = (res, userId, returnToken = false) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not set. Please check your .env file and restart the server.",
    );
  }
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  if (res) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  }
  if (returnToken) {
    return token;
  }
};

export default generateToken;
