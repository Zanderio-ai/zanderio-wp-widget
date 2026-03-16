/**
 * Zanderio Widget — ProductCarousel
 *
 * Horizontal carousel for displaying multiple product cards side-by-side.
 *
 * Layout rules
 * ------------
 * • ≤ 2 products → simple flex row, no navigation controls.
 * • > 2 products → sliding track with prev/next arrow buttons and a
 *   page indicator (e.g. “1 - 2 of 5”).  Each click shifts by one card
 *   width (260 px + 16 px gap).
 *
 * @param {{ products: object[], onAddToCart: Function }} props
 *
 * @module components/products/product-carousel
 */

import { useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import ProductCard from "./product-card";

const ProductCarousel = ({ products, onAddToCart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerPage = 2;
  const maxIndex = products.length - 1;

  if (products.length <= cardsPerPage) {
    return (
      <div className="products-wrapper-simple">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSingle={false}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    );
  }

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex >= maxIndex;

  return (
    <div className="product-carousel-container">
      <button
        className="carousel-nav-btn carousel-nav-prev"
        onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        disabled={isAtStart}
        style={{ opacity: isAtStart ? 0.3 : 1 }}
      >
        <IoChevronBack size={24} color="#7b4dff" />
      </button>

      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * (260 + 16)}px)`,
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSingle={false}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>

      <button
        className="carousel-nav-btn carousel-nav-next"
        onClick={() => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))}
        disabled={isAtEnd}
        style={{ opacity: isAtEnd ? 0.3 : 1 }}
      >
        <IoChevronForward size={24} color="#7b4dff" />
      </button>

      <div className="carousel-dots">
        <span className="carousel-page-indicator">
          {currentIndex + 1} -{" "}
          {Math.min(currentIndex + cardsPerPage, products.length)} of{" "}
          {products.length}
        </span>
      </div>
    </div>
  );
};

export default ProductCarousel;
