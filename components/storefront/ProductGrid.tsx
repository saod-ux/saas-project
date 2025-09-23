"use client";

import { motion } from "framer-motion";
import MotionProductCard from "./MotionProductCard";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQty: number;
  categoryName?: string;
  imageUrl?: string;
  status?: string;
};

export default function ProductGrid({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd?: (id: string) => void;
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.24, 
        ease: [0.25, 0.46, 0.45, 0.94] as const
      } 
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((p) => (
        <motion.div key={p.id} variants={item}>
          <MotionProductCard 
            id={p.id}
            title={p.title}
            description={p.description}
            price={p.price}
            compareAtPrice={p.compareAtPrice}
            stock={p.stockQty}
            imageUrl={p.imageUrl}
            categoryName={p.categoryName}
            onAdd={onAdd}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}