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
    // Detect production: Render sets RENDER=true, otherwise check NODE_ENV
    const isProd =
      process.env.NODE_ENV === "production" || process.env.RENDER === "true";
res.cookie("token", token, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
});
  }
  if (returnToken) {
    return token;
  }
};

export default generateToken;
