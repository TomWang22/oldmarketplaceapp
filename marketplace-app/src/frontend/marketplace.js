// Wait for the DOM to fully load before executing the script
document.addEventListener("DOMContentLoaded", () => {
  // Retrieve user information from local storage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Get references to various DOM elements
  const productGrid = document.querySelector(".product-listings .product-grid");
  const cartItemCount = document.getElementById("cartItemCount");
  const homeButton = document.getElementById("homeButton");
  const accountButton = document.getElementById("accountButton");
  const searchInput = document.querySelector(".search-bar");
  const priceFilter = document.getElementById("priceFilter");
  const itemsPerPageSelect = document.getElementById("itemsPerPage");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const pageIndicator = document.getElementById("pageIndicator");
  const productList = document.getElementById("product-listings");
  const marketplaceSection = document.getElementById("marketplace-section");
  const accountSection = document.getElementById("account-section");
  const userBalance = document.getElementById("userBalance");
  const shoppingHistory = document.getElementById("shoppingHistory");
  const searchHistory = document.getElementById("searchHistory");

  // Initialize variables for product handling and pagination
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  let itemsPerPage = parseInt(itemsPerPageSelect.value, 10);

  // Define URLs for different user roles
  const homeUrls = {
    merchant: "merchant.html",
    supplier: "supplier.html",
    shopper: "shopper.html",
  };

  // Event listener for home button click to redirect based on user role
  homeButton.addEventListener("click", () => {
    const homeUrl = homeUrls[role] || "marketplace.html";
    window.location.href = homeUrl;
  });

  // Event listener for account button click to display account section
  accountButton.addEventListener("click", async () => {
    marketplaceSection.style.display = "none";
    accountSection.style.display = "block";
    hideMarketplaceControls();
    await displayAccountInfo();
  });

  // Event listener for search input to handle search queries on Enter key press
  searchInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      const searchQuery = searchInput.value.trim().toLowerCase();
      if (searchQuery) {
        await saveSearchHistory(userId, searchQuery);
        window.location.href = `search-results.html?query=${encodeURIComponent(
          searchQuery
        )}`;
      }
    }
  });

  // Event listener for price filter change to filter and display products
  priceFilter.addEventListener("change", () => {
    currentPage = 1;
    filterAndDisplayProducts();
  });

  // Event listener for items per page selection change to update displayed products
  itemsPerPageSelect.addEventListener("change", () => {
    itemsPerPage = parseInt(itemsPerPageSelect.value, 10);
    currentPage = 1;
    displayProducts();
  });

  // Event listener for previous page button to navigate to the previous page
  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayProducts();
    }
  });

  // Event listener for next page button to navigate to the next page
  nextPageButton.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayProducts();
    }
  });

  // Fetch user data from the server
  async function fetchUserData(userId) {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        return data.user;
      } else {
        console.error("Failed to fetch user data:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  // Display user account information
  async function displayAccountInfo() {
    const userData = await fetchUserData(userId);
    if (userData) {
      const balance = parseFloat(userData.balance);
      userBalance.textContent = isNaN(balance) ? "0.00" : balance.toFixed(2);
      shoppingHistory.innerHTML = userData.shoppingHistory
        .map(
          (item) =>
            `<li>Order #${item.id} - Product ID: ${item.product_id} - Quantity: ${item.quantity} - Date: ${item.purchase_date}</li>`
        )
        .join("");
      searchHistory.innerHTML = userData.searchHistory
        .map(
          (item) =>
            `<li>Search Query: ${item.search_query} - Date: ${item.search_date}</li>`
        )
        .join("");
    } else {
      userBalance.textContent = "0.00";
      shoppingHistory.innerHTML = "<li>No shopping history found.</li>";
      searchHistory.innerHTML = "<li>No search history found.</li>";
    }
  }

  // Save search history to the server
  async function saveSearchHistory(userId, searchQuery) {
    try {
      const response = await fetch("http://localhost:3000/api/search-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, searchQuery }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to save search history");
      }
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  }

  // Fetch products from the server
  async function fetchProducts() {
    try {
      console.log("Fetching products...");
      const response = await fetch("http://localhost:3000/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Fetched products:", data);
      return data.products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Fetch cart items from the server
  async function fetchCartItems() {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(
        `http://localhost:3000/api/cart?userId=${userId}`
      );
      const data = await response.json();
      return data.items.map((item) => ({
        ...item,
        productId: item.product_id,
      }));
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }
  }

  // Add a product to the cart
  async function addToCart(productId) {
    const userId = localStorage.getItem("userId");
    const cartItems = await fetchCartItems();
    const existingItem = cartItems.find((item) => item.productId === productId);

    if (existingItem) {
      await updateCartItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      try {
        const response = await fetch("http://localhost:3000/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId, quantity: 1 }),
        });
        const data = await response.json();
        if (data.success) {
          alert("Item added to cart!");
        } else {
          alert("Failed to add item to cart.");
        }
      } catch (error) {
        console.error("Error adding item to cart:", error);
        alert("Error adding item to cart.");
      }
    }

    updateCartItemCount();
  }

  // Update the quantity of an item in the cart
  async function updateCartItemQuantity(itemId, quantity) {
    try {
      await fetch(`http://localhost:3000/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  }

  // Filter products based on selected price range and display them
  function filterAndDisplayProducts() {
    const priceRange = priceFilter.value;
    filteredProducts = allProducts.filter((product) => {
      const price = product.price;
      switch (priceRange) {
        case "0-50":
          return price >= 0 && price <= 50;
        case "51-100":
          return price >= 51 && price <= 100;
        case "101-200":
          return price >= 101 && price <= 200;
        case "200+":
          return price > 200;
        default:
          return true;
      }
    });
    displayProducts();
  }

  // Display products based on the current page and items per page
  function displayProducts() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);

    productGrid.innerHTML = "";
    productsToDisplay.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "product";

      // Ensure product.price is a number before calling toFixed
      const price = parseFloat(product.price);

      productElement.innerHTML = `
              <img src="${product.image_url}" alt="${product.name}">
              <h3>${product.name}</h3>
              <p>$${!isNaN(price) ? price.toFixed(2) : "N/A"}</p>
              <button class="view-details" data-id="${
                product.id
              }">View Details</button>
          `;
      productGrid.appendChild(productElement);
    });

    // Add event listeners to view details buttons
    document.querySelectorAll(".view-details").forEach((button) => {
      button.addEventListener("click", (event) => {
        const productId = event.target.getAttribute("data-id");
        window.location.href = `product-details.html?id=${productId}`;
      });
    });

    // Update the page indicator with the current page and total pages
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  // Initialize the marketplace by fetching and displaying products
  async function init() {
    allProducts = await fetchProducts();
    filteredProducts = allProducts;
    filterAndDisplayProducts();
    displayProducts();
  }

  // Update the cart item count displayed on the page
  async function updateCartItemCount() {
    const cartItems = await fetchCartItems();
    cartItemCount.textContent = cartItems.length;
  }

  // Hide marketplace-specific controls when viewing the account section
  function hideMarketplaceControls() {
    // Add logic to hide any marketplace-specific controls
    priceFilter.style.display = "none";
    itemsPerPageSelect.style.display = "none";
    prevPageButton.style.display = "none";
    nextPageButton.style.display = "none";
    searchInput.style.display = "none";
  }

  // Call init and updateCartItemCount functions when the DOM is fully loaded
  init();
  updateCartItemCount();
});
