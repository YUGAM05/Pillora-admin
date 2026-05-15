/**
 * Shopping Cart Management
 * Handles cart operations using cross-platform storage
 * (cookies → localStorage → in-memory fallback)
 */
import { storageGet, storageSet, storageRemove } from '@/lib/tokenStorage';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    quantity: number;
    stock: number;
}

/**
 * Get all cart items from storage
 */
export const getCartItems = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const cart = storageGet('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error reading cart:', error);
        return [];
    }
};

/**
 * Add item to cart or increase quantity if already exists
 */
export const addToCart = (item: Omit<CartItem, 'quantity'>): CartItem[] => {
    const cart = getCartItems();
    const existingIndex = cart.findIndex(i => i.productId === item.productId);

    if (existingIndex > -1) {
        // Item exists, increase quantity
        cart[existingIndex].quantity += 1;
    } else {
        // New item, add to cart
        cart.push({ ...item, quantity: 1 });
    }

    storageSet('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart:updated'));
    return cart;
};

/**
 * Update item quantity in cart
 */
export const updateCartQuantity = (productId: string, quantity: number): void => {
    const cart = getCartItems();
    const item = cart.find(i => i.productId === productId);

    if (item) {
        // Ensure quantity is between 1 and stock
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
        storageSet('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart:updated'));
    }
};

/**
 * Remove item from cart
 */
export const removeFromCart = (productId: string): void => {
    const cart = getCartItems().filter(i => i.productId !== productId);
    storageSet('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart:updated'));
};

/**
 * Get total number of items in cart
 */
export const getCartCount = (): number => {
    return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
};

/**
 * Get cart total price
 */
export const getCartTotal = (): number => {
    return getCartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

/**
 * Clear entire cart
 */
export const clearCart = (): void => {
    storageRemove('cart');
    storageRemove('cartCount'); // Clean up old system
    window.dispatchEvent(new Event('cart:updated'));
};

