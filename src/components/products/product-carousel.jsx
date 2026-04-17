/**
 * Zanderio Widget — ProductCarousel
 *
 * Horizontal swipe rail for displaying product cards side-by-side.
 *
 * Layout rules
 * ------------
 * • 1 product  → simple single-card layout.
 * • > 1 product → native horizontal scrolling with scroll snapping and a
 *   gesture hint instead of explicit arrow controls.
 *
 * @param {{ products: object[], onAddToCart: Function }} props
 *
 * @module components/products/product-carousel
 */

import ProductCard from "./product-card";

const ProductCarousel = ({ products, onAddToCart }) => {
  if (!products?.length) {
    return null;
  }

  if (products.length === 1) {
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

  return (
    <div className="product-carousel-container">
      <div className="product-rail-hint" aria-hidden="true">
        Swipe to browse
      </div>

      <div className="product-rail-shell">
        <div
          className="products-rail"
          role="region"
          aria-label={`Product results (${products.length} items)`}
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
    </div>
  );
};

export default ProductCarousel;
