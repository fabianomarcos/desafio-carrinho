import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) return JSON.parse(storagedCart);

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
      prevCartRef.current = cart;
  });

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
      if (cartPreviousValue !== cart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
        const updatedCart = [...cart];
        const productExists = updatedCart.find((product) => product.id === productId);

        const stock = await api.get(`stock/${productId}`);
        const stockAmount = stock.data.amount;
        const currentAmount = productExists ? productExists.amount : 0;
        const amount = currentAmount + 1;

        if (amount > stockAmount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        if (productExists) productExists.amount = amount;
        else {
            const product = await api.get(`products/${productId}`);
            updatedCart.push({ ...product.data, amount });
        }
        setCart(updatedCart);
        toast.success("Produto adicionado ao carrinho com sucesso!");
    } catch {
        toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
        const removeCart = [...cart];
        const index = removeCart.findIndex((product) => product.id === productId);

        if (index >= 0) {
            removeCart.splice(index, 1);
            setCart(removeCart);
        } else {
            throw Error();
        }
        toast.success("Produto removido do carrinho com sucesso!");
    } catch {
        toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        if(amount <= 0) {
            toast.error('N??o s??o permitidos valores nulos ou negativos!');
            return;
        }

        const stock = await api.get(`stock/${productId}`);
        const stockAmount = stock.data.amount;

        if (amount > stockAmount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        const updateProducts = [...cart];
        const productExists = updateProducts.find((product) => product.id === productId);

        if (productExists) {
            productExists.amount = amount;
            setCart(updateProducts);
            toast.success("Produto editado com sucesso!");
        } else throw Error();
    } catch {
        toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
