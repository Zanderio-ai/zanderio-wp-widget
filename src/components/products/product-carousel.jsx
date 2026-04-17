/**
 * Zanderio Widget — ProductCarousel
 *
 * Renders product cards with minimal previous/next controls when multiple
 * products are present.
 *
 * Layout rules
 * ------------
 * • 1 product  → simple single-card layout.
 * • > 1 product → one-card viewport with store-themed arrow controls.
 *
 * @param {{ products: object[], onAddToCart: Function }} props
 *
 * @module components/products/product-carousel
 */

import { useEffect, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import ProductCard from "./product-card";

const ProductCarousel = ({ products, onAddToCart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const productList = products || [];
  const maxIndex = Math.max(productList.length - 1, 0);

  useEffect(() => {
    setCurrentIndex((previous) => Math.min(previous, maxIndex));
  }, [maxIndex]);

  if (!productList.length) {
    return null;
  }

  if (productList.length === 1) {
    return (
      <div className="products-wrapper-simple">
        {productList.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSingle
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="product-carousel-container">
      <div className="product-carousel-toolbar">
        <div className="product-carousel-status" aria-live="polite">
          {currentIndex + 1} / {productList.length}
        </div>

        <div className="product-carousel-controls" aria-label="Browse products">
          <button
            type="button"
            className="product-carousel-btn"
            onClick={() =>
              setCurrentIndex((previous) => Math.max(previous - 1, 0))
            }
            disabled={currentIndex === 0}
            aria-label="Previous product"
          >
            <IoChevronBack size={16} />
          </button>

          <button
            type="button"
            className="product-carousel-btn"
            onClick={() =>
              setCurrentIndex((previous) => Math.min(previous + 1, maxIndex))
            }
            disabled={currentIndex >= maxIndex}
            aria-label="Next product"
          >
            <IoChevronForward size={16} />
          </button>
        </div>
      </div>

      <div
        className="products-viewport"
        role="region"
        aria-label={`Product results (${productList.length} items)`}
      >
        <div
          className="products-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {productList.map((product) => (
            <div className="product-slide" key={product.id}>
              <ProductCard
                product={product}
                isSingle={false}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
