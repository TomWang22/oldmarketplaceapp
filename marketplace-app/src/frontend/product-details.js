document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const cartItemCount = document.getElementById("cartItemCount");
  const userId = localStorage.getItem("userId");
  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });

  // Fetch product details from server
  async function fetchProductDetails(productId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${productId}`
      );
      const data = await response.json();
      if (data.success) {
        return data.product;
      } else {
        throw new Error(data.message || "Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      return null;
    }
  }

  // Fetch product reviews from server
  async function fetchProductReviews(productId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/reviews?productId=${productId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const reviews = await response.json();
      return reviews;
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      return [];
    }
  }

  // Fetch cart items from server
  async function fetchCartItems() {
    try {
      const response = await fetch(
        `http://localhost:3000/api/cart?userId=${userId}`
      );
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }
  }

  // Update cart item count
  async function updateCartItemCount() {
    const cartItems = await fetchCartItems();
    const itemCount = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cartItemCount.textContent = itemCount;
  }

  // Display product details on the page
  async function displayProductDetails() {
    try {
      const product = await fetchProductDetails(productId);
      if (!product) throw new Error("Product not found");

      const productDetailsSection = document.querySelector("#product-details");

      // Ensure product.price is a number before using toFixed
      const price =
        !isNaN(parseFloat(product.price)) && isFinite(product.price)
          ? parseFloat(product.price).toFixed(2)
          : "N/A";

      productDetailsSection.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <h1>${product.name}</h1>
        <p>${product.description}</p>
        <p>$${price}</p>
        <label for="sizeSelect">Select Size:</label>
        <select id="sizeSelect">${getSizeOptions(product.name)
          .map((size) => `<option value="${size}">${size}</option>`)
          .join("")}</select>
        <label for="quantityInput">Quantity:</label>
        <input type="number" id="quantityInput" min="1" value="1">
        <button id="addToCartButton">Add to Cart</button>
      `;
      document
        .getElementById("addToCartButton")
        .addEventListener("click", async () => {
          await addToCart(product.id);
        });

      displayProductReviews(productId);
      displayRelatedProducts(product);
    } catch (error) {
      console.error("Error displaying product details:", error);
    }
  }

  // Add product to cart
  async function addToCart(productId) {
    const size = document.getElementById("sizeSelect").value;
    const quantity = parseInt(
      document.getElementById("quantityInput").value,
      10
    );
    try {
      const response = await fetch("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, productId, quantity, size }),
      });
      const data = await response.json();
      if (data.success) {
        await updateCartItemCount();
        alert("Item added to cart");
      } else {
        alert("Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      alert("Error adding item to cart");
    }
  }

  // Highlight keywords in review text
  function highlightKeywords(reviewText, keywords) {
    let highlightedText = reviewText;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<span class="highlight">$1</span>'
      );
    });
    return highlightedText;
  }

  // Display product reviews
  async function displayProductReviews(productId) {
    const reviewsList = document.getElementById("reviews-list");
    const reviewsSummary = document.getElementById("reviews-summary");
    try {
      const reviews = await fetchProductReviews(productId);

      if (reviews.length === 0) {
        reviewsList.innerHTML = "<p>No reviews available.</p>";
        reviewsSummary.innerHTML =
          "<p>Average Rating: N/A</p><p>Total Reviews: 0</p>";
        return;
      }

      reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

      const averageRating = (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(2);
      reviewsSummary.innerHTML = `<p>Average Rating: ${averageRating}</p><p>Total Reviews: ${reviews.length}</p>`;

      reviewsList.innerHTML = "";
      reviews.forEach((review) => {
        const reviewElement = document.createElement("div");
        reviewElement.className = "review";
        reviewElement.innerHTML = `
          <p><strong>${review.username}:</strong> ${highlightKeywords(
          review.text,
          ["great", "good", "bad", "excellent"]
        )}</p>
          <p>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</p>
          <p><small>${new Date(review.date).toLocaleDateString()}</small></p>
        `;
        reviewsList.appendChild(reviewElement);
      });
    } catch (error) {
      console.error("Error displaying reviews:", error);
    }
  }

  // Display related products
  async function displayRelatedProducts(product) {
    const relatedProductsList = document.getElementById(
      "related-products-list"
    );
    try {
      const response = await fetch(
        `http://localhost:3000/api/products?exclude=${product.id}`
      );
      const data = await response.json();

      if (!data.success || !Array.isArray(data.products)) {
        throw new Error("Expected an array of products");
      }

      relatedProductsList.innerHTML = data.products
        .slice(0, 3)
        .map(
          (relatedProduct) => `
        <div class="related-product">
          <img src="${relatedProduct.image_url}" alt="${relatedProduct.name}">
          <p>${relatedProduct.name}</p>
          <p>$${
            !isNaN(parseFloat(relatedProduct.price)) &&
            isFinite(relatedProduct.price)
              ? parseFloat(relatedProduct.price).toFixed(2)
              : "N/A"
          }</p>
        </div>`
        )
        .join("");
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  }

  // Generate size options based on product type
  function getSizeOptions(productType) {
    const sizeOptionsMap = {
      suit: [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      tux: [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      "black tux": [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      tuxedo: [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      "sport coat": [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      "dress suit": [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      blazer: [
        "36 Short",
        "36 Regular",
        "36 Long",
        "38 Short",
        "38 Regular",
        "38 Long",
        "40 Short",
        "40 Regular",
        "40 Long",
        "42 Short",
        "42 Regular",
        "42 Long",
        "44 Short",
        "44 Regular",
        "44 Long",
        "46 Short",
        "46 Regular",
        "46 Long",
        "48 Short",
        "48 Regular",
        "48 Long",
        "50 Short",
        "50 Regular",
        "50 Long",
      ],
      "dress shirt": ["XS", "S", "M", "L", "XL"],
      "short sleeve shirt": ["XS", "S", "M", "L", "XL"],
      "short sleeve dress shirt": ["XS", "S", "M", "L", "XL"],
      shirt: ["XS", "S", "M", "L", "XL"],
    };

    const cleanedProductType = productType.toLowerCase().trim();
    for (const keyword in sizeOptionsMap) {
      if (cleanedProductType.includes(keyword)) {
        return sizeOptionsMap[keyword];
      }
    }
    return ["One Size"];
  }

  displayProductDetails();
  updateCartItemCount();
});
