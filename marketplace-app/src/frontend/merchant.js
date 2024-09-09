// Event listener for when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Define variables and DOM elements
  const showOrdersButton = document.getElementById("showOrdersButton");
  const ordersList = document.getElementById("ordersList");
  const notificationsList = document.getElementById("notificationsList");
  const chatInput = document.getElementById("chatInput");
  const chatSendButton = document.getElementById("chatSendButton");
  const chatList = document.getElementById("chatList");
  const toggleSupplyRequestsButton = document.getElementById(
    "toggleSupplyRequestsButton"
  );
  const supplyRequestsContainer = document.getElementById(
    "supplyRequestsContainer"
  );
  const supplyRequestsList = document.getElementById("supplyRequestsList");
  const merchantAccountSection = document.getElementById(
    "merchant-account-section"
  );
  const merchantUsername = document.getElementById("merchantUsername");
  const merchantBalance = document.getElementById("merchantBalance");
  const merchantProductListings = document.getElementById(
    "merchantProductListings"
  );
  const merchantOrderHistory = document.getElementById("merchantOrderHistory");
  const requestSupplyButton = document.getElementById("requestSupplyButton");
  const logoutButton = document.getElementById("logoutButton");
  const homeButton = document.getElementById("homeButton");
  const accountButton = document.getElementById("accountButton");
  const addProductButton = document.getElementById("addProductButton");
  const showReceivedSuppliesButton = document.getElementById(
    "showReceivedSuppliesButton"
  );
  const listAllProductsButton = document.getElementById(
    "listAllProductsButton"
  );
  const sendMerchandiseButton = document.getElementById(
    "sendMerchandiseButton"
  );
  const receivedSuppliesList = document.getElementById("receivedSuppliesList");
  const productList = document.getElementById("productList");

  // Get merchant ID from local storage
  const merchantId = localStorage.getItem("userId");

  if (!merchantId) {
    console.error("Merchant ID is not set in local storage");
    return;
  }

  // Initialize WebSocket connection
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { userId: merchantId },
  });

  let ordersVisible = false;
  let suppliesVisible = false;
  let productsVisible = false;

  // Event listener for receiving previous chat messages
  socket.on("previousChats", (chats) => {
    chatList.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("li");
      chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
      chatList.appendChild(chatItem);
    });
  });

  // Event listener for receiving new chat messages
  socket.on("receiveMessage", (chat) => {
    const chatItem = document.createElement("li");
    chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
    chatList.appendChild(chatItem);
  });

  // Event listener for new supply requests
  socket.on("newSupplyRequest", (supply) => {
    displaySupplyRequest(supply);
  });

  // Send chat message
  chatSendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      socket.emit("sendMessage", {
        message,
        userId: merchantId,
        role: "merchant",
      });
      chatInput.value = "";
    }
  });

  // Display notification
  function displayNotification(message) {
    if (!notificationsList) {
      console.error("notificationsList element not found");
      return;
    }
    const listItem = document.createElement("li");
    listItem.textContent = message;
    notificationsList.appendChild(listItem);
  }

  // Show or hide orders list
  showOrdersButton.addEventListener("click", async (event) => {
    event.preventDefault();
    ordersVisible = !ordersVisible;
    if (ordersVisible) {
      await displayUnfulfilledOrders();
      ordersList.style.display = "block";
      showOrdersButton.textContent = "Hide Orders";
    } else {
      ordersList.style.display = "none";
      showOrdersButton.textContent = "Show Orders";
    }
  });

  // Fetch unfulfilled orders from the server
  async function fetchUnfulfilledOrders() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/unfulfilled-orders"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.orders;
    } catch (error) {
      console.error("Error fetching unfulfilled orders:", error);
      return [];
    }
  }

  // Display unfulfilled orders
  async function displayUnfulfilledOrders() {
    const orders = await fetchUnfulfilledOrders();
    ordersList.innerHTML = "";
    orders.forEach((order) => {
      const listItem = document.createElement("div");
      listItem.className = "order-item";
      listItem.innerHTML = `
          <div>
            <span>Order ID: ${order.order_id} - Product ID: ${order.product_id} - Quantity: ${order.quantity}</span>
            <button class="fulfill-button" data-order-id="${order.order_id}" data-product-id="${order.product_id}" data-quantity="${order.quantity}">Fulfill Order</button>
          </div>
        `;
      ordersList.appendChild(listItem);
    });

    // Add event listener to fulfill order buttons
    document.querySelectorAll(".fulfill-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const orderId = button.getAttribute("data-order-id");
        const productId = button.getAttribute("data-product-id");
        const quantity = button.getAttribute("data-quantity");
        const listItem = button.parentElement; // Get the parent element to remove it later

        console.log("Order ID:", orderId); // Debugging statement
        console.log("Product ID:", productId); // Debugging statement
        console.log("Quantity:", quantity); // Debugging statement

        await fulfillOrder(orderId, productId, quantity, listItem);
      });
    });
  }

  // Fulfill an order
  async function fulfillOrder(orderId, productId, quantity, listItem) {
    try {
      console.log("Fulfilling order with payload:", {
        orderId,
        productId,
        quantity,
      }); // Log the payload
      const response = await fetch("http://localhost:3000/api/fulfill-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification("Order fulfilled successfully.");
        listItem.remove(); // Remove the list item from the UI
      } else {
        displayNotification("Failed to fulfill order: " + data.message);
        alert("Failed to fulfill order: " + data.message);
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      displayNotification("An error occurred while fulfilling the order.");
      alert("An error occurred while fulfilling the order.");
    }
  }

  // Fetch supply requests from the server
  async function fetchSupplyRequests() {
    try {
      const response = await fetch(
        `http://localhost:3000/api/merchant-supply-requests?merchantId=${merchantId}`
      );
      const data = await response.json();
      supplyRequestsList.innerHTML = "";
      data.requests.forEach((request) => {
        displaySupplyRequest(request);
      });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
    }
  }

  // Display a single supply request
  function displaySupplyRequest(request) {
    const listItem = document.createElement("li");
    listItem.textContent = `${request.product_name} - Quantity: ${
      request.quantity
    } - Requested on: ${new Date(
      request.request_date
    ).toLocaleString()} - Status: ${request.status}`;
    supplyRequestsList.appendChild(listItem);
  }

  // Request supply
  async function requestSupply(productId, quantity) {
    try {
      const response = await fetch("http://localhost:3000/api/request-supply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantId, productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(
          `Requested ${quantity} units of product ID ${productId}`
        );
        socket.emit("newSupplyRequest", data.request); // Emit new supply request

        // Clear the input fields
        document.getElementById("productIdToRequest").value = "";
        document.getElementById("quantityToRequest").value = "";
      } else {
        displayNotification(`Failed to request supply: ${data.message}`);
      }
    } catch (error) {
      console.error("Error requesting supply:", error);
      displayNotification("An error occurred while requesting supply.");
    }
  }

  // Event listener for request supply button
  requestSupplyButton.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = document.getElementById("productIdToRequest").value;
    const quantity = parseInt(
      document.getElementById("quantityToRequest").value
    );
    if (productId && quantity) {
      requestSupply(productId, quantity);
    } else {
      displayNotification("Please enter a valid product ID and quantity.");
    }
  });

  // Clear input fields for adding a new product
  function clearInputFields() {
    document.getElementById("productName").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
    document.getElementById("productImageUrl").value = "";
  }

  // Event listener for logging out
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });

  // Event listener for home button
  homeButton.addEventListener("click", () => {
    window.location.href = "marketplace.html";
  });

  // Event listener for account button to display merchant account info
  accountButton.addEventListener("click", async () => {
    await displayMerchantAccountInfo();
  });

  // Fetch merchant data from the server
  async function fetchMerchantData(merchantId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/account-info?userId=${merchantId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.success) {
        return data.account;
      } else {
        console.error("Failed to fetch merchant data:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching merchant data:", error);
      return null;
    }
  }

  // Display merchant account information
  async function displayMerchantAccountInfo() {
    const merchantData = await fetchMerchantData(merchantId);
    if (merchantData) {
      merchantUsername.textContent = merchantData.username || "N/A";
      const balance = parseFloat(merchantData.balance);
      merchantBalance.textContent = isNaN(balance)
        ? "0.00"
        : balance.toFixed(2);
      merchantProductListings.innerHTML = ""; // Assuming you might want to add product listings here
      merchantOrderHistory.innerHTML = ""; // Assuming you might want to add order history here
    } else {
      merchantUsername.textContent = "N/A";
      merchantBalance.textContent = "0.00";
      merchantProductListings.innerHTML = "<li>No products found.</li>";
      merchantOrderHistory.innerHTML = "<li>No order history found.</li>";
    }

    // Show account section and hide other sections if necessary
    merchantAccountSection.style.display = "block";
    document.getElementById("addProductContainer").style.display = "none";
    document.getElementById("requestSupplyContainer").style.display = "none";
    document.getElementById("sendMerchandiseContainer").style.display = "none";
    chatContainer.style.display = "none";
  }

  // Add a new product
  async function addProduct(name, description, price, stock, imageUrl) {
    try {
      const response = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          stock,
          image_url: imageUrl,
        }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(`Product "${name}" added successfully.`);
        clearInputFields();
      } else {
        displayNotification(`Failed to add product: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }

  // Fetch received supplies from the server
  async function fetchReceivedSupplies() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/received-supplies",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      return data.supplies;
    } catch (error) {
      console.error("Error fetching received supplies:", error);
      return [];
    }
  }

  // Display received supplies
  async function displayReceivedSupplies() {
    const supplies = await fetchReceivedSupplies();
    receivedSuppliesList.innerHTML = "";
    supplies.forEach((supply) => {
      const price = parseFloat(supply.price);
      const listItem = document.createElement("div");
      listItem.className = "supply-item";
      listItem.innerHTML = `
          <div>
            <img src="${supply.image_url}" alt="${
        supply.name
      }" width="50" height="50">
            <span>${supply.name} - ${supply.description} - $${
        !isNaN(price) ? price.toFixed(2) : "N/A"
      } - Stock: ${supply.stock}</span>
          </div>
        `;
      receivedSuppliesList.appendChild(listItem);
    });
    receivedSuppliesList.style.display = "block";
  }

  // Fetch all products from the server
  async function fetchAllProducts() {
    try {
      const response = await fetch("http://localhost:3000/api/products", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Display all products
  async function displayAllProducts() {
    const products = await fetchAllProducts();
    productList.innerHTML = "";
    if (products && products.length > 0) {
      products.forEach((product) => {
        const price = parseFloat(product.price);
        const productItem = document.createElement("div");
        productItem.className = "product-item";
        productItem.innerHTML = `
            <div>
              <img src="${product.image_url}" alt="${
          product.name
        }" width="50" height="50">
              <span>${product.name} - ${product.description} - $${
          !isNaN(price) ? price.toFixed(2) : "N/A"
        } - Stock: ${product.stock}</span>
            </div>
          `;
        productList.appendChild(productItem);
      });
    } else {
      productList.innerHTML = "<p>No products found.</p>";
    }
    productList.style.display = "block";
  }

  // Fetch purchased items from the server
  async function fetchPurchasedItems() {
    try {
      const response = await fetch("http://localhost:3000/api/purchased-items");
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching purchased items:", error);
      return [];
    }
  }

  // Display purchased items
  async function displayPurchasedItems() {
    const items = await fetchPurchasedItems();
    ordersList.innerHTML = "";
    items.forEach((item) => {
      const listItem = document.createElement("div");
      listItem.className = "order-item";
      listItem.innerHTML = `
          <div>
            <span>Order ID: ${item.id} - Product ID: ${item.product_id} - Quantity: ${item.quantity} - Spent: $${item.spent}</span>
            <button class="fulfill-button" data-order-id="${item.id}" data-product-id="${item.product_id}" data-quantity="${item.quantity}">Fulfill Order</button>
          </div>
        `;
      ordersList.appendChild(listItem);
    });

    // Add event listener to fulfill order buttons
    document.querySelectorAll(".fulfill-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const orderId = button.getAttribute("data-order-id");
        const productId = button.getAttribute("data-product-id");
        const quantity = button.getAttribute("data-quantity");
        const listItem = button.parentElement; // Get the parent element to remove it later
        await fulfillOrder(orderId, productId, quantity, listItem);
      });
    });

    ordersList.style.display = "block";
  }

  // Event listener for add product button
  addProductButton.addEventListener("click", (event) => {
    event.preventDefault();
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const stock = parseInt(document.getElementById("productStock").value);
    const imageUrl = document.getElementById("productImageUrl").value;
    addProduct(name, description, price, stock, imageUrl);
  });

  // Event listener for show received supplies button
  showReceivedSuppliesButton.addEventListener("click", (event) => {
    event.preventDefault();
    suppliesVisible = !suppliesVisible;
    if (suppliesVisible) {
      displayReceivedSupplies();
    } else {
      receivedSuppliesList.style.display = "none";
    }
  });

  // Event listener for list all products button
  listAllProductsButton.addEventListener("click", async (event) => {
    event.preventDefault();
    productsVisible = !productsVisible;
    if (productsVisible) {
      await displayAllProducts();
      listAllProductsButton.textContent = "Hide All Products";
    } else {
      productList.style.display = "none";
      listAllProductsButton.textContent = "List All Products";
    }
  });

  // Event listener for send merchandise button
  sendMerchandiseButton.addEventListener("click", (event) => {
    event.preventDefault();
    const customerId = document.getElementById("customerId").value;
    const productId = document.getElementById("productIdToSend").value;
    const quantity = parseInt(document.getElementById("quantityToSend").value);
    sendMerchandise(customerId, productId, quantity);
  });

  // Send merchandise to a customer
  async function sendMerchandise(customerId, productId, quantity) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/send-merchandise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customerId, productId, quantity }),
        }
      );
      const data = await response.json();
      if (data.success) {
        displayNotification(
          `Sent ${quantity} units of product ID ${productId} to customer ID ${customerId}`
        );
        // Clear the input fields
        document.getElementById("customerId").value = "";
        document.getElementById("productIdToSend").value = "";
        document.getElementById("quantityToSend").value = "";
      } else {
        displayNotification(`Failed to send merchandise: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending merchandise:", error);
      displayNotification("An error occurred while sending merchandise.");
    }
  }

  // Initial fetch of supply requests
  fetchSupplyRequests();
});
