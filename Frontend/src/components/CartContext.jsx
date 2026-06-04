import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import toast from "../utils/toastShim";
import { useLanguage } from "../i18n/LanguageProvider";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user._id}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } else {
      setCart([]);
    }
  }, [user]);

  const saveCart = (newCart) => {
    if (user) {
      localStorage.setItem(`cart_${user._id}`, JSON.stringify(newCart));
    }
  };

  const addToCart = (product, quantity = 1) => {
    if (product.quantity < 1) {
      toast.warn(t("productOutOfStock"));
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity }];
      }
      saveCart(newCart);
      toast.success(`${product.name} ${t("addedToCart")}`);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item._id !== productId);
      saveCart(newCart);
      toast.info("Item removed from cart.");
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const value = { cart, addToCart, removeFromCart, clearCart, getCartTotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
